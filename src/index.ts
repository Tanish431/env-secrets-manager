import dotenv from "dotenv"
dotenv.config()

import express from "express"
import { seedApiKeys } from "./services/auth"

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 3000

async function start() {
    await seedApiKeys()

    app.get("/health", (_req, res) => {
        res.json({status: "ok"})
    })

    app.listen(PORT, () => {
        console.log(`Server is listening on port ${PORT}`)
    })
}

start().catch((err) => {
    console.error("Failed to start server: ", err)
    process.exit(1)
})