const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface WeatherData {
  location: {
    name: string;
    latitude: number;
    longitude: number;
    country: string;
    admin1: string;
  };
  weather: {
    current: {
      temperature_2m: number;
      apparent_temperature: number;
      precipitation: number;
      rain: number;
      wind_speed_10m: number;
      weather_code: number;
    };
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      precipitation_sum: number[];
      precipitation_probability_max: number[];
      weather_code: number[];
    };
  };
}

export interface PreparednessPlanData {
  risk_level: string;
  overview: string;
  immediate_actions: string[];
  family_safety_steps: string[];
  home_reinforcements: string[];
  emergency_contacts: { name: string; contact_info: string }[];
}

export interface ChecklistItemData {
  name: string;
  description: string;
  critical: boolean;
}

export interface ChecklistCategoryData {
  category: string;
  items: ChecklistItemData[];
}

export interface ChecklistData {
  title: string;
  categories: ChecklistCategoryData[];
}

export interface PlanGenerationResponse {
  city: string;
  weather_summary: string;
  plan: PreparednessPlanData;
  checklist: ChecklistData;
}

export interface TravelAdvisoryData {
  safe_to_travel: boolean;
  hazard_level: string;
  warnings: string[];
  alternative_routes_advice: string;
  recommended_precautions: string[];
}

export interface SafetyScenarioData {
  title: string;
  dos: string[];
  donts: string[];
}

export interface SafetyRecommendationsData {
  recommendations: SafetyScenarioData[];
}

export interface ChatResponseData {
  reply: string;
  suggested_actions: string[];
}

export async function fetchWeather(city: string): Promise<WeatherData> {
  const res = await fetch(`${API_BASE_URL}/api/weather?city=${encodeURIComponent(city)}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch weather" }));
    throw new Error(err.detail || "Failed to fetch weather data.");
  }
  return res.json();
}

export async function generatePlan(
  city: string,
  householdSize: number,
  hasPets: boolean,
  hasElderlyOrInfants: boolean,
  floodHistory: boolean,
  language: string = "en"
): Promise<PlanGenerationResponse> {
  const res = await fetch(`${API_BASE_URL}/api/plan/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city,
      household_size: householdSize,
      has_pets: hasPets,
      has_elderly_or_infants: hasElderlyOrInfants,
      flood_history: floodHistory,
      language,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to generate plan" }));
    throw new Error(err.detail || "Failed to generate plan.");
  }
  return res.json();
}

export async function fetchTravelAdvisory(
  origin: string,
  destination: string,
  transportMode: string,
  language: string = "en"
): Promise<TravelAdvisoryData> {
  const res = await fetch(`${API_BASE_URL}/api/plan/travel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      origin,
      destination,
      transport_mode: transportMode,
      language,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch travel advisory" }));
    throw new Error(err.detail || "Failed to fetch travel advisory.");
  }
  return res.json();
}

export async function fetchSafetyRecommendations(
  city: string,
  language: string = "en"
): Promise<SafetyRecommendationsData> {
  const res = await fetch(
    `${API_BASE_URL}/api/plan/safety?city=${encodeURIComponent(city)}&language=${encodeURIComponent(language)}`
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to fetch safety rules" }));
    throw new Error(err.detail || "Failed to fetch safety rules.");
  }
  return res.json();
}

export async function sendChatMessage(
  message: string,
  chatHistory: { role: string; content: string }[],
  city?: string,
  language: string = "en"
): Promise<ChatResponseData> {
  const res = await fetch(`${API_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      chat_history: chatHistory,
      city,
      language,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Failed to send message" }));
    throw new Error(err.detail || "Failed to communicate with chat assistant.");
  }
  return res.json();
}
