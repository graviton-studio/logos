import crypto from "crypto";

export function generateWebhookSignature(
  payload: string,
  secret: string,
): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function getApiUrl(endpoint: string): string {
  const isDevelopment = process.env.NODE_ENV === "development";
  const baseUrl = isDevelopment
    ? process.env.AGENT_SANDBOX_DEV_URL || "http://localhost:8080"
    : process.env.AGENT_SANDBOX_PROD_URL || process.env.AGENT_SANDBOX_URL;
  return `${baseUrl}${endpoint}`;
}
