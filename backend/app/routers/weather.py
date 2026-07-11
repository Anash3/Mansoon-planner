from fastapi import APIRouter, HTTPException, Query
from app.services.weather import WeatherService

router = APIRouter(prefix="/weather", tags=["Weather"])

@router.get("")
async def get_weather_data(city: str = Query(..., description="Name of the city to retrieve weather for")):
    """
    Get current weather and 7-day forecast for a city.
    """
    if not city.strip():
        raise HTTPException(status_code=400, detail="City parameter cannot be empty.")
    
    data = await WeatherService.get_weather_by_city(city)
    if not data:
        raise HTTPException(
            status_code=404, 
            detail=f"Could not find weather data for city '{city}'. Please check the spelling or try a larger nearby city."
        )
    
    return data
