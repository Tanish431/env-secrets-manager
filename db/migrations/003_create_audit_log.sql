CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_key TEXT NOT NULL,
    environment TEXT NOT NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action in ('read', 'write', 'delete')),
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)