import { Router, Request, Response } from "express";
import { authenticate } from "../middleware/authenticate";
import { authorize } from "../middleware/authorize";
import { validateEnvironment } from "../middleware/valid-environment";
import { createSecret, updateSecret, deleteSecret, getSecret } from "../services/secrets";
import { Environment } from "../types";
import { logAudit } from "../services/audit";

export const secretsRouter = Router()

secretsRouter.use(authenticate)

// POST /secrets 
secretsRouter.post(
    "/", authorize("readwrite"), validateEnvironment,
    async (req: Request, res: Response): Promise<void> => {
        const { key, value, environment } = req.body

        if (!key || !value) {
            res.status(400).json({ error: "Missing required fields: key, value" })
            return
        }

        try {
            const metadata = await createSecret(key, value, environment as Environment)
            logAudit({
                secret_key: key,
                environment: environment as Environment,
                api_key_id: req.auth.id,
                action: "write",
                ip_address: req.ip ?? null,
            })
            res.status(201).json(metadata)
        } catch {
            res.status(500).json({ error: "Failed to create secret" })
        }
    }
)

// GET /secrets/:key
secretsRouter.get(
    "/:key", authorize("readonly"), validateEnvironment,
    async (req: Request, res: Response): Promise<void> => {
        const { key } = req.params
        const environment = req.query.environment as Environment

        try {
            const secret = await getSecret(key, environment)

            if (!secret) {
                res.status(404).json({
                    error: `Secret "${key}" not found for environment "${environment}"`,
                })
                return
            }
            logAudit({
                secret_key: key,
                environment,
                api_key_id: req.auth.id,
                action: "read",
                ip_address: req.ip ?? null,
            })
            res.json(secret)
        } catch {
            res.status(500).json({ error: "Failed to retrieve secret" });
        }
    }
)

// PUT /secrets/:key
secretsRouter.put(
    "/:key", authorize("readwrite"), validateEnvironment,
    async (req: Request, res: Response): Promise<void> => {
        const { key } = req.params
        const { value, environment } = req.body

        if (!value) {
            res.status(400).json({ error: "Missing required field: value" })
            return
        }

        try {
            const metadata = await updateSecret(key, value, environment as Environment)

            if (!metadata) {
                res.status(404).json({
                    error: `Secret "${key}" not found for environment "${environment}"`,
                })
                return
            }

            logAudit({
                secret_key: key,
                environment: environment as Environment,
                api_key_id: req.auth.id,
                action: "write",
                ip_address: req.ip ?? null,
            })
            res.json(metadata)
        } catch {
            res.status(500).json({ error: "Failed to update secret" })
        }
    }
);

// DELETE /secrets/:key
secretsRouter.delete(
    "/:key", authorize("readwrite"), validateEnvironment,
    async (req: Request, res: Response): Promise<void> => {
        const { key } = req.params
        const environment = req.query.environment as Environment

        try {
            const deleted = await deleteSecret(key, environment)

            if (!deleted) {
                res.status(404).json({
                    error: `Secret "${key}" not found for environment "${environment}"`,
                })
                return
            }
            logAudit({
                secret_key: key,
                environment,
                api_key_id: req.auth.id,
                action: "delete",
                ip_address: req.ip ?? null,
            })
            res.status(204).send()
        } catch {
            res.status(500).json({ error: "Failed to delete secret" })
        }
    }
);