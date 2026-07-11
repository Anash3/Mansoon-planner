import os
import json
from typing import Dict, Any, List, Optional
import google.generativeai as genai
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
    _configured = False

    @classmethod
    def configure_sdk(cls):
        if not cls._configured:
            api_key = settings.GEMINI_API_KEY
            if api_key:
                genai.configure(api_key=api_key)
                cls._configured = True
                print("Gemini SDK configured successfully.")
            else:
                print("WARNING: GEMINI_API_KEY not found. Operating in Mock Fallback Mode.")

    @classmethod
    def _is_mock_mode(cls) -> bool:
        cls.configure_sdk()
        return not cls._configured

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

        if cls._is_mock_mode():
            return cls._mock_preparedness_plan(city, household_size, has_pets, has_elderly_or_infants, flood_history, language)

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=PreparednessPlan,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return PreparednessPlan(**data)
        except Exception as e:
            print(f"Gemini API Error in generate_preparedness_plan: {e}. Falling back to mock data.")
            return cls._mock_preparedness_plan(city, household_size, has_pets, has_elderly_or_infants, flood_history, language)

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

        if cls._is_mock_mode():
            return cls._mock_checklist(household_size, has_pets, has_elderly_or_infants, language)

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=EmergencyChecklist,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return EmergencyChecklist(**data)
        except Exception as e:
            print(f"Gemini API Error in generate_checklist: {e}. Falling back to mock data.")
            return cls._mock_checklist(household_size, has_pets, has_elderly_or_infants, language)

    @classmethod
    async def generate_travel_advisory(
        cls,
        origin: str,
        destination: str,
        transport_mode: str,
        weather_context: str,
        language: str = "en"
    ) -> TravelAdvisory:

        prompt = (
            f"Analyze travel route safety from {origin} to {destination} using transport mode: {transport_mode}.\n"
            f"Weather Context along the region:\n{weather_context}\n\n"
            f"Evaluate weather-related hazards (e.g. waterlogging, open potholes, mudslides, lightning, low visibility). "
            f"Provide a safety advisory telling the user if it is safe, route hazard level, and specific warnings and alternative route suggestions. "
            f"Respond in language: {language}."
        )

        if cls._is_mock_mode():
            return cls._mock_travel_advisory(origin, destination, transport_mode, language)

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=TravelAdvisory,
                    temperature=0.2
                )
            )
            data = json.loads(response.text)
            return TravelAdvisory(**data)
        except Exception as e:
            print(f"Gemini API Error in generate_travel_advisory: {e}. Falling back to mock data.")
            return cls._mock_travel_advisory(origin, destination, transport_mode, language)

    @classmethod
    async def generate_safety_recommendations(
        cls,
        weather_context: str,
        language: str = "en"
    ) -> SafetyRecommendations:

        prompt = (
            f"Based on the following weather conditions:\n{weather_context}\n\n"
            f"Generate a list of safety scenarios (e.g. Lightning, Floods, Heavy Downpour, Power Outage) "
            f"with specific Do's and Don'ts for citizens to protect themselves. "
            f"Respond in language: {language}."
        )

        if cls._is_mock_mode():
            return cls._mock_safety_recommendations(language)

        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=SafetyRecommendations,
                    temperature=0.1
                )
            )
            data = json.loads(response.text)
            return SafetyRecommendations(**data)
        except Exception as e:
            print(f"Gemini API Error in generate_safety_recommendations: {e}. Falling back to mock data.")
            return cls._mock_safety_recommendations(language)

    @classmethod
    async def chat(
        cls,
        message: str,
        chat_history: List[Dict[str, str]],
        weather_context: Optional[str] = None,
        language: str = "en"
    ) -> ChatResponse:

        # Format history for Gemini API
        contents = []
        for turn in chat_history:
            role = "user" if turn.get("role") == "user" else "model"
            contents.append({"role": role, "parts": [{"text": turn.get("content", "")}]})
        
        # Add user's new message
        contents.append({"role": "user", "parts": [{"text": message}]})

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

        if cls._is_mock_mode():
            return cls._mock_chat_reply(message, language)

        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction
            )
            response = model.generate_content(
                contents,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json",
                    response_schema=ChatResponse,
                    temperature=0.5
                )
            )
            data = json.loads(response.text)
            return ChatResponse(**data)
        except Exception as e:
            print(f"Gemini API Error in chat: {e}. Falling back to mock response.")
            return cls._mock_chat_reply(message, language)

    # --- Robust Mocks for Key-Free / Offline Testing ---

    @classmethod
    def _mock_preparedness_plan(
        cls, city: str, household_size: int, has_pets: bool, has_elderly_or_infants: bool, flood_history: bool, language: str
    ) -> PreparednessPlan:
        # Simple translator helper for basic multilingual demo in mock mode
        is_hi = language.lower() in ["hi", "hindi"]
        
        risk = "High" if flood_history else "Medium"
        
        overview = (
            f"तैयारी योजना: {city} में मानसून के दौरान संभावित जलभराव के लिए।" if is_hi
            else f"Preparedness plan for {city}. Risk is elevated due to monsoon forecasts."
        )
        
        immediate = [
            "1-2 दिनों के लिए पीने का पानी और सूखा भोजन जमा करें।" if is_hi else "Secure 3-5 days of drinking water and dry rations.",
            "सभी इलेक्ट्रॉनिक उपकरणों को चार्ज रखें।" if is_hi else "Charge all powerbanks, mobile phones, and flashlights.",
            "नालियों को साफ करें और बेसमेंट से कीमती सामान ऊपर शिफ्ट करें।" if is_hi else "Verify local drainage is clear and elevate ground-level valuables."
        ]
        
        family = []
        if has_elderly_or_infants:
            family.append("बुजुर्गों/शिशुओं के लिए आवश्यक दवाएं 2 सप्ताह के लिए स्टॉक करें।" if is_hi else "Stock 2 weeks of essential medicines and pediatric supplies.")
        if has_pets:
            family.append("पालतू जानवरों के लिए भोजन और सुरक्षित स्थान सुरक्षित करें।" if is_hi else "Prepare pet food, collar, leash, and identify a dry shelter space.")
        family.append("परिवार के सभी सदस्यों को आपातकालीन संपर्क नंबर साझा करें।" if is_hi else "Align on an emergency communication plan for all family members.")

        reinforcements = [
            "छत और खिड़कियों के लीकेज की जाँच करें।" if is_hi else "Inspect rooftop and window seals for leakages.",
            "दरवाजे के पास वाटर बैरियर या सैंडबैग रखें।" if is_hi else "Prepare sandbags or water barriers if living in low-lying zones."
        ]
        
        contacts = [
            ContactItem(name="National Emergency Response (राष्ट्रीय आपातकाल)", contact_info="112"),
            ContactItem(name=f"{city} Disaster Mgmt (आपदा प्रबंधन)", contact_info="1077"),
            ContactItem(name="Red Cross Helpline (रेड क्रॉस)", contact_info="1800-XXX-XXXX")
        ]
        
        return PreparednessPlan(
            risk_level=risk,
            overview=overview,
            immediate_actions=immediate,
            family_safety_steps=family,
            home_reinforcements=reinforcements,
            emergency_contacts=contacts
        )

    @classmethod
    def _mock_checklist(cls, household_size: int, has_pets: bool, has_elderly_or_infants: bool, language: str) -> EmergencyChecklist:
        is_hi = language.lower() in ["hi", "hindi"]
        
        cat1_title = "भोजन और पानी" if is_hi else "Food & Water"
        cat1_items = [
            ChecklistItem(name="Drinking Water" if not is_hi else "पीने का पानी", description=f"At least {household_size * 3} Liters (3 liters per person per day for 3 days)", critical=True),
            ChecklistItem(name="Dry Rations" if not is_hi else "सूखा राशन", description="Biscuits, nuts, canned food, puffed rice", critical=True),
        ]
        
        cat2_title = "आपातकालीन उपकरण और रोशनी" if is_hi else "Emergency Gear & Lighting"
        cat2_items = [
            ChecklistItem(name="Flashlight" if not is_hi else "टॉर्च", description="LED flashlight with spare batteries", critical=True),
            ChecklistItem(name="Powerbank" if not is_hi else "पावर बैंक", description="Keep fully charged for mobile connectivity", critical=True),
            ChecklistItem(name="First Aid Kit" if not is_hi else "प्राथमिक उपचार किट", description="Bandages, antiseptic liquid, rehydration salts (ORS)", critical=True)
        ]

        categories = [
            ChecklistCategory(category=cat1_title, items=cat1_items),
            ChecklistCategory(category=cat2_title, items=cat2_items)
        ]

        if has_pets:
            pet_title = "पालतू पशुओं की आपूर्ति" if is_hi else "Pet Supplies"
            pet_items = [
                ChecklistItem(name="Pet Food" if not is_hi else "पालतू भोजन", description="Dry pet food, bowl, fresh water", critical=True),
                ChecklistItem(name="Pet Meds & Leash" if not is_hi else "दवा और पट्टा", description="Leash, collar, copy of vaccination details", critical=False)
            ]
            categories.append(ChecklistCategory(category=pet_title, items=pet_items))

        if has_elderly_or_infants:
            special_title = "विशेष आवश्यकताएं (बुजुर्ग/शिशु)" if is_hi else "Special Needs"
            special_items = [
                ChecklistItem(name="Daily Medication" if not is_hi else "नियमित दवाएं", description="At least a 14-day supply of prescriptions", critical=True),
                ChecklistItem(name="Infant Formula & Diapers" if not is_hi else "शिशु आहार और डायपर", description="If applicable, diapers, formula, baby wipes", critical=True)
            ]
            categories.append(ChecklistCategory(category=special_title, items=special_items))

        return EmergencyChecklist(
            title="Monsoon Emergency Survival Checklist" if not is_hi else "मानसून आपातकालीन जीवन रक्षा चेकलिस्ट",
            categories=categories
        )

    @classmethod
    def _mock_travel_advisory(cls, origin: str, destination: str, transport_mode: str, language: str) -> TravelAdvisory:
        is_hi = language.lower() in ["hi", "hindi"]
        
        warnings = [
            "waterlogging reported on lower roads" if not is_hi else "निचली सड़कों पर जलभराव की सूचना है",
            "traffic moving slow due to low visibility" if not is_hi else "कम दृश्यता के कारण यातायात धीमा है"
        ]
        
        precautions = [
            "Avoid driving through water of unknown depth." if not is_hi else "अज्ञात गहराई के पानी में वाहन न चलाएं।",
            "Keep headlights and hazard lights ON if heavy rain blocks view." if not is_hi else "भारी बारिश में हेडलाइट्स चालू रखें।",
            "Check traffic updates on navigation maps before starting." if not is_hi else "यात्रा शुरू करने से पहले मानचित्रों पर अपडेट देखें।"
        ]
        
        return TravelAdvisory(
            safe_to_travel=False if transport_mode.lower() in ["two-wheeler", "walking"] else True,
            hazard_level="Moderate" if transport_mode.lower() == "car" else "Severe",
            warnings=warnings,
            alternative_routes_advice="Consider using flyovers instead of low-lying subways. Delay travel by 2 hours if storm peaks." if not is_hi else "कम ऊंचाई वाले सबवे के बजाय फ्लाईओवर का उपयोग करें। यदि तूफान चरम पर हो तो यात्रा टाल दें।",
            recommended_precautions=precautions
        )

    @classmethod
    def _mock_safety_recommendations(cls, language: str) -> SafetyRecommendations:
        is_hi = language.lower() in ["hi", "hindi"]
        
        scenario1 = SafetyScenario(
            title="During Floods (बाढ़ के दौरान)" if is_hi else "During Floods",
            dos=[
                "Move to higher ground immediately." if not is_hi else "तुरंत ऊंचे स्थानों पर जाएं।",
                "Turn off main power switches and gas supplies." if not is_hi else "मुख्य बिजली स्विच और गैस आपूर्ति बंद करें।"
            ],
            donts=[
                "Do not walk or drive through flood waters." if not is_hi else "बाढ़ के पानी में न चलें और न ही वाहन चलाएं।",
                "Do not touch electric poles or fallen power lines." if not is_hi else "बिजली के खंभों या गिरी हुई तारों को न छुएं।"
            ]
        )
        
        scenario2 = SafetyScenario(
            title="Lightning & Thunderstorms (बिजली कड़कना)" if is_hi else "Lightning & Thunderstorms",
            dos=[
                "Stay indoors or seek shelter in a sturdy building." if not is_hi else "घर के अंदर रहें या किसी मजबूत इमारत में शरण लें।",
                "Unplug computers and sensitive appliances." if not is_hi else "कंप्यूटर और संवेदनशील उपकरणों को अनप्लग करें।"
            ],
            donts=[
                "Do not stand under tall trees or near metal poles." if not is_hi else "ऊंचे पेड़ों के नीचे या धातु के खंभों के पास न खड़े हों।",
                "Avoid using corded landline phones or running tap water." if not is_hi else "लैंडलाइन फोन का उपयोग करने या बहते नल के पानी से बचें।"
            ]
        )

        return SafetyRecommendations(recommendations=[scenario1, scenario2])

    @classmethod
    def _mock_chat_reply(cls, message: str, language: str) -> ChatResponse:
        is_hi = language.lower() in ["hi", "hindi"]
        
        reply = (
            "नमस्ते! मैं आपका मानसून सहायता सहायक हूँ। मानसून सुरक्षा के बारे में कुछ भी पूछें। "
            "सुरक्षित रहने के लिए कृपया हमेशा बिजली के खंभों से दूर रहें, उबला हुआ पानी पीएं, और बाढ़ के पानी से बचें।"
            if is_hi else
            "Hello! I am your Monsoon Safety Assistant. I am here to help you prepare and stay safe. "
            "Please ensure you stay away from damaged poles, drink boiled water, keep an emergency kit handy, and monitor local weather alerts."
        )
        
        actions = [
            "Check current weather" if not is_hi else "वर्तमान मौसम की जांच करें",
            "Generate safety checklist" if not is_hi else "सुरक्षा चेकलिस्ट बनाएं",
            "Ask about travel advice" if not is_hi else "यात्रा सलाह के बारे में पूछें"
        ]
        
        return ChatResponse(reply=reply, suggested_actions=actions)
