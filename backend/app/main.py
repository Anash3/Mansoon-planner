from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import weather, plan, chat
from app.services.gemini import GeminiService

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="GenAI-powered platform helping citizens prepare for monsoon hazards.",
    version="1.0.0"
)

# Configure CORS for local development and cloud deployments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for quick integration; restrict in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to configure Gemini SDK
@app.on_event("startup")
async def startup_event():
    GeminiService.configure_sdk()

# Include Routers
app.include_router(weather.router, prefix="/api")
app.include_router(plan.router, prefix="/api")
app.include_router(chat.router, prefix="/api")

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "gemini_api_key_configured": bool(settings.GEMINI_API_KEY)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
