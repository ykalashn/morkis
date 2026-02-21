# Morkis Web (Next.js)

## What this is
This is the structured frontend replacement for the static prototype pages.

## Run locally
1. Install dependencies
```bash
npm install
```
2. Add frontend env file
```bash
cp .env.local.example .env.local
```
3. Start frontend
```bash
npm run dev
```
4. Ensure backend is running at `http://127.0.0.1:8000` (or set `NEXT_PUBLIC_API_BASE_URL`)

## Required backend endpoint
- `POST /api/failure-roast`

The failure screen auto-calls this endpoint and plays returned audio.
