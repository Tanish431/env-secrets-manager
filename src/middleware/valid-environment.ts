import { Request, NextFunction, Response } from "express";
import { Environment } from "../types";

const VALID_ENVIRONMENTS: Environment[] = ["development", "staging", "produciton"]

export function validateEnvironment(req: Request, res: Response, next: NextFunction): void {
    const env =
        (req.body?.environment as string) ||
        (req.query.environment as string)

    if (!env) {
        res.status(400).json({ error: "Missing required field: environment" })
        return
    }

    if (!VALID_ENVIRONMENTS.includes(env as Environment)) {
        res.status(400).json({
            error: `Invalid environment. Must be one of: ${VALID_ENVIRONMENTS.join(", ")}`,
        })
        return
    }

    next()
}