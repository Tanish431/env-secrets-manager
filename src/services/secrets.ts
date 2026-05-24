import { pool } from "../db/pool"
import { encrypt, decrypt, buildAAD } from "./encryption"
import { Environment, Secret } from "../types"

interface SecretMetadata {
    key: string;
    environment: Environment;
    created_at: Date;
    updated_at: Date;
}

export async function createSecret(key: string, value: string, environment: Environment): Promise<SecretMetadata> {
    const aad = buildAAD(key, environment)
    const { encryptedValue, nonce, authTag } = encrypt(value, aad);

    const { rows } = await pool.query<Secret>(
        `INSERT INTO secrets (key, environment, encrypted_val, nonce, auth_tag)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (key, environment)
        DO UPDATE SET
            encrypted_val = $3,
            nonce           = $4,
            auth_tag        = $5,
            updated_at      = NOW()
        RETURNING key, environment, created_at, updated_at`,
        [key, environment, encryptedValue, nonce, authTag]
    )

    return rows[0]
}

export async function getSecret(key: string, environment: Environment): Promise<{ key: string, value: string, environment: Environment } | null> {
    const { rows } = await pool.query<Secret>(
        `SELECT * FROM secrets WHERE key = $1 AND environment = $2`,
        [key, environment]
    )
    if (rows.length === 0) return null;

    const row = rows[0]
    const aad = buildAAD(key, environment)

    const value = decrypt(
        {
            encryptedValue: row.encrypted_val,
            nonce: row.nonce,
            authTag: row.auth_tag,
        }, aad
    )

    return { key, value, environment }
}

export async function updateSecret(key: string, value:string, environment: Environment): Promise<SecretMetadata | null> {
    const { rows: existing } = await pool.query(
        `SELECT id FROM secrets WHERE key = $1 AND environment = $2`,
        [key, environment]
    )

    if (existing.length === 0) return null

    const aad = buildAAD(key, environment)
    const { encryptedValue, nonce, authTag } = encrypt(value, aad)

    const { rows } = await pool.query<Secret>(
        `UPDATE secrets
        SET encrypted_val = $1, nonce = $2, auth_tag = $3, updated_at = NOW()
        WHERE key = $4 AND environment = $5
        RETURNING key, environment, created_at, updated_at`,
        [encryptedValue, nonce, authTag, key, environment]
    )

    return rows[0]
}

export async function deleteSecret(key:string, environment: Environment): Promise<boolean> {
    const { rowCount } = await pool.query(
    `DELETE FROM secrets WHERE key = $1 AND environment = $2`,
    [key, environment]
  )

  return (rowCount ?? 0) > 0 // Returns true if a row was deleted
}

export async function getAllSecrets(): Promise<Secret[]> {
  const { rows } = await pool.query<Secret>(`SELECT * FROM secrets`)
  return rows
}