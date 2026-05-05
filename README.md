# wav-audio-converter

Downloads audio from a YouTube URL, trims it to a specified time range, and returns it as a `.wav` file.

## Tech stack

- **Runtime**: Node.js, Express 5
- **Queue**: BullMQ + Redis (AWS ElastiCache in production)
- **Logging**: Winston
- **Deployment**: Docker, AWS ECS (Fargate)
- **Audio processing**: `yt-dlp`, `ffmpeg`

## Prerequisites

- Node.js 18+
- `yt-dlp` installed and on PATH
- `ffmpeg` installed and on PATH
- Redis (local or via Docker)

## Getting started

```bash
cd backend
cp .env.example .env   # set PORT and REDIS_URL
npm install
npm run dev
```

## API

### `POST /api/audio`

Downloads and trims audio from a YouTube URL.

**Body**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "start": "00:00:10",
  "end": "00:00:30"
}
```

**Response**: streams a `.wav` file.

**Example**
```bash
curl -X POST http://localhost:3001/api/audio \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "start": "00:00:10", "end": "00:00:20"}' \
  --output trimmed.wav
```

## Planned: queue-based architecture

The current flow is synchronous. The planned production architecture moves processing to a background worker:

1. `POST /api/audio` → enqueues job, returns `{ jobId }` immediately
2. `GET /api/audio/:jobId/status` → poll for job state
3. `GET /api/audio/:jobId/download` → fetch the file once complete

The API and worker will run as separate ECS tasks. The worker container includes `yt-dlp` and `ffmpeg`; the API container does not.
