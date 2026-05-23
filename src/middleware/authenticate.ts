import { Request, Response, NextFunction } from "express";
import { validateApiKey } from "../services/auth";
import { AuthContext } from "../types";

declare global {
    namespace Express {
        interface Request {
            auth: AuthContext
        }
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rawKey = req.headers["x-api-key"]

    if (!rawKey || typeof rawKey !== "string") {
        res.status(401).json({ error: "Missing X-API-Key header" })
        return
    }

    const apiKey = await validateApiKey(rawKey)

    if (!apiKey) {
        res.status(401).json({ error: "Invalid API key" })
        return
    }

    req.auth = { id: apiKey.id, scope: apiKey.scope }
    next()
}