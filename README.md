# Assessment Portal

A modern assessment module built with **FastAPI** (backend) and **Next.js 15** (frontend) featuring real-time anti-cheat detection (paste prevention, AI phrase analysis, and window/tab switch monitoring).

## Project Structure

```text
├── frontend/             # Next.js 15 App Router + Tailwind CSS v4 + TypeScript
└── backend/              # FastAPI + Pydantic v2 + Uvicorn + Pytest
```

## Quick Start

### 1. Run the Backend (FastAPI)
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
- API Docs (Swagger UI): [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- Tests: `pytest -v tests/`

### 2. Run the Frontend (Next.js)
```bash
cd frontend
bun install     # or npm install
bun dev         # or npm run dev
```
- Assessment Portal: [http://localhost:3000](http://localhost:3000)

## Deployment

- **Frontend:** Deploy to [Vercel](https://vercel.com) (set Root Directory to `frontend` and `NEXT_PUBLIC_API_BASE_URL` to your backend URL).
- **Backend:** Deploy to [Render](https://render.com) (set Root Directory to `backend`, Build Command to `pip install -r requirements.txt`, and Start Command to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
