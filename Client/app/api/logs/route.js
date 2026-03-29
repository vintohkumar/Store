import { appendFile, mkdir } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function sanitize(value) {
  if (value && typeof value === "object") {
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    const next = {};
    for (const [key, item] of Object.entries(value)) {
      const lowered = key.toLowerCase();
      if (["otp", "password", "token", "secret"].includes(lowered)) {
        next[key] = "***";
      } else {
        next[key] = sanitize(item);
      }
    }
    return next;
  }

  if (typeof value === "string" && value.length > 350) {
    return `${value.slice(0, 350)}...`;
  }

  return value;
}

export async function POST(request) {
  try {
    let payload = {};
    const rawBody = await request.text();
    if (rawBody && rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { action: "malformed_payload", details: { raw: rawBody.slice(0, 200) } };
      }
    }
    const rootDir = path.resolve(process.cwd(), "..");
    const logsDir = path.join(rootDir, "logs");
    const logFile = path.join(logsDir, "client_logs.txt");
    await mkdir(logsDir, { recursive: true });

    const entry = {
      timestamp: new Date().toISOString(),
      action: payload.action || "unknown",
      pathname: payload.pathname || "",
      details: sanitize(payload.details || {}),
      userAgent: request.headers.get("user-agent") || "",
    };

    await appendFile(logFile, `${JSON.stringify(entry)}\n`, "utf-8");
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, message: String(error) }, { status: 500 });
  }
}
