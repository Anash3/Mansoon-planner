import httpx
from typing import Dict, Any, Optional

class WeatherService:
    @staticmethod
    async def geocode_city(city: str) -> Optional[Dict[str, Any]]:
        """
        Geocodes a city name into latitude, longitude, country, and admin division.
        """
        url = f"https://geocoding-api.open-meteo.com/v1/search?name={city}&count=1&language=en&format=json"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
        async with httpx.AsyncClient(transport=transport, verify=False) as client:
            try:
                response = await client.get(url, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    if results:
                        result = results[0]
                        return {
                            "name": result.get("name"),
                            "latitude": result.get("latitude"),
                            "longitude": result.get("longitude"),
                            "country": result.get("country"),
                            "admin1": result.get("admin1"),
                        }
                else:
                    print(f"Geocoding API responded with status code: {response.status_code}")
                return None
            except Exception as e:
                import traceback
                print(f"Error in geocode_city: {e}")
                traceback.print_exc()
                return None

    @staticmethod
    async def get_weather(lat: float, lon: float) -> Optional[Dict[str, Any]]:
        """
        Fetches current weather and forecast for given coordinates.
        """
        url = (
            f"https://api.open-meteo.com/v1/forecast"
            f"?latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m"
            f"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
            f"&timezone=auto"
        )
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        }
        transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
        async with httpx.AsyncClient(transport=transport, verify=False) as client:
            try:
                response = await client.get(url, headers=headers, timeout=10.0)
                if response.status_code == 200:
                    return response.json()
                else:
                    print(f"Weather API responded with status code: {response.status_code}")
                return None
            except Exception as e:
                import traceback
                print(f"Error in get_weather: {e}")
                traceback.print_exc()
                return None

    @classmethod
    async def get_weather_by_city(cls, city: str) -> Optional[Dict[str, Any]]:
        """
        Helper method to geocode and fetch weather in one go.
        """
        geo_info = await cls.geocode_city(city)
        if not geo_info:
            return None
        
        weather_info = await cls.get_weather(geo_info["latitude"], geo_info["longitude"])
        if not weather_info:
            return None
            
        return {
            "location": geo_info,
            "weather": weather_info
        }
