import crypto from "crypto";

// Get encryption key from environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = "aes-256-gcm";

if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is required");
}

// Ensure the key is 32 bytes for AES-256
const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

/**
 * Encrypts a string value using AES-256-GCM encryption
 * @param text - The plain text to encrypt
 * @returns The encrypted text with IV and auth tag (base64 encoded)
 */
export function encryptValue(text: string): string {
  try {
    const iv = crypto.randomBytes(16); // Generate random IV
    const cipher = crypto.createCipher(ALGORITHM, key);
    cipher.setAAD(Buffer.from("identification", "utf8")); // Additional authenticated data

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    const combined =
      iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;

    // Return base64 encoded result
    return Buffer.from(combined).toString("base64");
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt value");
  }
}

/**
 * Decrypts a string value that was encrypted with encryptValue
 * @param encryptedText - The encrypted text (base64 encoded)
 * @returns The decrypted plain text
 */
export function decryptValue(encryptedText: string): string {
  try {
    // Decode from base64
    const combined = Buffer.from(encryptedText, "base64").toString("utf8");
    const parts = combined.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted data format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAAD(Buffer.from("identification", "utf8"));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt value");
  }
}

/**
 * Hash a value for comparison purposes (one-way, cannot be decrypted)
 * Useful for searching or comparing without decrypting
 * @param text - The plain text to hash
 * @returns The hashed value (hex string)
 */
export function hashValue(text: string): string {
  return crypto
    .createHash("sha256")
    .update(text + ENCRYPTION_KEY)
    .digest("hex");
}

/**
 * Validate that an encrypted value can be successfully decrypted
 * @param encryptedText - The encrypted text to validate
 * @returns true if the value can be decrypted, false otherwise
 */
export function validateEncryptedValue(encryptedText: string): boolean {
  try {
    decryptValue(encryptedText);
    return true;
  } catch {
    return false;
  }
}
