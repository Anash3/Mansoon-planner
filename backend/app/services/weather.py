import httpx
import time
import traceback
from typing import Dict, Any, Optional

class WeatherService:
    _cache: Dict[str, tuple[float, Dict[str, Any]]] = {}
    _cache_ttl: float = 300.0  # 5 minutes in seconds

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
                print(f"Error in get_weather: {e}")
                traceback.print_exc()
                return None

    @staticmethod
    def map_wttr_in_response(data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps wttr.in JSON format to the Open-Meteo unified schema.
        """
        area = data.get("nearest_area", [{}])[0]
        loc_name = area.get("areaName", [{}])[0].get("value", "Mumbai")
        
        # Safely parse float values
        try:
            lat = float(area.get("latitude", 0.0))
        except (ValueError, TypeError):
            lat = 0.0
            
        try:
            lon = float(area.get("longitude", 0.0))
        except (ValueError, TypeError):
            lon = 0.0
            
        country = area.get("country", [{}])[0].get("value", "India")
        admin1 = area.get("region", [{}])[0].get("value", "")
        
        current = data.get("current_condition", [{}])[0]
        
        try:
            temp = float(current.get("temp_C", 0.0))
        except (ValueError, TypeError):
            temp = 0.0
            
        try:
            app_temp = float(current.get("FeelsLikeC", 0.0))
        except (ValueError, TypeError):
            app_temp = temp
            
        try:
            precip = float(current.get("precipMM", 0.0))
        except (ValueError, TypeError):
            precip = 0.0
            
        try:
            wind = float(current.get("windspeedKmph", 0.0))
        except (ValueError, TypeError):
            wind = 0.0
            
        try:
            humidity = float(current.get("humidity", 0.0))
        except (ValueError, TypeError):
            humidity = 0.0
        
        # Map wttr weather code to Open-Meteo equivalent
        try:
            wttr_code = int(current.get("weatherCode", 113))
        except (ValueError, TypeError):
            wttr_code = 113
            
        weather_code = 3  # Default to cloudy
        if wttr_code == 113:
            weather_code = 0  # Clear sky
        elif wttr_code in [176, 263, 293, 296, 299, 302, 305, 308, 353, 356, 359]:
            weather_code = 63  # Rain
        elif wttr_code in [386, 389, 392, 395]:
            weather_code = 95  # Thunderstorm
        
        daily_days = data.get("weather", [])
        times = []
        codes = []
        max_temps = []
        min_temps = []
        precip_sums = []
        precip_probs = []
        
        for day in daily_days:
            times.append(day.get("date"))
            
            try:
                max_temps.append(float(day.get("maxtempC", 0.0)))
            except (ValueError, TypeError):
                max_temps.append(0.0)
                
            try:
                min_temps.append(float(day.get("mintempC", 0.0)))
            except (ValueError, TypeError):
                min_temps.append(0.0)
            
            # Sum precipitation for the day and get max rain chance
            day_precip = 0.0
            max_prob = 0
            for hr in day.get("hourly", []):
                try:
                    day_precip += float(hr.get("precipMM", 0.0))
                except (ValueError, TypeError):
                    pass
                
                try:
                    max_prob = max(max_prob, int(hr.get("chanceofrain", 0)))
                except (ValueError, TypeError):
                    pass
                
            precip_sums.append(day_precip)
            precip_probs.append(max_prob)
            
            # Map daily weather code based on the first hourly report
            try:
                day_wttr_code = int(day.get("hourly", [{}])[0].get("weatherCode", 113))
            except (ValueError, TypeError):
                day_wttr_code = 113
                
            day_code = 3
            if day_wttr_code == 113:
                day_code = 0
            elif day_wttr_code in [176, 263, 293, 296, 299, 302, 305, 308, 353, 356, 359]:
                day_code = 63
            elif day_wttr_code in [386, 389, 392, 395]:
                day_code = 95
            codes.append(day_code)
            
        return {
            "location": {
                "name": loc_name,
                "latitude": lat,
                "longitude": lon,
                "country": country,
                "admin1": admin1
            },
            "weather": {
                "current": {
                    "temperature_2m": temp,
                    "apparent_temperature": app_temp,
                    "precipitation": precip,
                    "rain": precip,
                    "wind_speed_10m": wind,
                    "relative_humidity_2m": humidity,
                    "weather_code": weather_code
                },
                "daily": {
                    "time": times,
                    "weather_code": codes,
                    "temperature_2m_max": max_temps,
                    "temperature_2m_min": min_temps,
                    "precipitation_sum": precip_sums,
                    "precipitation_probability_max": precip_probs
                }
            }
        }

    @classmethod
    async def get_weather_by_city(cls, city: str) -> Optional[Dict[str, Any]]:
        """
        Helper method to geocode and fetch weather in one go, with in-memory caching
        and auto-fallback to wttr.in if Open-Meteo is rate-limited (429) or offline.
        """
        city_key = city.strip().lower()
        now = time.time()
        
        # Check cache validity
        if city_key in cls._cache:
            cache_ts, cached_data = cls._cache[city_key]
            if now - cache_ts < cls._cache_ttl:
                return cached_data
                
        # 1. Try Open-Meteo first
        print(f"Querying Open-Meteo geocoder for '{city}'...")
        geo_info = await cls.geocode_city(city)
        if geo_info:
            print(f"Querying Open-Meteo weather forecast for '{city}' ({geo_info['latitude']}, {geo_info['longitude']})...")
            weather_info = await cls.get_weather(geo_info["latitude"], geo_info["longitude"])
            if weather_info:
                data = {
                    "location": geo_info,
                    "weather": weather_info
                }
                cls._cache[city_key] = (now, data)
                return data
                
        # 2. Fallback to wttr.in if Open-Meteo fails or is rate-limited (HTTP 429)
        print(f"Open-Meteo failed or rate-limited for '{city}'. Activating wttr.in backup weather provider...")
        try:
            url = f"https://wttr.in/{city}?format=j1"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
            transport = httpx.AsyncHTTPTransport(local_address="0.0.0.0")
            async with httpx.AsyncClient(transport=transport, verify=False) as client:
                response = await client.get(url, headers=headers, timeout=12.0)
                if response.status_code == 200:
                    wttr_data = response.json()
                    data = cls.map_wttr_in_response(wttr_data)
                    cls._cache[city_key] = (now, data)
                    print(f"wttr.in backup successfully resolved weather for '{city}'!")
                    return data
                else:
                    print(f"Backup wttr.in also failed with status code: {response.status_code}")
        except Exception as fallback_err:
            print(f"wttr.in fallback failed with exception: {fallback_err}")
            traceback.print_exc()
            
        return None
