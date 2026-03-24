# FaceTrack AI Secure Proxy

Use this backend proxy for all OpenAI and protected AI operations.

## Endpoints

- `POST /analysis/scan` -> receives image and returns structured skin metrics.
- `POST /chat` -> receives user message and returns AI skincare guidance.

## Privacy Rules

- Never store raw user images longer than required for processing.
- Log only request metadata, not sensitive image payloads.
- Enforce per-user rate limits.

## Environment Variables

- `OPENAI_API_KEY`
- `FIREBASE_PROJECT_ID`
- `ALLOWED_ORIGINS`
