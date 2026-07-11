from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# --- API Request Schemas ---

class PlanRequest(BaseModel):
    city: str
    household_size: int = Field(default=1, ge=1)
    has_pets: bool = False
    has_elderly_or_infants: bool = False
    flood_history: bool = False
    language: str = "en"

class TravelRequest(BaseModel):
    origin: str
    destination: str
    transport_mode: str = "Car"  # Car, Two-wheeler, Public Transport, Walking
    language: str = "en"

class ChatRequest(BaseModel):
    message: str
    chat_history: List[Dict[str, str]] = []  # List of {"role": "user"|"model", "content": "..."}
    city: Optional[str] = None
    language: str = "en"


# --- Structured GenAI Response Schemas ---

class ContactItem(BaseModel):
    name: str = Field(description="Name of the department or service (e.g., Flood Control, Ambulance)")
    contact_info: str = Field(description="Phone number, helpline number, or website")

class PreparednessPlan(BaseModel):
    risk_level: str = Field(description="Calculated risk level (Low, Medium, High, Critical) based on weather and inputs")
    overview: str = Field(description="Brief summary of the weather threat and household risk")
    immediate_actions: List[str] = Field(description="Actionable steps that must be done in the next 1-2 hours")
    family_safety_steps: List[str] = Field(description="Personalized safety measures for family, pets, and vulnerable members")
    home_reinforcements: List[str] = Field(description="Structural adjustments, drainage clearance, or power prep needed")
    emergency_contacts: List[ContactItem] = Field(description="A list of relevant emergency numbers or websites for their city")

class ChecklistItem(BaseModel):
    name: str = Field(description="Name of the item (e.g., Flashlight, Dry rations)")
    description: str = Field(description="Brief note on why this is needed or how much quantity to keep")
    critical: bool = Field(description="True if this item is absolutely essential for basic survival, False if optional/convenience")

class ChecklistCategory(BaseModel):
    category: str = Field(description="Name of the category (e.g., Food & Water, Medical Kit, Documents & Money, Tools & Power)")
    items: List[ChecklistItem] = Field(description="List of checklist items in this category")

class EmergencyChecklist(BaseModel):
    title: str = Field(description="A descriptive title for the checklist")
    categories: List[ChecklistCategory] = Field(description="List of item categories")

class TravelAdvisory(BaseModel):
    safe_to_travel: bool = Field(description="Whether travel is generally recommended or should be avoided")
    hazard_level: str = Field(description="Calculated route risk level (None, Low, Moderate, Severe)")
    warnings: List[str] = Field(description="Active weather warnings, flooding, waterlogging, or wind advisories along the route")
    alternative_routes_advice: str = Field(description="Recommendations on alternate routes, areas to avoid, or wait times")
    recommended_precautions: List[str] = Field(description="Precautions to take if travel is unavoidable (e.g., drive slowly, pack emergency powerbank)")

class SafetyScenario(BaseModel):
    title: str = Field(description="The weather scenario (e.g., Floods, Lightning, Heavy Rain, Power Outages)")
    dos: List[str] = Field(description="Clear, concise safety rules of what to do")
    donts: List[str] = Field(description="Clear, concise safety rules of what NOT to do")

class SafetyRecommendations(BaseModel):
    recommendations: List[SafetyScenario]

class ChatResponse(BaseModel):
    reply: str = Field(description="The response content answering the user query, incorporating weather and localized contexts")
    suggested_actions: List[str] = Field(description="2-3 quick follow-up actions they can take based on this response")
