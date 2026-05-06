# Outreach AI

Lean internal AI outreach email tool (see `ARCHITECTURE.md` and `requirements/brd.md`).

## Prereqs
- Node.js (for `web/`)
- Python 3.11+ (for `api/`)
- Docker (optional, for local Postgres)

## Run web (Next.js)
```bash
cd web
pnpm dev
```

## Run api (FastAPI)
```bash
cd api
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Local Postgres (optional)
```bash
docker compose up -d
```

Set `DATABASE_URL` for Prisma (example):
`postgresql://outreach_ai:outreach_ai@localhost:5432/outreach_ai`

