from fastapi.testclient import TestClient
from unittest.mock import patch
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
            "admin1": "Maharashtra",
        },
        "weather": {
            "current": {
                "temperature_2m": 28.5,
                "apparent_temperature": 32.0,
                "precipitation": 12.0,
                "rain": 12.0,
                "wind_speed_10m": 18.5,
            },
            "daily": {
                "temperature_2m_max": [30.0],
                "temperature_2m_min": [25.0],
                "precipitation_sum": [45.0],
                "precipitation_probability_max": [95],
            },
        },
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
    response = client.post(
        "/api/plan/generate", json={"city": "Mumbai", "household_size": 0}
    )
    assert response.status_code == 422  # Unprocessable Entity


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.generate_preparedness_plan")
@patch("app.services.gemini.GeminiService.generate_checklist")
def test_plan_generation_success(mock_checklist, mock_plan, mock_weather):
    # Mock weather
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }

    # Mock Gemini Service plan & checklist
    mock_plan.return_value = {
        "risk_level": "High",
        "overview": "Heavy rain predicted.",
        "immediate_actions": ["Clear drains"],
        "family_safety_steps": ["Keep pets inside"],
        "home_reinforcements": [],
        "emergency_contacts": [],
    }
    mock_checklist.return_value = {"title": "Emergency Kit", "categories": []}

    response = client.post(
        "/api/plan/generate",
        json={"city": "Mumbai", "household_size": 3, "has_pets": True},
    )

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["city"] == "Mumbai"
    assert "plan" in json_data
    assert "checklist" in json_data


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.generate_travel_advisory")
def test_travel_advisory_success(mock_travel, mock_weather):
    # Mock weather for origin and destination
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_travel.return_value = {
        "safe_to_travel": False,
        "hazard_level": "Severe",
        "warnings": ["Flooding in low-lying areas"],
        "alternative_routes_advice": "Wait for rain to stop.",
        "recommended_precautions": ["Avoid underpasses"],
    }

    response = client.post(
        "/api/plan/travel",
        json={"origin": "Mumbai", "destination": "Pune", "transport_mode": "Car"},
    )

    assert response.status_code == 200
    json_data = response.json()
    assert json_data["safe_to_travel"] is False
    assert json_data["hazard_level"] == "Severe"


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.chat")
def test_chat_copilot_success(mock_chat, mock_weather):
    # Mock weather for location context
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_chat.return_value = {
        "reply": "Yes, heavy rain is expected. Stay indoors.",
        "suggested_actions": ["Store clean drinking water"],
    }

    response = client.post(
        "/api/chat",
        json={
            "message": "Is it safe to go out in Mumbai?",
            "city": "Mumbai",
            "chat_history": [],
        },
    )

    assert response.status_code == 200
    json_data = response.json()
    assert "reply" in json_data
    assert json_data["reply"] == "Yes, heavy rain is expected. Stay indoors."


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.generate_safety_recommendations")
def test_safety_rules_success(mock_safety, mock_weather):
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_safety.return_value = {
        "recommendations": [
            {
                "title": "Floods",
                "dos": ["Move to high ground"],
                "donts": ["Do not walk through water"],
            }
        ]
    }

    response = client.get("/api/plan/safety?city=Mumbai")
    assert response.status_code == 200
    json_data = response.json()
    assert "recommendations" in json_data
    assert len(json_data["recommendations"]) == 1
    assert json_data["recommendations"][0]["title"] == "Floods"


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.generate_preparedness_plan")
def test_plan_generation_error(mock_plan, mock_weather):
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_plan.side_effect = Exception("Gemini service failed")

    response = client.post(
        "/api/plan/generate", json={"city": "Mumbai", "household_size": 3}
    )
    assert response.status_code == 500
    assert "detail" in response.json()


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.generate_travel_advisory")
def test_travel_advisory_error(mock_travel, mock_weather):
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_travel.side_effect = Exception("Gemini route fail")

    response = client.post(
        "/api/plan/travel",
        json={"origin": "Mumbai", "destination": "Pune", "transport_mode": "Car"},
    )
    assert response.status_code == 500
    assert "detail" in response.json()


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.chat")
def test_chat_copilot_error(mock_chat, mock_weather):
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_chat.side_effect = Exception("Gemini chat fail")

    response = client.post(
        "/api/chat", json={"message": "Is it safe?", "city": "Mumbai"}
    )
    assert response.status_code == 500
    assert "detail" in response.json()


@patch("app.services.weather.WeatherService.get_weather_by_city")
@patch("app.services.gemini.GeminiService.generate_safety_recommendations")
def test_safety_rules_error(mock_safety, mock_weather):
    mock_weather.return_value = {
        "location": {
            "name": "Mumbai",
            "latitude": 19.076,
            "longitude": 72.877,
            "country": "India",
            "admin1": "Maharashtra",
        },
        "weather": {"current": {"temperature_2m": 28.0}},
    }
    mock_safety.side_effect = Exception("Gemini safety fail")

    response = client.get("/api/plan/safety?city=Mumbai")
    assert response.status_code == 500
    assert "detail" in response.json()
