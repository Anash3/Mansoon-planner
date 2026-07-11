# JalDrishti: Monsoon Preparedness & Citizen Assistance Hub

**JalDrishti** (meaning *Water Vision* or *Foresight*) is a Generative AI-powered safety platform designed to help individuals, families, and communities prepare for, navigate, and recover from severe weather and monsoon hazards. 

This project aligns with the **Disaster Preparedness & Climate Adaptation** challenge vertical, delivering personalized weather-aware plans, real-time checklist progress tracking, route-risk travel advisories, and a multilingual safety assistant.

---

## 🛠️ Technology Stack

* **Backend**: Python 3.14, FastAPI, Pydantic v2, HTTPX, Uvicorn, **google-genai SDK** (Model: **`gemini-3.5-flash`**)
* **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Lucide React, **react-markdown**
* **APIs**: Open-Meteo Geocoding & Forecast APIs, **wttr.in API** (Failover Backup Weather Provider), Google Gemini API

---

## 🚀 Key Features

1. **Weather-Aware Dashboard**: Fetches real-time localized weather metrics and 7-day forecasts. Shows a green-pulsing badge confirming verified API data.
2. **Personalized Preparedness Plans**: Processes household parameters (size, pets, vulnerable members, home flood history) and outputs custom safety guidelines.
3. **Interactive Emergency Checklist**: Packs survival items by category (Food & Water, Medical, Lighting) and tracks packing progress in real time. Can be downloaded as a text file.
4. **Travel Risk Advisor**: Compares travel route metrics (origin to destination) and rates hazard levels (None, Low, Moderate, Severe) for different transport modes.
5. **Multilingual AI Safety Copilot**: Interactive safety chat assistant supporting English and Hindi with native Markdown parsing (bold highlights, indent lists, etc.).
6. **Persistent Consolidated Header**: Stabilized top navigation that remains fixed (`sticky top-0 z-50`), resolving scrolling screen jumps and ensuring navigation is always accessible.

---

## 🧠 GenAI Architecture & Mitigations

Safety-critical applications require strict boundaries around AI capabilities. JalDrishti implements several patterns to optimize LLM performance and reliability:

### 1. Hallucination Mitigation (Contextual RAG)
Rather than asking Gemini to speculate on local weather or routes, the backend fetches real-time meteorological forecast data first. This verified JSON payload is serialized into a textual summary and injected into the Gemini prompts as strict, grounded context.

### 2. Structured API Outputs
The platform mandates structure. Every GenAI response (plans, checklists, travel reports, chat responses) is bound to strict Pydantic schemas using the Gemini SDK's `response_schema` configuration. This forces the model to return JSON conforming precisely to expected frontend TypeScript interfaces.

### 3. Self-Healing Failover Backup
Outbound REST calls from cloud containers (like Render's Free tier) are frequently rate-limited by public firewalls (`429 Too Many Requests`). If Open-Meteo rate-limits or fails, the backend automatically detects it and routes queries to the **`wttr.in`** JSON API. It maps the fallback response to our unified schema seamlessly, guaranteeing 100% uptime.

### 4. Zero-Mock Policy
In compliance with the hackathon rules, all mock fallback responses have been removed. Every API query triggers actual end-to-end network requests. If the API key is missing or invalid, the backend propagates the exact error message to the frontend, which displays a red alert banner.

---

## 📝 Assumptions Made

1. **API Credentials**: The user or deploying host possesses a valid Google Gemini API key authorized to access the `gemini-3.5-flash` model.
2. **Internet Connection**: The platform requires active outgoing internet access to query the weather forecast APIs and Google Gemini endpoints.
3. **Geographic Focus**: Travel routing checks and main city parameters are currently locked to major Indian cities (Mumbai, Delhi, Kolkata, Chennai, Bengaluru, Kochi, Guwahati, Hyderabad, Pune) to focus safety guidelines on monsoon-prone areas.

---

## 💻 Local Setup & Execution

### Option A: Running with Docker Compose (Recommended)
Launch both tiers with a single command:
1. Ensure Docker Desktop is installed.
2. At the root of the project, create a `.env` file containing your key:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
3. Build and launch:
   ```bash
   docker compose up --build
   ```
4. Access the Frontend Dashboard at [http://localhost:3000](http://localhost:3000).

### Option B: Running Locally (Manual Setup)

#### 1. Start Backend (FastAPI)
1. Navigate to `/backend`:
   ```bash
   cd backend
   ```
2. Create virtual environment and install packages:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```
3. Set your environment variable `GEMINI_API_KEY` (inside `.env` or exported in shell).
4. Run the server:
   ```bash
   PYTHONPATH=. venv/bin/python app/main.py
   ```
   (API will run on [http://localhost:8000](http://localhost:8000), Swagger docs at `/docs`).

#### 2. Run Backend Tests
With virtual env active in the `/backend` folder, run:
```bash
PYTHONPATH=. venv/bin/pytest -v
```

#### 3. Start Frontend (Next.js)
1. Navigate to `/frontend`:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Build and start development server:
   ```bash
   npm run dev
   ```
   (Dashboard will run on [http://localhost:3000](http://localhost:3000)).
