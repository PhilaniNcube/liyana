// Quick local validation that the seeded encrypted id_numbers decrypt correctly
// Uses the same algorithm/key as lib/encryption.ts
const crypto = require("crypto");

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-development-key-32-chars";
const ALGORITHM = "aes-256-cbc";
const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

function decryptValue(encryptedText) {
  const combined = Buffer.from(encryptedText, "base64").toString("utf8");
  const parts = combined.split(":");
  if (parts.length !== 2) throw new Error("Invalid encrypted data format");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

const samples = [
  "MTc3NmQxY2ZkMmE3YTg5OWQxNzQ5ZGRlZWJhZGE0YWM6NzVlOWM5YjdkMDc1YzBiNWZhOTRmYzY2ZGJmNDdhOGU=",
  "MTliY2E5OTQ3MDhhNGExYmExN2JmOTgwYmY2MjliNWU6ZDE2OTg5N2Y1NzVlNzEyZGZlN2FhNjFiMjViNGExZWQ=",
  "YzExY2QzZjIzOWM2ZDM1NWRiNTBkNzc5ZWQyYWFkN2I6ZWI0NjNkOGVmZmQzNzZjMzIyNDI0ZmZmYzFhNWZhZDk=",
];

for (const s of samples) {
  try {
    const d = decryptValue(s);
    console.log(s.slice(0, 12) + "... ->", d);
  } catch (e) {
    console.error("Failed to decrypt sample:", s, e.message);
    process.exitCode = 1;
  }
}
