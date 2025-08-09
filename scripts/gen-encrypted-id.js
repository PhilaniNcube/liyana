const crypto = require("crypto");

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "default-development-key-32-chars";
const ALGORITHM = "aes-256-cbc";
const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

function encryptValue(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const combined = iv.toString("hex") + ":" + encrypted;
  return Buffer.from(combined).toString("base64");
}

const ids = ["8001015009087", "9002026009088", "8503037009089"];
const out = Object.fromEntries(ids.map((id) => [id, encryptValue(id)]));
console.log(JSON.stringify(out, null, 2));
