# Retention & webhooks

## `POST /api/v1/admin/retention/run`

Operation ID: `retention_run_api_v1_admin_retention_run_post`. Bearer admin only. Deletes expired clips, events, and summaries, removes expired encrypted clip content, and deletes observations older than 30 days. Returns `{ deleted: { ...counts }, ran_at }`. This is an operator action; schedule it only after choosing a durable storage and audit strategy.

## `POST /api/v1/livekit/webhook`

Operation ID: `livekit_webhook_api_v1_livekit_webhook_post`. See [Clips & LiveKit](/api/media). It is the only current webhook operation and is verified from the request authorization/body when production credentials are configured.

## Canonical error envelope

The current runtime exception handlers normalize application and validation failures to this envelope and add the same ID as `X-Request-ID`:

```json
{
  "error": {
    "code":"validation_error",
    "message":"Request validation failed",
    "details":{"fields":[{"loc":["body","name"],"msg":"Invalid value","type":"string_too_short"}]},
    "retryable":false
  },
  "request_id":"REQUEST_ID_REDACTED",
  "api_version":"v1"
}
```

Application errors use the same shape with a status-derived `error.code`, a human-readable `error.message`, empty `details` by default, and `retryable: true` only for rate limits or 5xx responses. Validation failures put normalized field entries under `error.details.fields`. The generated `HTTPValidationError`/`ValidationError` schemas remain in OpenAPI because FastAPI contributes them to the contract, but the custom runtime handler is the response shape clients should parse.

Common current statuses:

| Status | Current examples |
| --- | --- |
| `400` | invalid/expired pairing or family invite |
| `401` | missing/expired bearer session, invalid LiveKit signature |
| `403` | wrong home, revoked membership, missing consent, role/publisher/admin gate |
| `404` | missing map, camera, object, event, clip, or plan |
| `409` | medication plan version conflict |
| `410` | expired clip |
| `413` | frame >3 MB or clip >8 MB after base64 decode |
| `422` | request schema, base64, date, label, or path validation |
| `503` | unavailable LM/LiveKit or media cleanup/verification failure |

Responses are not a promise that every listed resource uses every status. Check the operation’s generated response keys and the handler for the route-specific set.
