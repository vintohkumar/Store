import logging
import random
import re
import smtplib
import time
from email.message import EmailMessage
from base64 import b64encode
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from os import getenv
from pathlib import Path

from flask import Flask, jsonify, request, g
from flask_cors import CORS
import requests
from werkzeug.exceptions import HTTPException

from db import check_connection, initialize_database

app = Flask(__name__)
CORS(app)
LOG_DIR = Path(__file__).resolve().parents[1] / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
SERVER_LOG_FILE = LOG_DIR / "server_logs.txt"


def _configure_logging():
    formatter = logging.Formatter("%(asctime)s | %(levelname)s | %(message)s")
    file_handler = logging.FileHandler(SERVER_LOG_FILE, encoding="utf-8")
    file_handler.setFormatter(formatter)
    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Avoid duplicate handlers on Flask debug reload.
    for handler in list(root_logger.handlers):
        if isinstance(handler, logging.FileHandler) and getattr(handler, "baseFilename", "") == str(
            SERVER_LOG_FILE
        ):
            return

    root_logger.addHandler(file_handler)
    root_logger.addHandler(stream_handler)


_configure_logging()
logger = logging.getLogger(__name__)
OTP_TTL_MINUTES = 5
OTP_STORE = {}
OTP_SECRET = getenv("OTP_SECRET", "change-me-in-production")
OTP_EXPOSE_DEV_CODE = getenv("OTP_EXPOSE_DEV_CODE", "true").lower() == "true"
OTP_RESEND_COOLDOWN_SECONDS = int(getenv("OTP_RESEND_COOLDOWN_SECONDS", "30"))
OTP_MAX_SEND_PER_HOUR = int(getenv("OTP_MAX_SEND_PER_HOUR", "8"))
SENSITIVE_FIELDS = {"otp", "password", "token", "auth_token", "secret"}


def _hash_otp(identifier: str, otp: str) -> str:
    return sha256(f"{identifier}|{otp}|{OTP_SECRET}".encode("utf-8")).hexdigest()


def _masked(value: str) -> str:
    if not value:
        return ""
    if len(value) <= 4:
        return "*" * len(value)
    return f"{value[:2]}{'*' * (len(value) - 4)}{value[-2:]}"


def _sanitize_payload(payload):
    if isinstance(payload, dict):
        cleaned = {}
        for key, value in payload.items():
            if str(key).lower() in SENSITIVE_FIELDS:
                cleaned[key] = "***"
            else:
                cleaned[key] = _sanitize_payload(value)
        return cleaned
    if isinstance(payload, list):
        return [_sanitize_payload(item) for item in payload]
    return payload


def _provider_health():
    twilio_sid = getenv("TWILIO_ACCOUNT_SID", "").strip()
    twilio_token = getenv("TWILIO_AUTH_TOKEN", "").strip()
    twilio_from = getenv("TWILIO_FROM_NUMBER", "").strip()

    smtp_host = getenv("SMTP_HOST", "").strip()
    smtp_port = int(getenv("SMTP_PORT", "587"))
    smtp_user = getenv("SMTP_USERNAME", "").strip()
    smtp_pass = getenv("SMTP_PASSWORD", "").strip()
    smtp_from = getenv("SMTP_FROM_EMAIL", "").strip()
    smtp_use_tls = getenv("SMTP_USE_TLS", "true").lower() == "true"

    twilio_ready = bool(twilio_sid and twilio_token and twilio_from)
    smtp_ready = bool(smtp_host and smtp_from and (smtp_user == "" or smtp_pass != ""))

    overall = "ok" if twilio_ready and smtp_ready else "partial"

    return {
        "status": overall,
        "otp": {
            "ttl_minutes": OTP_TTL_MINUTES,
            "resend_cooldown_seconds": OTP_RESEND_COOLDOWN_SECONDS,
            "max_send_per_hour": OTP_MAX_SEND_PER_HOUR,
            "dev_code_exposed": OTP_EXPOSE_DEV_CODE,
        },
        "providers": {
            "twilio": {
                "configured": twilio_ready,
                "account_sid": _masked(twilio_sid),
                "from_number": _masked(twilio_from),
            },
            "smtp": {
                "configured": smtp_ready,
                "host": smtp_host,
                "port": smtp_port,
                "from_email": smtp_from,
                "username": _masked(smtp_user),
                "use_tls": smtp_use_tls,
            },
        },
    }


