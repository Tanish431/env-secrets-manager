export type Environment = "development" | "staging" | "produciton"
export type Scope = "readonly" | "readwrite" | "admin"
export type Action = "read" | "write" | "delete"

export interface ApiKey {
    id: string
    name: string
    hashed_key: string
    scope: Scope
    created_at: Date
}
export interface Secret {
    id: string
    key: string
    environment: Environment
    encrypted_value: string
    nonce: string
    auth_tag: string
    created_at: Date
    updated_at: Date
}

export interface AuditEntry {
    secret_key: string
    environment: Environment
    api_key_id: string
    action: Action
    ip_address: string | null
}

export interface AuthContext {
  id: string
  scope: Scope
}

