import os
import json
from typing import Dict, Any, List, Optional
from google import genai
from google.genai import types
from app.config import settings
from app.schemas import (
    PreparednessPlan,
    EmergencyChecklist,
    TravelAdvisory,
    SafetyRecommendations,
    ChatResponse,
    ContactItem,
    ChecklistCategory,
    ChecklistItem,
    SafetyScenario
)

class GeminiService:
    _client = None

    @classmethod
    def configure_sdk(cls) -> Optional[genai.Client]:
        if cls._client is None:
            api_key = settings.GEMINI_API_KEY
            if api_key:
                # Initialize the new Google GenAI client
                cls._client = genai.Client(api_key=api_key)
                print("Gemini SDK (google-genai) configured successfully.")
            else:
                print("WARNING: GEMINI_API_KEY is not configured.")
        return cls._client

    @classmethod
    def _verify_configuration(cls) -> genai.Client:
        client = cls.configure_sdk()
        if client is None:
            raise ValueError(
                "Gemini API is not configured. Please set the GEMINI_API_KEY environment variable in your backend environment."
            )
        return client

    @classmethod
    async def generate_preparedness_plan(
        cls,
        city: str,
        household_size: int,
        has_pets: bool,
        has_elderly_or_infants: bool,
        flood_history: bool,
        weather_context: str,
        language: str = "en"
    ) -> PreparednessPlan:
        
        client = cls._verify_configuration()

        prompt = (
            f"Generate a highly personalized monsoon preparedness plan for a citizen in {city}.\n"
            f"Household Details:\n"
            f"- Size: {household_size} members\n"
            f"- Pets: {'Yes' if has_pets else 'No'}\n"
            f"- Vulnerable (elderly/infants): {'Yes' if has_elderly_or_infants else 'No'}\n"
            f"- Home has history of flooding: {'Yes' if flood_history else 'No'}\n\n"
            f"Local Weather Context:\n{weather_context}\n\n"
            f"Ensure the risk level, immediate actions, and structural reinforcements match their specific risk profile. "
            f"Provide localized advice and actual/realistic emergency contact numbers or websites for {city}. "
            f"Respond in language: {language}."
        )

        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=PreparednessPlan,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return PreparednessPlan(**data)
        except Exception as e:
            raise RuntimeError(f"Gemini API Call failed in generate_preparedness_plan: {str(e)}")

    @classmethod
    async def generate_checklist(
        cls,
        city: str,
        household_size: int,
        has_pets: bool,
        has_elderly_or_infants: bool,
        weather_context: str,
        language: str = "en"
    ) -> EmergencyChecklist:

        client = cls._verify_configuration()

        prompt = (
            f"Create a comprehensive emergency checklist for monsoon preparedness in {city}.\n"
            f"Tailor quantities and specific items for:\n"
            f"- Household size: {household_size} people\n"
            f"- Pets: {'Yes' if has_pets else 'No'}\n"
            f"- Vulnerable members: {'Yes' if has_elderly_or_infants else 'No'}\n\n"
            f"Local Weather Context:\n{weather_context}\n\n"
            f"Provide items categorized neatly (e.g. Food & Water, Medical, Emergency Gear). "
            f"Respond in language: {language}."
        )

        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=EmergencyChecklist,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return EmergencyChecklist(**data)
        except Exception as e:
            raise RuntimeError(f"Gemini API Call failed in generate_checklist: {str(e)}")

    @classmethod
    async def generate_travel_advisory(
        cls,
        origin: str,
        destination: str,
        transport_mode: str,
        weather_context: str,
        language: str = "en"
    ) -> TravelAdvisory:

        client = cls._verify_configuration()

        prompt = (
            f"Analyze travel route safety from {origin} to {destination} using transport mode: {transport_mode}.\n"
            f"Weather Context along the region:\n{weather_context}\n\n"
            f"Evaluate weather-related hazards (e.g. waterlogging, open potholes, mudslides, lightning, low visibility). "
            f"Provide a safety advisory telling the user if it is safe, route hazard level, and specific warnings and alternative route suggestions. "
            f"Respond in language: {language}."
        )

        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=TravelAdvisory,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return TravelAdvisory(**data)
        except Exception as e:
            raise RuntimeError(f"Gemini API Call failed in generate_travel_advisory: {str(e)}")

    @classmethod
    async def generate_safety_recommendations(
        cls,
        weather_context: str,
        language: str = "en"
    ) -> SafetyRecommendations:

        client = cls._verify_configuration()

        prompt = (
            f"Based on the following weather conditions:\n{weather_context}\n\n"
            f"Generate a list of safety scenarios (e.g. Lightning, Floods, Heavy Downpour, Power Outage) "
            f"with specific Do's and Don'ts for citizens to protect themselves. "
            f"Respond in language: {language}."
        )

        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=SafetyRecommendations,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            return SafetyRecommendations(**data)
        except Exception as e:
            raise RuntimeError(f"Gemini API Call failed in generate_safety_recommendations: {str(e)}")

    @classmethod
    async def chat(
        cls,
        message: str,
        chat_history: List[Dict[str, str]],
        weather_context: Optional[str] = None,
        language: str = "en"
    ) -> ChatResponse:

        client = cls._verify_configuration()

        # Format history for Gemini API using the new types format
        contents = []
        for turn in chat_history:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append(
                types.Content(
                    role=role,
                    parts=[types.Part.from_text(text=turn.get("content", ""))]
                )
            )
        
        # Add user's new message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)]
            )
        )

        system_instruction = (
            "You are a helpful, expert Monsoon Preparedness and Emergency Assistance Assistant. "
            "Your main priority is helping people stay safe before, during, and after severe rains, floods, and winds.\n"
        )
        if weather_context:
            system_instruction += f"Here is the user's local weather data:\n{weather_context}\n"
        
        system_instruction += (
            f"Always prioritize life safety. Keep your answers concise, practical, and highly relevant. "
            f"Translate or respond in: {language}. "
            "You must supply your response in the required JSON format containing 'reply' (markdown formatted string) "
            "and 'suggested_actions' (list of 2-3 short follow-up tasks for the user)."
        )

        try:
            response = client.models.generate_content(
                model="gemini-1.5-flash",
                contents=contents,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ChatResponse,
                    system_instruction=system_instruction,
                    temperature=0.5
                )
            )
            data = json.loads(response.text)
            return ChatResponse(**data)
        except Exception as e:
            raise RuntimeError(f"Gemini API Call failed in chat: {str(e)}")
