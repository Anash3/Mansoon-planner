import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "online"
    assert "project" in json_data

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["status"] == "healthy"

@patch("app.services.weather.WeatherService.get_weather_by_city")
def test_weather_endpoint_success(mock_get_weather):
    # Setup mock weather data
    mock_get_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra"
        },
        "weather": {
            "current": {
                "temperature_2m": 28.5,
                "apparent_temperature": 32.0,
                "precipitation": 12.0,
                "rain": 12.0,
                "wind_speed_10m": 18.5
            },
            "daily": {
                "temperature_2m_max": [30.0],
                "temperature_2m_min": [25.0],
                "precipitation_sum": [45.0],
                "precipitation_probability_max": [95]
            }
        }
    }
    
    response = client.get("/api/weather?city=Mumbai")
    assert response.status_code == 200
    json_data = response.json()
    assert json_data["location"]["name"] == "Mumbai"
    assert json_data["weather"]["current"]["temperature_2m"] == 28.5

@patch("app.services.weather.WeatherService.get_weather_by_city")
def test_weather_endpoint_not_found(mock_get_weather):
    mock_get_weather.return_value = None
    response = client.get("/api/weather?city=NonExistentCity123")
    assert response.status_code == 404

def test_plan_generation_validation():
    # Household size less than 1 should trigger a validation error
    response = client.post("/api/plan/generate", json={
        "city": "Mumbai",
        "household_size": 0
    })
    assert response.status_code == 422  # Unprocessable Entity
