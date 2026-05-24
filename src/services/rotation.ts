import { pool } from "../db/pool";
import { encrypt, decrypt, buildAAD } from "./encryption";
import { getAllSecrets } from "./secrets";
import { Secret } from "../types";

export async function rotateMasterKey(newKeyBase64: string): Promise<number> {
    const newKey = Buffer.from(newKeyBase64, "base64")
    if (newKey.length !== 32) {
        throw new Error("New master key must be exactly 32 bytes (base64-encoded)");
    }

    const secrets = await getAllSecrets();
    let rotated = 0;

    for (const secret of secrets) {
        const aad = buildAAD(secret.key, secret.environment)

        const plaintext = decrypt(
            {
                encryptedValue: secret.encrypted_val,
                nonce: secret.nonce,
                authTag: secret.auth_tag,
            },
            aad
        )

        const { encryptedValue, nonce, authTag } = encrypt(plaintext, aad, newKey)

        await pool.query(
            `UPDATE secrets
       SET encrypted_val = $1, nonce = $2, auth_tag = $3, updated_at = NOW()
       WHERE id = $4`,
            [encryptedValue, nonce, authTag, secret.id]
        )

        rotated++
    }

    return rotated
}