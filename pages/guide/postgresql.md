# PostgreSQL adapter

Docker uses PostgreSQL as ONE's authoritative database. The backend keeps a
small database facade so the same API handlers can run against SQLite during
zero-setup unit tests, while production-shaped Compose runs use `psycopg` 3
and PostgreSQL 16.

## Docker path

The `one` Compose file starts `postgres`, waits for its health check, and then
starts the API with a service-network URL:

```dotenv
ONE_DATABASE_URL=postgresql://one:<password>@postgres:5432/one
```

The API image installs `.[postgres]` and copies `migrations/`. On startup it
applies `001_initial.sql` and `002_family_mode.sql` in order and records the
applied versions in `schema_migrations`. The migration statements are
idempotent, and the startup transaction rolls back if any statement fails.

```bash
cd one
docker compose ps postgres api
curl -s http://127.0.0.1:8000/api/v1/health
```

Healthy output includes `"database":"postgresql"` and
`"database_status":"ok"`. The API does not expose database credentials in
health responses or logs.

## Query boundary

The application deliberately uses qmark (`?`) placeholders in its small
`Database` interface. The PostgreSQL adapter translates them to `%s` at the
boundary and maps `IS ?` to PostgreSQL's null-safe `IS NOT DISTINCT FROM`.
Transactions yield a guarded connection facade so direct `conn.execute(...)`
calls in invite acceptance and deletion workflows receive the same translation
and commit/rollback behavior. PostgreSQL rows are returned as dictionaries,
matching SQLite test behavior.

Do not add PostgreSQL-specific SQL to route handlers. If a query cannot be
expressed portably, add a backend-boundary translation or a numbered
migration, then run both suites.

## Local verification

The default suite intentionally uses an isolated SQLite database and never
calls inference:

```bash
cd one
ONE_DATABASE_URL=sqlite:///./one.db pytest
```

The opt-in contract suite exercises a disposable PostgreSQL database, schema
idempotence, health reporting, nullable map lookup, transaction rollback, and
foreign-key deletion cascade:

```bash
ONE_TEST_POSTGRES_URL='postgresql://one:<password>@127.0.0.1:5432/one' \
  pytest -q tests/test_postgres_contract.py
```

Set `ONE_DATABASE_URL=sqlite:///./one.db` alongside that command when the
checkout's `.env` points at the Docker-only hostname; the test fixture itself
uses `ONE_TEST_POSTGRES_URL` for PostgreSQL. The fixture points its LM Studio
URL at an unreachable loopback port and does not make an LLM request.

## Operational boundary

The Compose PostgreSQL volume is persistent, but backups, restore drills,
rotation, monitoring, and production credentials still require an operator
runbook. Redis and MinIO remain composed local dependency slots; the current
MVP event bus and object store are in-process/local adapters. PostgreSQL
adoption does not change GDPR release gates, retention policy, or the rule that
only synthetic household data is used before controller and DPIA approval.
