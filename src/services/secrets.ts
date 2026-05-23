import { pool } from "../db/pool"
import { encrypt, decrypt, buildAAD } from "./encryption"
import { Environment, Secret } from "../types"