def _send_email_otp(identifier: str, otp: str):
    smtp_host = getenv("SMTP_HOST", "").strip()
    smtp_port = int(getenv("SMTP_PORT", "587"))
    smtp_user = getenv("SMTP_USERNAME", "").strip()
    smtp_pass = getenv("SMTP_PASSWORD", "").strip()
    smtp_sender = getenv("SMTP_FROM_EMAIL", smtp_user).strip()
    use_tls = getenv("SMTP_USE_TLS", "true").lower() == "true"

    if not smtp_host or not smtp_sender:
        raise ValueError("SMTP configuration missing. Set SMTP_HOST and SMTP_FROM_EMAIL.")

    message = EmailMessage()
    message["Subject"] = "Your Vastra Atelier OTP Code"
    message["From"] = smtp_sender
    message["To"] = identifier
    message.set_content(
        f"Your OTP is {otp}. It is valid for {OTP_TTL_MINUTES} minutes. "
        "If you did not request this, please ignore this email."
    )

    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as smtp:
        if use_tls:
            smtp.starttls()
        if smtp_user:
            smtp.login(smtp_user, smtp_pass)
        smtp.send_message(message)


def _send_sms_otp(identifier: str, otp: str):
    account_sid = getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_number = getenv("TWILIO_FROM_NUMBER", "").strip()

    if not account_sid or not auth_token or not from_number:
        raise ValueError(
            "Twilio configuration missing. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER."
        )

    to_number = identifier if identifier.startswith("+") else f"+91{identifier}"
    endpoint = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    body = (
        f"Your Vastra Atelier OTP is {otp}. Valid for {OTP_TTL_MINUTES} minutes. "
        "Do not share this code."
    )
    auth_header = b64encode(f"{account_sid}:{auth_token}".encode("utf-8")).decode("utf-8")

    response = requests.post(
        endpoint,
        headers={"Authorization": f"Basic {auth_header}"},
        data={"To": to_number, "From": from_number, "Body": body},
        timeout=15,
    )

    if response.status_code >= 400:
        raise ValueError(f"SMS provider error: {response.status_code} {response.text}")


def _can_send_otp(entry):
    now = datetime.now(timezone.utc)
    if not entry:
        return True, ""

    last_sent_at = entry.get("last_sent_at")
    if last_sent_at and (now - last_sent_at).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
        wait_seconds = OTP_RESEND_COOLDOWN_SECONDS - int((now - last_sent_at).total_seconds())
        return False, f"Please wait {max(wait_seconds, 1)} seconds before requesting another OTP."

    window_start = entry.get("window_start", now)
    send_count = entry.get("send_count", 0)
    if now - window_start > timedelta(hours=1):
        return True, ""

    if send_count >= OTP_MAX_SEND_PER_HOUR:
        return False, "Too many OTP requests. Try again after one hour."

    return True, ""

try:
    initialize_database()
except Exception as exc:
    logger.warning("Database initialization skipped: %s", exc)

logger.info("Server logging initialized. log_file=%s", SERVER_LOG_FILE)


@app.before_request
def before_request_logging():
    g.request_start_ts = time.perf_counter()
    payload = request.get_json(silent=True)
    sanitized = _sanitize_payload(payload) if payload is not None else None
    logger.info(
        "REQUEST start method=%s path=%s ip=%s args=%s payload=%s",
        request.method,
        request.path,
        request.remote_addr,
        dict(request.args),
        sanitized,
    )


@app.after_request
def after_request_logging(response):
    started = getattr(g, "request_start_ts", None)
    elapsed_ms = round((time.perf_counter() - started) * 1000, 2) if started is not None else None
    logger.info(
        "REQUEST done method=%s path=%s status=%s duration_ms=%s",
        request.method,
        request.path,
        response.status_code,
        elapsed_ms,
    )
    return response


@app.errorhandler(Exception)
def handle_unexpected_error(error):
    if isinstance(error, HTTPException):
        return error
    logger.exception("Unhandled server error: %s", error)
    return jsonify({"ok": False, "message": "Internal server error"}), 500


@app.get("/health")
def health():
    db_ok, db_message = check_connection()
    status = "ok" if db_ok else "degraded"
    return jsonify(
        {
            "status": status,
            "service": "api",
            "database": db_message,
        }
    )


@app.get("/api/auth/provider-health")
def auth_provider_health():
    return jsonify(_provider_health())


@app.get("/api/landing-summary")
def landing_summary():
    return jsonify(
        {
            "announcement": "New festive edit live now - Free shipping across India on orders over Rs 1499",
            "hero_title": "Classic Textile Heritage with a Modern, Statement-Ready Finish",
            "top_chip": "1400+ Designs",
            "mid_chip": "Pure Fabrics",
            "bottom_chip": "Since 1998",
        }
    )


