import { Request, Response, NextFunction } from "express"
import { Scope } from "../types"

const SCOPE_LEVEL: Record<Scope, number> = {
  readonly:  1,
  readwrite: 2,
  admin:     3,
}

export function authorize(required: Scope) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userLevel  = SCOPE_LEVEL[req.auth.scope]
    const neededLevel = SCOPE_LEVEL[required]

    if (userLevel < neededLevel) {
      res.status(403).json({ error: "Insufficient scope" })
      return
    }

    next()
  }
}