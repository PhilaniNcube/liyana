import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";
import path from "path";

// Simple .env parser since dotenv might not be installed
function loadEnv() {
    const envPath = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        const lines = content.split("\n");
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith("#")) continue;

            const idx = trimmed.indexOf("=");
            if (idx !== -1) {
                const key = trimmed.substring(0, idx).trim();
                let val = trimmed.substring(idx + 1).trim();

                // Remove quotes if present
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length - 1);
                }

                process.env[key] = val;
            }
        }
    }
}

loadEnv();

// --- Encryption Logic Copied from lib/encryption.ts ---
// Get encryption key from environment variables
const ENCRYPTION_KEY =
    process.env.ENCRYPTION_KEY || "default-development-key-32-chars";
const ALGORITHM = "aes-256-cbc";

// Ensure the key is 32 bytes for AES-256
const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

function encryptValue(text: string): string {
    try {
        const iv = crypto.randomBytes(16); // Generate random IV
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, "utf8", "hex");
        encrypted += cipher.final("hex");

        // Combine IV and encrypted data
        const combined = iv.toString("hex") + ":" + encrypted;

        // Return base64 encoded result
        return Buffer.from(combined).toString("base64");
    } catch (error) {
        console.error("Encryption error:", error);
        throw new Error("Failed to encrypt value");
    }
}

function decryptValue(encryptedText: string): string {
    try {
        // Decode from base64
        const combined = Buffer.from(encryptedText, "base64").toString("utf8");
        const parts = combined.split(":");

        if (parts.length !== 2) {
            throw new Error("Invalid encrypted data format");
        }

        const iv = Buffer.from(parts[0], "hex");
        const encrypted = parts[1];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

        let decrypted = decipher.update(encrypted, "hex", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;
    } catch (error) {
        // console.error("Decryption error:", error); // Suppress log for migration check
        throw new Error("Failed to decrypt value");
    }
}
// -----------------------------------------------------

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
    );
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateTable(tableName: "profiles" | "applications") {
    console.log(`Checking ${tableName}...`);

    // Fetch all records with id_number
    const { data: records, error } = await supabase
        .from(tableName)
        .select("id, id_number")
        .not("id_number", "is", null);

    if (error) {
        console.error(`Error fetching ${tableName}: `, error);
        return;
    }

    if (!records || records.length === 0) {
        console.log(`No records found in ${tableName} with id_number.`);
        return;
    }

    console.log(`Found ${records.length} records in ${tableName}. Processing...`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const record of records) {
        if (!record.id_number) continue;

        const originalId = record.id_number;
        let isEncrypted = false;

        try {
            // Try to decrypt. If it works, it's already encrypted.
            const decrypted = decryptValue(originalId);
            // Double check: if decryptValue returns something, it *might* be valid.
            // But we rely on the function throwing if format is invalid.
            isEncrypted = true;
        } catch (e) {
            // If it throws, it is NOT encrypted (or invalid format).
            isEncrypted = false;
        }

        if (!isEncrypted) {
            try {
                console.log(`Encrypting ID for record ${record.id} in ${tableName}...`);
                const encryptedId = encryptValue(originalId);

                const { error: updateError } = await supabase
                    .from(tableName)
                    .update({ id_number: encryptedId })
                    .eq("id", record.id);

                if (updateError) {
                    console.error(`Failed to update record ${record.id}: `, updateError);
                    errorCount++;
                } else {
                    updatedCount++;
                }
            } catch (e) {
                console.error(`Error encrypting / updating record ${record.id}: `, e);
                errorCount++;
            }
        } else {
            skippedCount++;
        }
    }

    console.log(`Finished ${tableName}: `);
    console.log(`- Updated: ${updatedCount} `);
    console.log(`- Skipped(Already Encrypted): ${skippedCount} `);
    console.log(`- Errors: ${errorCount} `);
}

async function main() {
    try {
        console.log("Starting migration...");
        await migrateTable("profiles");
        console.log("-------------------");
        await migrateTable("applications");
        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    }
}

main();
