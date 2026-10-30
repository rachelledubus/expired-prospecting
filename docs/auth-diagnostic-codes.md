# Portal authentication diagnostic codes

The login UI surfaces stable error codes so authentication failures can be pinpointed without exposing secrets.

- `AUTH-401-PASSWORD` — submitted password did not match `PORTAL_PASSWORD`.
- `AUTH-500-CONFIG` — server has no usable session-signing secret/password configuration.
- `AUTH-500-SIGN` — server could not create a signed session token.
- `AUTH-503-NETWORK` — browser could not reach `/api/login`.
- `AUTH-502-RESPONSE` — `/api/login` returned an unreadable/non-JSON error response.
- `AUTH-440-MISSING` — middleware received a protected request with no portal session cookie.
- `AUTH-440-INVALID` — middleware received a portal session cookie that failed verification or expired.
- `AUTH-500-MIDDLEWARE-CONFIG` — middleware has no usable signing secret/password configuration.

These codes are intentionally non-sensitive: they identify the stage that failed, not any credential or secret value.
