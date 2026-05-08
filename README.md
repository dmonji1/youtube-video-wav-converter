# wav-audio-converter

Downloads audio from a YouTube URL, trims it to a specified time range, and returns it as a `.wav` file.

## Tech stack

- **Runtime**: Node.js, Express 5
- **Queue**: BullMQ + Redis (AWS ElastiCache in production)
- **File storage**: AWS S3 (presigned URLs for client download)
- **Logging**: Winston + CloudWatch
- **Testing**: Jest + Supertest
- **CI/CD**: GitHub Actions → AWS ECR + ECS
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
cp .env.example .env   # set PORT, REDIS_URL, AWS_S3_BUCKET, NODE_ENV
npm install
npm run dev
```

With Docker:
```bash
docker compose up --build
```

## Testing

```bash
npm test           # run all tests
npm run test:watch # watch mode
```

## API

### `POST /api/audio`

Enqueues a download and trim job. Returns immediately with a `jobId`.

**Body**
```json
{
  "url": "https://www.youtube.com/watch?v=...",
  "start": "00:00:10",
  "end": "00:00:30"
}
```

**Response**
```json
{ "jobId": "abc123" }
```

### `GET /api/audio/:jobId/status`

Returns the current job state.

```json
{ "state": "waiting" | "active" | "completed" | "failed" }
```

### `GET /api/audio/:jobId/download`

Redirects to a presigned S3 URL to download the `.wav` file. Only available when state is `completed`.

### `GET /health`

Returns 200. Used by ECS for container health checks.

## Architecture

The API and worker run as separate containers/ECS tasks and communicate via a BullMQ queue backed by Redis.

- **API container**: handles HTTP, enqueues jobs, issues presigned S3 URLs. Does not run `yt-dlp` or `ffmpeg`.
- **Worker container**: picks up jobs, runs `yt-dlp` + `ffmpeg`, uploads the trimmed file to S3, stores the S3 key as the job result.

Files never pass through the API — clients download directly from S3 via presigned URLs. The worker handles `SIGTERM` gracefully, draining the current job before shutdown.

```mermaid
graph TB

%% =========================
%% Client / Edge Layer
%% =========================
Client([Client]) --> CF[CloudFront CDN]

CF --> ALB[Application Load Balancer]

classDef edge fill:#E3F2FD,stroke:#1E88E5,stroke-width:2px,color:#0D47A1;

class Client,CF,ALB edge;

%% =========================
%% VPC
%% =========================
subgraph VPC["VPC - Private Network"]

    subgraph PublicSubnet["Public Subnet"]
        ALB
        NAT[NAT Gateway]
    end

    subgraph PrivateSubnet["Private Subnet"]

        subgraph ECSCluster["ECS Cluster (Fargate)"]

            API1["API Service"]
            API2["API Service"]

            W1["Media Worker<br/>(yt-dlp + ffmpeg)"]
            W2["Media Worker<br/>(yt-dlp + ffmpeg)"]

        end

        REDIS[("Redis Cache / Job Queue")]
    end

end

classDef vpc fill:#E8F5E9,stroke:#43A047,stroke-width:2px;
classDef compute fill:#F3E5F5,stroke:#8E24AA,stroke-width:2px;
classDef data fill:#E0F7FA,stroke:#00ACC1,stroke-width:2px;
classDef network fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px;

class VPC,PublicSubnet,PrivateSubnet,ECSCluster vpc;
class API1,API2,W1,W2 compute;
class REDIS data;
class NAT network;

%% =========================
%% Routing
%% =========================
ALB --> API1
ALB --> API2

API1 --> REDIS
API2 --> REDIS

REDIS --> W1
REDIS --> W2

W1 --> NAT
W2 --> NAT
NAT --> YouTube([YouTube External API])

%% =========================
%% Storage
%% =========================
S3[("Amazon S3<br/>Media Storage")]

W1 --> S3
W2 --> S3
API1 --> S3
API2 --> S3

class S3 data;

%% =========================
%% Observability & Secrets
%% =========================
subgraph Observability["Observability & Security"]

    CW[CloudWatch Logs]
    SM[Secrets Manager]

end

classDef ops fill:#FCE4EC,stroke:#D81B60,stroke-width:2px;
class CW,SM ops;

API1 --> CW
API2 --> CW
W1 --> CW
W2 --> CW

SM --> API1
SM --> API2
SM --> W1
SM --> W2

%% =========================
%% CI/CD
%% =========================
subgraph CICD["CI/CD Pipeline"]

    GH[GitHub]
    GA[GitHub Actions]
    ECR["ECR Container Registry"]
    ECSClusterDeploy["ECS Deployment"]

end

classDef cicd fill:#FFFDE7,stroke:#F9A825,stroke-width:2px;
class GH,GA,ECR,ECSClusterDeploy cicd;

GH --> GA --> ECR --> ECSClusterDeploy --> ECSCluster

```

## CI/CD

Every PR runs lint and tests via GitHub Actions. Merging to `main` triggers a full deploy: Docker images are built, pushed to ECR, and ECS tasks are updated with a rolling deploy.

## Implementation roadmap

- [x] Routes / controllers / services separation
- [x] Winston logger + Morgan + request ID middleware + error handler + helmet
- [x] BullMQ queue + worker (concurrency limit + graceful shutdown)
- [x] Input validation for `start`/`end` timestamps
- [x] Rate limiting on `POST /api/audio` (Redis-backed)
- [ ] S3 upload + presigned URL download + health check endpoint
- [ ] Tests (Jest + Supertest, unit + integration)
- [ ] CI/CD (GitHub Actions — PR checks + deploy pipeline)
- [ ] Docker (separate Dockerfiles for API and worker)
- [ ] AWS (ECS + ElastiCache + S3 + CloudWatch + Secrets Manager)