@app.get("/api/featured-products")
def featured_products():
    return jsonify(
        [
            {
                "tag": "New",
                "name": "Ivory Embroidered Kurta Set",
                "fabric_note": "Premium cotton silk blend",
                "price_inr": 2499,
                "image_url": "https://images.unsplash.com/photo-1618244972963-dbad68f8d7d3?auto=format&fit=crop&w=900&q=80",
                "alt": "Ivory embroidered kurta set",
            },
            {
                "tag": "Trending",
                "name": "Royal Indigo Saree",
                "fabric_note": "Handloom-inspired drape",
                "price_inr": 3299,
                "image_url": "https://images.unsplash.com/photo-1625591339971-4ce33f59f72c?auto=format&fit=crop&w=900&q=80",
                "alt": "Royal indigo saree",
            },
            {
                "tag": "Limited",
                "name": "Festive Maroon Sherwani",
                "fabric_note": "Rich texture with classic finish",
                "price_inr": 4999,
                "image_url": "https://images.unsplash.com/photo-1593030103066-0093718efeb9?auto=format&fit=crop&w=900&q=80",
                "alt": "Festive maroon sherwani",
            },
            {
                "tag": "Classic",
                "name": "Pastel Woven Dupatta",
                "fabric_note": "Lightweight festive texture",
                "price_inr": 1299,
                "image_url": "https://images.unsplash.com/photo-1578932750294-f5075e85f44a?auto=format&fit=crop&w=900&q=80",
                "alt": "Pastel woven dupatta",
            },
        ]
    )


@app.get("/api/testimonials")
def testimonials():
    return jsonify(
        [
            {
                "quote": "The fit, texture, and finishing are exceptional. Looks premium and feels effortless.",
                "author": "Aditi",
                "city": "Jaipur",
            },
            {
                "quote": "Exactly the blend I wanted - traditional styling with contemporary comfort.",
                "author": "Karan",
                "city": "Pune",
            },
            {
                "quote": "Fast delivery and beautiful quality. Our festive shopping starts here every season.",
                "author": "Neha",
                "city": "Delhi",
            },
        ]
    )


def _validate_identifier(login_method: str, identifier: str) -> bool:
    if login_method == "mobile":
        return bool(re.fullmatch(r"\d{10}", identifier))
    if login_method == "email":
        return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", identifier))
    return False


@app.post("/api/auth/send-otp")
def send_otp():
    payload = request.get_json(silent=True) or {}
    login_method = str(payload.get("method", "")).strip().lower()
    identifier = str(payload.get("identifier", "")).strip()

    if not _validate_identifier(login_method, identifier):
        return jsonify({"ok": False, "message": "Provide a valid mobile number or email."}), 400

    existing_entry = OTP_STORE.get(identifier)
    allowed, reason = _can_send_otp(existing_entry)
    if not allowed:
        return jsonify({"ok": False, "message": reason}), 429

    code = f"{random.randint(0, 999999):06d}"

    try:
        if login_method == "mobile":
            _send_sms_otp(identifier, code)
        else:
            _send_email_otp(identifier, code)
    except Exception as exc:
        logger.exception("Failed to dispatch OTP")
        return jsonify({"ok": False, "message": f"Unable to send OTP: {exc}"}), 502

    now = datetime.now(timezone.utc)
    window_start = existing_entry.get("window_start", now) if existing_entry else now
    send_count = existing_entry.get("send_count", 0) + 1 if existing_entry else 1
    if now - window_start > timedelta(hours=1):
        window_start = now
        send_count = 1

    OTP_STORE[identifier] = {
        "otp_hash": _hash_otp(identifier, code),
        "method": login_method,
        "expires_at": now + timedelta(minutes=OTP_TTL_MINUTES),
        "attempts": 0,
        "last_sent_at": now,
        "window_start": window_start,
        "send_count": send_count,
    }

    response = {
        "ok": True,
        "message": f"OTP sent successfully to your {login_method}.",
        "expires_in_seconds": OTP_TTL_MINUTES * 60,
    }
    if OTP_EXPOSE_DEV_CODE:
        response["dev_otp"] = code

    return jsonify(response)


@app.post("/api/auth/verify-otp")
def verify_otp():
    payload = request.get_json(silent=True) or {}
    login_method = str(payload.get("method", "")).strip().lower()
    identifier = str(payload.get("identifier", "")).strip()
    otp = str(payload.get("otp", "")).strip()

    if not _validate_identifier(login_method, identifier):
        return jsonify({"ok": False, "message": "Provide a valid mobile number or email."}), 400

    entry = OTP_STORE.get(identifier)
    if not entry or entry.get("method") != login_method:
        return jsonify({"ok": False, "message": "OTP not requested or expired. Please resend OTP."}), 400

    if datetime.now(timezone.utc) > entry["expires_at"]:
        OTP_STORE.pop(identifier, None)
        return jsonify({"ok": False, "message": "OTP expired. Please request a new OTP."}), 400

    entry["attempts"] += 1
    if entry["attempts"] > 5:
        OTP_STORE.pop(identifier, None)
        return jsonify({"ok": False, "message": "Too many attempts. Request a new OTP."}), 429

    if _hash_otp(identifier, otp) != entry["otp_hash"]:
        return jsonify({"ok": False, "message": "Invalid OTP. Please try again."}), 400

    OTP_STORE.pop(identifier, None)
    return jsonify(
        {
            "ok": True,
            "message": "OTP verified successfully.",
            "user": {
                "identifier": identifier,
                "method": login_method,
            },
        }
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
