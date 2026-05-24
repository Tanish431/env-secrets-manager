import { pool } from "../db/pool"
import { AuditEntry } from "../types"

export function logAudit(entry: AuditEntry): void {
  pool
    .query(
      `INSERT INTO audit_log (secret_key, environment, api_key_id, action, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        entry.secret_key,
        entry.environment,
        entry.api_key_id,
        entry.action,
        entry.ip_address,
      ]
    )
    .catch((err) => {
      console.error("Audit log failed:", err)
    });
}