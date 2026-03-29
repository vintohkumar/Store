"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logClientAction } from "../../lib/clientLogger";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000";

export default function LoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState("mobile");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSendOtp(event) {
    event.preventDefault();
    if (!identifier.trim()) {
      logClientAction("otp_send_validation_failed", { method, reason: "identifier_missing" });
      setStatus("Enter mobile number or email first.");
      return;
    }

    try {
      setBusy(true);
      setStatus("");
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          identifier: identifier.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        logClientAction("otp_send_failed", { method, status: response.status, message: data.message || "" });
        throw new Error(data.message || "Failed to send OTP.");
      }

      setOtpSent(true);
      logClientAction("otp_sent", { method });
      if (data.dev_otp) {
        setStatus(`${data.message} (Dev OTP: ${data.dev_otp})`);
      } else {
        setStatus(data.message || "OTP sent successfully.");
      }
    } catch (error) {
      logClientAction("otp_send_error", { method, message: error.message || "" });
      setStatus(error.message || "Unable to send OTP right now.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp(event) {
    event.preventDefault();
    if (otp.trim().length < 4) {
      logClientAction("otp_verify_validation_failed", { method, reason: "otp_too_short" });
      setStatus("Enter a valid OTP.");
      return;
    }

    try {
      setBusy(true);
      setStatus("");
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          identifier: identifier.trim(),
          otp: otp.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        logClientAction("otp_verify_failed", { method, status: response.status, message: data.message || "" });
        throw new Error(data.message || "OTP verification failed.");
      }
      setStatus("OTP verified. Login successful.");
      logClientAction("otp_verified", { method });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "va_auth_user",
          JSON.stringify({ method, identifier: identifier.trim(), at: new Date().toISOString() })
        );
        window.dispatchEvent(new Event("storage"));
      }
      setOtp("");
      setTimeout(() => router.push("/"), 600);
    } catch (error) {
      logClientAction("otp_verify_error", { method, message: error.message || "" });
      setStatus(error.message || "Unable to verify OTP.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <Link href="/" className="login-back-link">
          ← Back to store
        </Link>
        <p className="eyebrow">Secure Sign In</p>
        <h1>Login with OTP</h1>
        <p className="login-subtitle">Use your mobile number or email for quick one-time verification.</p>

        <div className="login-methods" role="tablist" aria-label="Login method">
          <button
            type="button"
            className={`method-btn ${method === "mobile" ? "active" : ""}`}
            onClick={() => {
              setMethod("mobile");
              setIdentifier("");
              setOtp("");
              setOtpSent(false);
              setStatus("");
            }}
              disabled={busy}
          >
            Mobile OTP
          </button>
          <button
            type="button"
            className={`method-btn ${method === "email" ? "active" : ""}`}
            onClick={() => {
              setMethod("email");
              setIdentifier("");
              setOtp("");
              setOtpSent(false);
              setStatus("");
            }}
              disabled={busy}
          >
            Email OTP
          </button>
        </div>

        {!otpSent ? (
          <form className="otp-form" onSubmit={handleSendOtp}>
            <label htmlFor="identifier-input">
              {method === "mobile" ? "Mobile Number" : "Email Address"}
            </label>
            <input
              id="identifier-input"
              type={method === "mobile" ? "tel" : "email"}
              placeholder={method === "mobile" ? "Enter mobile number" : "Enter email address"}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              required
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary otp-btn" disabled={busy}>
              {busy ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form className="otp-form" onSubmit={handleVerifyOtp}>
            <label htmlFor="otp-input">Enter OTP</label>
            <input
              id="otp-input"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 4-6 digit OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              required
              disabled={busy}
            />
            <button type="submit" className="btn btn-primary otp-btn" disabled={busy}>
              {busy ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              className="resend-btn"
              onClick={() => setOtpSent(false)}
              disabled={busy}
            >
              Change {method === "mobile" ? "mobile number" : "email"}
            </button>
          </form>
        )}

        {status ? <p className="login-status">{status}</p> : null}
      </section>
    </main>
  );
}
