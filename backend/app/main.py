import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from app.routes.assessment import router as assessment_router

app = FastAPI(
    title="Assessment Portal API",
    version="1.0.0",
    description="Backend service for technical assessments and candidate integrity evaluations.",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")
allowed_origins = [origin.strip() for origin in frontend_origin.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError):
    errors = exc.errors()
    if errors:
        first = errors[0]
        msg = first.get("msg", "Validation error")
        loc = " -> ".join(str(l) for l in first.get("loc", []) if l != "body")
        detail_msg = f"{loc}: {msg}" if loc else msg
    else:
        detail_msg = "Invalid request payload."
    return JSONResponse(status_code=422, content={"detail": detail_msg})


app.include_router(assessment_router)


@app.get("/health", tags=["health"])
async def health_check():
    return {"status": "ok"}
