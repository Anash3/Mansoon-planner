# JalDrishti: Monsoon Preparedness & Citizen Assistance Hub

**JalDrishti** (meaning *Water Vision* or *Foresight*) is a Generative AI-powered safety platform designed to help individuals, families, and communities prepare for, navigate, and recover from severe weather and monsoon hazards.

The project features a **FastAPI backend** leveraging the **Google Gemini SDK** and **Next.js frontend** styled with **Tailwind CSS**, **Framer Motion**, and **Lucide React**.

---

## 🚀 Key Features

1. **Weather-Aware dashboard**: Fetches real-time localized weather metrics and 7-day meteorological forecasts from the free Open-Meteo API.
2. **Personalized Preparedness Plans**: Takes household parameters (size, pets, vulnerable members, home flood history) and outputs custom safety guidelines.
3. **Interactive Emergency Checklist**: Packs survival items by category (e.g., Food & Water, Medical, Lighting) and tracks packing progress in real time. Can be printed or downloaded as a `.txt` file.
4. **Travel Risk Advisor**: Compares travel route metrics (origin to destination) and rates hazard levels (None, Low, Moderate, Severe) for different transport modes.
5. **Multilingual AI Safety Copilot**: Interactive safety chat assistant supporting English and Hindi.
6. **Dockerized Environment**: Ready for local orchestration or cloud container deployments with Docker and Docker Compose.

---

## 🛠️ Technology Stack

*   **Backend**: Python, FastAPI, Pydantic, HTTPX, Uvicorn, Google Generative AI (Gemini SDK)
*   **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion, Lucide React
*   **APIs**: Open-Meteo Geocoding & Forecast APIs (Free, no token required), Google Gemini 1.5 Flash API

---

## 🧠 GenAI Architecture & Mitigations

Safety-critical applications require strict boundaries around AI capabilities. JalDrishti implements several patterns to optimize LLM performance and reliability:

### 1. Hallucination Mitigation (Contextual RAG)
Rather than asking Gemini to speculate on local weather or routes, the backend fetches real-time meteorological forecast data and geocodes locations first. This verified JSON payload is serialized into a textual summary and injected into the Gemini prompts as strict context. 

### 2. Structured API Outputs
The platform mandates structure. Every GenAI response (plans, checklists, travel reports, chat responses) is bound to strict Pydantic schemas using the Gemini SDK's `response_schema` config. This forces the model to return JSON conforming precisely to expected frontend TypeScript interfaces.

### 3. Key-Free Mock Fallback Mode
If no `GEMINI_API_KEY` is detected in the environment (or if API credits are exhausted), the server does not crash. Instead, the backend automatically falls back to generating high-fidelity mock reports and alerts based on the requested parameters. This ensures the app is 100% testable and reviewable under any condition.

---

## 💻 Local Setup & Execution

### Option A: Running with Docker Compose (Recommended)
Launch both tiers with a single command:
1. Ensure Docker Desktop is installed.
2. At the root of the project, create a `.env` file (or set the environment variable):
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key_here
   ```
3. Build and launch:
   ```bash
   docker compose up --build
   ```
4. Access:
   * **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
   * **FastAPI Backend Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

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
3. Set environment variable `GEMINI_API_KEY` (Optional, defaults to mock-mode if unset).
4. Run the server:
   ```bash
   python3 app/main.py
   ```
   (API will run on [http://localhost:8000](http://localhost:8000)).

#### 2. Run Backend Tests
With virtual env active in the `/backend` folder:
```bash
PYTHONPATH=. pytest
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
