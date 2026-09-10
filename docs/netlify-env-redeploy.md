# Netlify environment variable redeploy rule

Production credentials used by Next.js middleware/functions must exist before the production build is created. If a required credential is restored or rotated in Netlify, create a fresh build from the current `main` branch; publishing an older already-built deploy does not refresh its environment snapshot.

Required portal credential names:
- `PORTAL_SESSION_SECRET`
- `TRACERFY_API_KEY`
- `NOTION_API_KEY`

Never store credential values in this repository.
