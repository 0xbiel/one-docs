# Environment setup

The backend reads a `.env` file through `pydantic-settings` using the `ONE_` prefix. Never commit a real `.env`, pairing code, bearer token, API key, database password, or clip-encryption key.

## Safe local baseline

```dotenv
ONE_ENV=development
ONE_DATABASE_URL=sqlite:///./one.db
ONE_OBJECT_STORE_PATH=./data/objects
ONE_BOOTSTRAP_SECRET=replace-with-a-local-secret
# Compose-only dependency credentials; replace before shared LAN use.
ONE_POSTGRES_DB=one
ONE_POSTGRES_USER=one
ONE_POSTGRES_PASSWORD=replace-with-a-local-postgres-password
ONE_MINIO_ROOT_USER=one-local
ONE_MINIO_ROOT_PASSWORD=replace-with-a-local-minio-password
ONE_SESSION_TTL_MINUTES=60
ONE_LIVEKIT_URL=ws://localhost:7880
# Compose's self-hosted `--dev` server defaults; no LiveKit Cloud subscription.
ONE_LIVEKIT_API_KEY=devkey
ONE_LIVEKIT_API_SECRET=secret
ONE_LM_STUDIO_URL=http://127.0.0.1:1234/v1
ONE_LM_STUDIO_MODEL=qwen3.6-35b-a3b
ONE_LM_STUDIO_API_KEY=
ONE_CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

The repository currently provides these settings in `one/app/config.py`; create your own local file rather than copying credentials from another machine. The `devkey`/`secret` pair is only for the local Compose `--dev` server. For a phone, set `ONE_LIVEKIT_URL` to a host-reachable LAN/Tailscale WebSocket endpoint and use trusted `wss://` when the page is served over HTTPS.

## LM Studio: local Qwen3.6

Load the exact model identifier `qwen3.6-35b-a3b` in LM Studio and enable its OpenAI-compatible server. Point `ONE_LM_STUDIO_URL` at the server’s `/v1` base URL. If LM Studio authentication is enabled, place the local key only in `ONE_LM_STUDIO_API_KEY` (or its supported aliases `ONE_LLM_API_KEY` / `LLM_API_KEY`). The adapter sends it as a bearer token.

```bash
curl -s "$ONE_LM_STUDIO_URL/models" \
  -H "Authorization: Bearer ${ONE_LM_STUDIO_API_KEY:-local-only}" \
  | sed 's/\("key"[[:space:]]*:[[:space:]]*"\)[^"]*/\1[redacted]/g'
```

Do not paste the response, key, or a full `.env` into an issue or demo recording. If the local endpoint is unavailable, ONE’s backend returns its deterministic non-medical summary fallback and records the adapter error internally.

## Browser origin

The CORS list must contain the exact origin used by Vite. Include the scheme and port, without a trailing slash. Keep the list narrow during development.

## Frontend and iOS endpoints

For direct Vite development, use:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_DEMO_MODE=true
```

For Docker, use `VITE_API_BASE_URL=/api/v1` so Nginx keeps API calls same-origin. For iOS, `RuntimeConfiguration` reads the `ONE_API_BASE_URL` Info.plist value generated from the Xcode build setting. A Tailscale Serve deployment uses the HTTPS host plus `/api/v1`; never hard-code a personal tailnet hostname in a committed project file.
