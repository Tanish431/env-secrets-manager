CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    hashed_key TEXT NOT NULL,
    scope TEXT NOT NULL CHECK (scope IN ('readonly', 'readwrite', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);