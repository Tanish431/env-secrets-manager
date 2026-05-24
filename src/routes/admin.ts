import { Router, Request, Response } from "express"
import { authenticate } from "../middleware/authenticate"
import { authorize } from "../middleware/authorize"
import { rotateMasterKey } from "../services/rotation"
import { pool } from "../db/pool"

export const adminRouter = Router()

adminRouter.use(authenticate)
adminRouter.use(authorize("admin"))

// GET /admin/audit
adminRouter.get(
  "/audit",
  async (req: Request, res: Response): Promise<void> => {
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500)
    const offset = parseInt(req.query.offset as string) || 0

    try {
      const { rows } = await pool.query(
        `SELECT
           al.id,
           al.secret_key,
           al.environment,
           al.action,
           al.ip_address,
           al.created_at,
           ak.name AS api_key_name
         FROM audit_log al
         LEFT JOIN api_keys ak ON ak.id = al.api_key_id
         ORDER BY al.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      )

      res.json({ total: rows.length, offset, logs: rows })
    } catch {
      res.status(500).json({ error: "Failed to fetch audit logs" })
    }
  }
)

// POST /admin/rotate-master-key
adminRouter.post(
  "/rotate-master-key",
  async (req: Request, res: Response): Promise<void> => {
    const { new_master_key } = req.body

    if (!new_master_key) {
      res.status(400).json({ error: "Missing required field: new_master_key" })
      return
    }

    try {
      const rotated = await rotateMasterKey(new_master_key)

      res.json({
        message: `Key rotation complete. ${rotated} secret(s) re-encrypted.`,
        rotated,
        reminder:
          "Update MASTER_ENCRYPTION_KEY in your environment and restart the service.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Rotation failed"
      res.status(500).json({ error: message })
    }
  }
)
