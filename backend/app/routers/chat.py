from fastapi import APIRouter, HTTPException
from app.schemas import ChatRequest, ChatResponse
from app.services.weather import WeatherService
from app.services.gemini import GeminiService
from app.routers.plan import build_weather_context

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("")
async def chat_assistant(req: ChatRequest):
    """
    Chat with the weather-aware monsoon preparedness assistant.
    """
    weather_context = None
    if req.city:
        weather_data = await WeatherService.get_weather_by_city(req.city)
        if weather_data:
            weather_context = build_weather_context(weather_data)
            
    try:
        response = await GeminiService.chat(
            message=req.message,
            chat_history=req.chat_history,
            weather_context=weather_context,
            language=req.language
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Assistant chat error: {str(e)}")
