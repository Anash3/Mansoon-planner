from fastapi import APIRouter, HTTPException, Query
import asyncio
from app.schemas import PlanRequest, TravelRequest
from app.services.weather import WeatherService
from app.services.gemini import GeminiService
from typing import Dict, Any, Optional

router = APIRouter(prefix="/plan", tags=["Plan"])


def build_weather_context(weather_data: Optional[Dict[str, Any]]) -> str:
    """
    Utility to serialize weather API data into a readable summary for Gemini.
    """
    if not weather_data:
        return "Weather data unavailable. General monsoon safety protocols apply."

    loc = weather_data.get("location", {})
    weather = weather_data.get("weather", {})
    current = weather.get("current", {})
    daily = weather.get("daily", {})

    # Safely extract daily list values
    max_temp = daily.get("temperature_2m_max", [None])[0]
    min_temp = daily.get("temperature_2m_min", [None])[0]
    rain_sum = daily.get("precipitation_sum", [None])[0]
    precip_prob = daily.get("precipitation_probability_max", [None])[0]

    summary = (
        f"Location: {loc.get('name')}, {loc.get('country')}\n"
        f"Current Conditions:\n"
        f"- Temperature: {current.get('temperature_2m')}°C (Apparent: {current.get('apparent_temperature')}°C)\n"
        f"- Precipitation Rate: {current.get('precipitation')} mm\n"
        f"- Rain Rate: {current.get('rain')} mm\n"
        f"- Wind Speed: {current.get('wind_speed_10m')} km/h\n"
        f"Forecast for Today/Coming Days:\n"
        f"- Max Temp: {max_temp}°C, Min Temp: {min_temp}°C\n"
        f"- Max Precipitation Probability: {precip_prob}%\n"
        f"- Predicted Rainfall Sum: {rain_sum} mm\n"
    )
    return summary


@router.post("/generate")
async def generate_preparedness_kit(req: PlanRequest):
    """
    Generate a personalized plan and emergency checklist based on weather & household details.
    """
    # 1. Fetch weather context
    weather_data = await WeatherService.get_weather_by_city(req.city)
    weather_context = build_weather_context(weather_data)

    # 2. Run plan generation and checklist generation in parallel
    try:
        plan_task = GeminiService.generate_preparedness_plan(
            city=req.city,
            household_size=req.household_size,
            has_pets=req.has_pets,
            has_elderly_or_infants=req.has_elderly_or_infants,
            flood_history=req.flood_history,
            weather_context=weather_context,
            language=req.language,
        )

        checklist_task = GeminiService.generate_checklist(
            city=req.city,
            household_size=req.household_size,
            has_pets=req.has_pets,
            has_elderly_or_infants=req.has_elderly_or_infants,
            weather_context=weather_context,
            language=req.language,
        )

        plan, checklist = await asyncio.gather(plan_task, checklist_task)

        return {
            "city": req.city,
            "weather_summary": weather_context,
            "plan": plan,
            "checklist": checklist,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate plan: {str(e)}"
        )


@router.post("/travel")
async def get_travel_recommendation(req: TravelRequest):
    """
    Evaluate travel risk between origin and destination.
    """
    # Fetch weather for origin and destination in parallel using asyncio.gather
    origin_task = WeatherService.get_weather_by_city(req.origin)
    dest_task = WeatherService.get_weather_by_city(req.destination)
    origin_weather, dest_weather = await asyncio.gather(origin_task, dest_task)

    origin_context = build_weather_context(origin_weather)
    dest_context = build_weather_context(dest_weather)

    combined_weather_context = (
        f"--- Origin Weather ({req.origin}) ---\n{origin_context}\n"
        f"--- Destination Weather ({req.destination}) ---\n{dest_context}\n"
    )

    try:
        advisory = await GeminiService.generate_travel_advisory(
            origin=req.origin,
            destination=req.destination,
            transport_mode=req.transport_mode,
            weather_context=combined_weather_context,
            language=req.language,
        )
        return advisory
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to analyze travel route: {str(e)}"
        )


@router.get("/safety")
async def get_safety_rules(
    city: str = Query(..., description="City to customize safety rules for"),
    language: str = "en",
):
    """
    Get customized safety Recommendations (Dos and Don'ts) based on current weather.
    """
    weather_data = await WeatherService.get_weather_by_city(city)
    weather_context = build_weather_context(weather_data)

    try:
        recommendations = await GeminiService.generate_safety_recommendations(
            weather_context=weather_context, language=language
        )
        return recommendations
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate safety recommendations: {str(e)}",
        )
