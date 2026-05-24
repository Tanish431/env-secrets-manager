# env-secrets-manager

A secure REST API for managing environment secrets — encrypted at rest,
environment-isolated, and API-key protected. Replaces sharing `.env` files.

---

## Setup

### 1. Generate a master encryption key

```bash
openssl rand -base64 32
```

Copy the output — you'll need it in the next step.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```bash
MASTER_ENCRYPTION_KEY=<output from openssl above>
API_KEY_READONLY=readonly-key
API_KEY_READWRITE=readwrite-key
API_KEY_ADMIN=admin-key
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/secrets_db
PORT=3000
```
### 3. Build and run

```bash
# Start everything (Postgres + API)
docker compose up --build

# Or run locally against a dockerised DB
docker compose up db -d
npm install
npm run migrate
npm run dev
```

---

## API Reference

All requests require an `X-API-Key` header.

| Scope       | Allowed actions              |
|-------------|------------------------------|
| `readonly`  | GET                          |
| `readwrite` | GET, POST, PUT, DELETE       |
| `admin`     | All of the above + /admin/*  |

### Create a secret

```bash
curl -X POST http://localhost:3000/secrets \
  -H "Content-Type: application/json" \
  -H "X-API-Key: readwrite-key" \
  -d '{"key":"DB_PASSWORD","value":"s3cr3t","environment":"production"}'
```

### Retrieve a secret

```bash
curl "http://localhost:3000/secrets/DB_PASSWORD?environment=production" \
  -H "X-API-Key: readonly-key"
```

### Update a secret

```bash
curl -X PUT http://localhost:3000/secrets/DB_PASSWORD \
  -H "Content-Type: application/json" \
  -H "X-API-Key: readwrite-key" \
  -d '{"value":"newpassword","environment":"production"}'
```

### Delete a secret

```bash
curl -X DELETE "http://localhost:3000/secrets/DB_PASSWORD?environment=production" \
  -H "X-API-Key: readwrite-key"
```

### View audit log (admin only)

```bash
curl "http://localhost:3000/admin/audit?limit=50" \
  -H "X-API-Key: admin-key"
```

### Rotate master key (admin only)

```bash
NEW_KEY=$(openssl rand -base64 32)

curl -X POST http://localhost:3000/admin/rotate-master-key \
  -H "Content-Type: application/json" \
  -H "X-API-Key: admin-key" \
  -d "{\"new_master_key\":\"$NEW_KEY\"}"
```

After rotation, update `MASTER_ENCRYPTION_KEY` in your `.env` and restart the service.

---

## Fetch secrets into shell

```bash
# Must be sourced, not executed
source ./fetch-secrets.sh production readonly-key

echo $DB_PASSWORD
```

---

## Environments

Valid values: `development`, `staging`, `production`.

The same key (e.g. `DB_PASSWORD`) can hold different values per environment.
Every request must include an `environment` field or query parameter.
