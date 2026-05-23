import bcrypt from "bcrypt"
import { pool } from "../db/pool"
import { ApiKey, Scope } from "../types"

const BCRYPT_COST = 10;

export async function seedApiKeys(): Promise<void> {
    const keys = [
        { name: "readonly", plainkey: process.env.API_KEY_READONLY!, scope: "readonly" as Scope },
        { name: "readwrite", plainkey: process.env.API_KEY_READWRITE!, scope: "readwrite" as Scope },
        { name: "admin", plainkey: process.env.API_KEY_ADMIN!, scope: "admin" as Scope },
    ]

    for (const { name, plainkey, scope } of keys) {
        if (!plainkey) {
            console.warn(`Warning: API key for "${name}" is not set in environment`)
            continue;
        }

        const hashed = await bcrypt.hash(plainkey, BCRYPT_COST)

        await pool.query(
            `INSERT INTO api_keys (name, hashed_key, scope)
            VALUES ($1, $2, $3)
            ON CONFLICT (name) DO UPDATE SET hashed_key = $2, scope = $3`,
            [name, hashed, scope]
        )
    }

    console.log("API Keys Seeded")
}

export async function validateApiKey(rawKey: string): Promise<ApiKey | null> {
    const { rows } = await pool.query<ApiKey>(`SELECT * FROM api_keys`)
    for (const row of rows) {
        const match = await bcrypt.compare(rawKey, row.hashed_key);
        if (match) return row;
    }

    return null;
}