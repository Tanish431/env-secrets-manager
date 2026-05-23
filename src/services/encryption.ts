import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const NONCE_LENGTH = 12
const AUTH_TAG_LENGTH = 16

interface EncryptedPayload {
    encryptedValue: string
    nonce: string
    authTag: string
}

function getMasterKey(): Buffer {
    const raw = process.env.MASTER_ENCRYPTION_KEY;
    if (!raw) throw new Error("MASTER_ENCRYPTION_KEY is not set")

    const key = Buffer.from(raw, "base64")
    if (key.length !== 32) throw new Error("MASTER_ENCRYPTION_KEY must be 32 bytes")

    return key
}

export function encrypt( plaintext: string, aad: string, masterKey?: Buffer ): EncryptedPayload {
    const key = masterKey ?? getMasterKey()
    const nonce = crypto.randomBytes(NONCE_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, nonce, {
        authTagLength: AUTH_TAG_LENGTH
    })

    cipher.setAAD(Buffer.from(aad, "utf-8")) // AAD is not encrypted but is authenticated, ensuring integrity
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf-8"), cipher.final()])

    return {
        encryptedValue: encrypted.toString("base64"),
        nonce: nonce.toString("base64"),
        authTag: cipher.getAuthTag().toString("base64")
    }
}

export function decrypt( payload: EncryptedPayload, aad: string, masterKey?: Buffer ): string {
    const key = masterKey ?? getMasterKey()

    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(payload.nonce, "base64"), {
        authTagLength: AUTH_TAG_LENGTH
    })
    decipher.setAAD(Buffer.from(aad, "utf-8"))
    decipher.setAuthTag(Buffer.from(payload.authTag, "base64"))

    try {
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(payload.encryptedValue, "base64")),
            decipher.final()
        ])
        return decrypted.toString("utf-8")
    } catch {
        throw new Error("Decryption failed: Invalid ciphertext or authentication tag mismatch")
    }
}

export function buildAAD(key: string, environment: string): string {
  return `${key}:${environment}`;
}