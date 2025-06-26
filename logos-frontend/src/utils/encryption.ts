// utils/encryption.ts
import crypto from "crypto";

/**
 * Encrypts sensitive data using AES-256-GCM encryption
 *
 * @param text - The plaintext to encrypt
 * @returns The encrypted text as a string in format: iv:tag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
  // Get encryption key from environment variable

  const ENCRYPTION_KEY = Buffer.from(
    process.env.OAUTH_ENCRYPTION_KEY!,
    "base64",
  );
  console.log("ENCRYPTION_KEY length", ENCRYPTION_KEY.length);
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be set and be exactly 32 bytes (256 bits) when decoded from Base64",
    );
  }
  console.log(
    "ENCRYPTION_KEY length",
    Buffer.byteLength(ENCRYPTION_KEY, "utf8"),
  );
  if (!ENCRYPTION_KEY || Buffer.byteLength(ENCRYPTION_KEY, "utf8") !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be set and be exactly 32 bytes (256 bits)",
    );
  }

  // Generate a random initialization vector
  const iv = crypto.randomBytes(16);

  // Create cipher using AES-256-GCM
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );

  // Encrypt the data
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Get the authentication tag
  const authTag = cipher.getAuthTag().toString("hex");

  // Return the IV, auth tag, and encrypted data as a single string
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts data that was encrypted with the encrypt function
 *
 * @param encryptedText - The encrypted text in format: iv:tag:encryptedData
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
  // Get encryption key from environment variable
  const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY;

  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be set and be exactly 32 characters (256 bits)",
    );
  }

  // Split the encrypted text into its components
  const parts = encryptedText.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const authTag = Buffer.from(parts[1], "hex");
  const encryptedData = parts[2];

  // Create decipher
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );

  // Set auth tag for verification
  decipher.setAuthTag(authTag);

  // Decrypt the data
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generates a secure random encryption key of specified length
 * Use this in development to generate your encryption key
 *
 * @param length - Length of the key in bytes (default 32 for AES-256)
 * @returns Base64 encoded random string suitable for use as an encryption key
 */
export function generateEncryptionKey(length = 32): string {
  return crypto.randomBytes(length).toString("base64").slice(0, length);
}

export function generateCodeVerifier(length = 43): string {
  const buffer = crypto.randomBytes(length);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")
    .slice(0, length);
}

export function generateCodeChallenge(codeVerifier: string): string {
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  return hash
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
