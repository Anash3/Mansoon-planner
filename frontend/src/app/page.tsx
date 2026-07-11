"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  CloudRain, 
  ShieldAlert, 
  CheckSquare, 
  Compass, 
  MessageSquare, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Printer, 
  Download, 
  Sparkles, 
  Languages, 
  PhoneCall, 
  ChevronRight,
  Send,
  Loader2,
  Navigation,
  Check,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  fetchWeather, 
  generatePlan, 
  fetchTravelAdvisory, 
  sendChatMessage,
  WeatherData,
  TravelAdvisoryData,
  PlanGenerationResponse
} from "../lib/api";

const MONSOON_CITIES = [
  { name: "Mumbai", label: "Mumbai, India" },
  { name: "Delhi", label: "Delhi, India" },
  { name: "Kolkata", label: "Kolkata, India" },
  { name: "Chennai", label: "Chennai, India" },
  { name: "Bengaluru", label: "Bengaluru, India" },
  { name: "Kochi", label: "Kochi, India" },
  { name: "Guwahati", label: "Guwahati, India" },
  { name: "Miami", label: "Miami, USA" },
  { name: "Tokyo", label: "Tokyo, Japan" },
  { name: "London", label: "London, UK" },
];

export default function Home() {
  // Global & Language Settings
  const [language, setLanguage] = useState<string>("en");
  const [activeTab, setActiveTab] = useState<"dashboard" | "plan" | "travel" | "chat">("dashboard");

  // Location / Weather State
  const [city, setCity] = useState<string>("Mumbai");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string>("");

  // Plan Generator State
  const [householdSize, setHouseholdSize] = useState<number>(3);
  const [hasPets, setHasPets] = useState<boolean>(false);
  const [hasElderlyOrInfants, setHasElderlyOrInfants] = useState<boolean>(false);
  const [floodHistory, setFloodHistory] = useState<boolean>(false);
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);
  const [planResponse, setPlanResponse] = useState<PlanGenerationResponse | null>(null);
  const [planError, setPlanError] = useState<string>("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // Travel Advisor State
  const [origin, setOrigin] = useState<string>("Mumbai");
  const [destination, setDestination] = useState<string>("Delhi");
  const [transportMode, setTransportMode] = useState<string>("Car");
  const [analyzingTravel, setAnalyzingTravel] = useState<boolean>(false);
  const [travelAdvisory, setTravelAdvisory] = useState<TravelAdvisoryData | null>(null);
  const [travelError, setTravelError] = useState<string>("");

  // Chat Copilot State
  const [chatInput, setChatInput] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: string; content: string }>>([
    {
      role: "model",
      content: "Hello! I am your AI Monsoon Safety Copilot. Ask me anything about emergency kits, storm safety, or household plans in your language."
    }
  ]);
  const [sendingChat, setSendingChat] = useState<boolean>(false);
  const [chatError, setChatError] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- Handlers ---
  
  const handleSearchWeather = async (targetCity?: string) => {
    const activeCity = targetCity || city;
    if (!activeCity.trim()) return;
    setLoadingWeather(true);
    setWeatherError("");
    try {
      const data = await fetchWeather(activeCity);
      setWeatherData(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setWeatherError(errorMsg);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    setPlanError("");
    try {
      const data = await generatePlan(city, householdSize, hasPets, hasElderlyOrInfants, floodHistory, language);
      setPlanResponse(data);
      // Reset checked items when new checklist is generated
      setCheckedItems({});
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setPlanError(errorMsg);
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleAnalyzeTravel = async () => {
    if (!origin.trim() || !destination.trim()) return;
    setAnalyzingTravel(true);
    setTravelError("");
    try {
      const data = await fetchTravelAdvisory(origin, destination, transportMode, language);
      setTravelAdvisory(data);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setTravelError(errorMsg);
    } finally {
      setAnalyzingTravel(false);
    }
  };

  const handleSendChat = async (messageText?: string) => {
    const textToSend = messageText || chatInput;
    if (!textToSend.trim()) return;

    const userMessage = { role: "user", content: textToSend };
    setChatHistory(prev => [...prev, userMessage]);
    if (!messageText) setChatInput("");
    setSendingChat(true);
    setChatError("");

    try {
      // Send chat history without the final system welcome if we want clean context
      const apiResponse = await sendChatMessage(textToSend, chatHistory, city, language);
      setChatHistory(prev => [...prev, { role: "model", content: apiResponse.reply }]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setChatError(errorMsg);
    } finally {
      setSendingChat(false);
    }
  };

  // Toggle checklist check state
  const toggleCheck = (itemName: string) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  // Calculate completion percentage of checklist
  const getChecklistStats = () => {
    if (!planResponse?.checklist) return { total: 0, checked: 0, percentage: 0 };
    let total = 0;
    let checked = 0;
    planResponse.checklist.categories.forEach(cat => {
      cat.items.forEach(item => {
        total++;
        if (checkedItems[item.name]) {
          checked++;
        }
      });
    });
    return {
      total,
      checked,
      percentage: total > 0 ? Math.round((checked / total) * 100) : 0
    };
  };

  // Text representation for Download
  const downloadPlanAsText = () => {
    if (!planResponse) return;
    const { plan, checklist } = planResponse;
    let content = `==================================================\n`;
    content += `JALDRISHTI MONSOON PREPAREDNESS PLAN FOR: ${city.toUpperCase()}\n`;
    content += `Language: ${language.toUpperCase()} | Risk Level: ${plan.risk_level}\n`;
    content += `==================================================\n\n`;
    
    content += `--- OVERVIEW ---\n${plan.overview}\n\n`;
    
    content += `--- IMMEDIATE ACTIONS (NEXT 1-2 HOURS) ---\n`;
    plan.immediate_actions.forEach((act, idx) => { content += `${idx+1}. [ ] ${act}\n`; });
    content += `\n`;
    
    content += `--- FAMILY SAFETY STEPS ---\n`;
    plan.family_safety_steps.forEach((act, idx) => { content += `${idx+1}. [ ] ${act}\n`; });
    content += `\n`;
    
    content += `--- HOME REINFORCEMENTS ---\n`;
    plan.home_reinforcements.forEach((act, idx) => { content += `${idx+1}. [ ] ${act}\n`; });
    content += `\n`;
    
    content += `--- EMERGENCY CONTACTS ---\n`;
    plan.emergency_contacts.forEach(c => { content += `- ${c.name}: ${c.contact_info}\n`; });
    content += `\n`;

    content += `--- EMERGENCY SURVIVAL CHECKLIST: ${checklist.title} ---\n`;
    checklist.categories.forEach(cat => {
      content += `\n[ ${cat.category.toUpperCase()} ]\n`;
      cat.items.forEach(item => {
        content += `- [${checkedItems[item.name] ? 'X' : ' '}] ${item.name} (${item.critical ? 'CRITICAL' : 'OPTIONAL'}) - ${item.description}\n`;
      });
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `JalDrishti_Preparedness_Plan_${city}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Map Open-Meteo Weather Codes to English Text
  const getWeatherCodeDescription = (code: number) => {
    if (code === 0) return { text: "Clear Sky", color: "text-sky-400" };
    if (code >= 1 && code <= 3) return { text: "Partly Cloudy", color: "text-slate-300" };
    if (code >= 45 && code <= 48) return { text: "Foggy Conditions", color: "text-zinc-400" };
    if (code >= 51 && code <= 55) return { text: "Light Drizzle", color: "text-teal-400" };
    if (code >= 61 && code <= 65) return { text: "Monsoon Rain", color: "text-blue-400 font-semibold" };
    if (code >= 80 && code <= 82) return { text: "Heavy Showers", color: "text-indigo-400 font-bold alert-pulse-red" };
    if (code >= 95 && code <= 99) return { text: "Severe Thunderstorm", color: "text-amber-400 font-extrabold" };
    return { text: "Overcast", color: "text-slate-300" };
  };

  // --- Effects ---

  // Load weather on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchWeather();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  return (
    <div className="flex-1 flex flex-col bg-[#090d16] text-[#f1f5f9] min-h-screen relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-teal-900/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main App Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-t-0 border-x-0 rounded-none bg-[#090d16]/90 backdrop-blur-lg px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800">
        {/* Logo and Subtitle */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="bg-gradient-to-tr from-sky-500 to-teal-500 p-2 rounded-lg shadow-lg">
            <CloudRain className="w-5 h-5 text-[#090d16]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">
              JalDrishti
            </h1>
            <p className="text-[9px] text-slate-400 tracking-widest uppercase">Monsoon Safety & GenAI</p>
          </div>
        </div>

        {/* Tab Links - Centered */}
        <nav className="flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "dashboard" 
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("plan")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "plan" 
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            Planner
          </button>
          <button
            onClick={() => setActiveTab("travel")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "travel" 
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Travel Risk
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === "chat" 
                ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                : "text-slate-400 hover:text-slate-200 border border-transparent"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            AI Copilot
          </button>
        </nav>

        {/* Dropdown City and Language Selectors */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="relative w-40 md:w-48">
            {loadingWeather ? (
              <Loader2 className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-sky-400 animate-spin" />
            ) : (
              <MapPin className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-sky-400" />
            )}
            <select
              value={city}
              onChange={(e) => {
                const selectedCity = e.target.value;
                setCity(selectedCity);
                handleSearchWeather(selectedCity);
              }}
              className="glass-input pl-8 pr-8 py-1.5 text-xs w-full bg-slate-900 border border-slate-800 text-slate-200 appearance-none rounded-lg cursor-pointer focus:border-sky-400 transition-all"
            >
              {MONSOON_CITIES.map((c) => (
                <option key={c.name} value={c.name} className="bg-slate-950 text-slate-200">
                  {c.label}
                </option>
              ))}
            </select>
            <div className="absolute right-2.5 top-3 pointer-events-none w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[3.5px] border-t-slate-400" />
          </div>

          <button 
            onClick={() => setLanguage(l => l === "en" ? "hi" : "en")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-700 text-xs font-semibold text-sky-400 transition-all"
          >
            <Languages className="w-3 h-3" />
            <span>{language === "en" ? "EN" : "हिन्दी"}</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        <AnimatePresence mode="wait">
          {/* --- TAB 1: DASHBOARD --- */}
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Col 1 & 2: Weather Info and Advisories */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Weather Error Banner */}
                {weatherError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-sm">{weatherError}</span>
                  </div>
                )}

                {/* Weather Summary Card */}
                {weatherData ? (
                  <div className="glass-panel p-6 relative overflow-hidden">
                    {/* Glowing Accent */}
                    <div className="absolute right-0 top-0 w-24 h-24 bg-sky-500/10 rounded-full blur-xl" />

                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div>
                        <h2 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                          {weatherData.location.name}
                          <span className="inline-flex items-center gap-1.5 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 alert-pulse-green">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Verified Tool: Open-Meteo API
                          </span>
                        </h2>
                        <p className="text-sm text-slate-400">{weatherData.location.admin1}, {weatherData.location.country}</p>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                        Lat: {weatherData.location.latitude}° N, Lon: {weatherData.location.longitude}° E
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 border-t border-slate-800 pt-6">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                          <CloudRain className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Temperature</p>
                          <p className="text-2xl font-black">{weatherData.weather.current.temperature_2m}°C</p>
                          <p className="text-[10px] text-slate-400">Feels like {weatherData.weather.current.apparent_temperature}°C</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl">
                          <CloudRain className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Rain</p>
                          <p className="text-2xl font-black">{weatherData.weather.current.precipitation} mm</p>
                          <p className="text-[10px] text-slate-400">Wind: {weatherData.weather.current.wind_speed_10m} km/h</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className={`p-3 bg-slate-800 rounded-xl`}>
                          <Sparkles className="w-8 h-8 text-sky-400" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">General Status</p>
                          <p className={`text-lg font-bold ${getWeatherCodeDescription(weatherData.weather.current.weather_code).color}`}>
                            {getWeatherCodeDescription(weatherData.weather.current.weather_code).text}
                          </p>
                          <p className="text-[10px] text-slate-400">Code: {weatherData.weather.current.weather_code}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel p-12 text-center flex flex-col items-center justify-center text-slate-400">
                    <CloudRain className="w-12 h-12 text-slate-600 mb-3 animate-bounce" />
                    <p className="text-sm">Search and configure your location above to load weather context.</p>
                  </div>
                )}

                {/* 7-Day Forecast */}
                {weatherData && (
                  <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                      <Compass className="w-5 h-5 text-sky-400" />
                      7-Day Forecast & Monsoon Trends
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4">
                      {weatherData.weather.daily.temperature_2m_max.map((maxTemp, idx) => {
                        const minTemp = weatherData.weather.daily.temperature_2m_min[idx];
                        const rain = weatherData.weather.daily.precipitation_sum[idx];
                        const prob = weatherData.weather.daily.precipitation_probability_max[idx];
                        const code = weatherData.weather.daily.weather_code[idx];
                        const dayName = weatherData.weather.daily.time[idx]
                          ? new Date(weatherData.weather.daily.time[idx]).toLocaleDateString(undefined, { weekday: "short" })
                          : "";

                        return (
                          <div key={idx} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex flex-col items-center justify-between text-center gap-1.5">
                            <span className="text-xs text-slate-400 font-semibold">{dayName}</span>
                            <span className={`text-sm ${getWeatherCodeDescription(code).color}`}>
                              ●
                            </span>
                            <div className="text-xs font-bold">
                              <span>{Math.round(maxTemp)}°</span>
                              <span className="text-slate-500 font-normal ml-1">{Math.round(minTemp)}°</span>
                            </div>
                            <div className="w-full mt-1 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex flex-col">
                              <span className="text-sky-400 font-semibold">{prob}% Rain</span>
                              <span>{rain}mm</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Localized Advisories */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-emerald-400" />
                    Weather-Aware Guidance Highlights
                  </h3>
                  
                  {weatherData ? (
                    <div className="flex flex-col gap-4">
                      {weatherData.weather.current.precipitation > 5 || weatherData.weather.daily.precipitation_sum[0] > 20 ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 rounded-xl p-4 flex gap-3 alert-pulse-red">
                          <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm">Heavy Rainfall Active or Forecasted</h4>
                            <p className="text-xs text-amber-200/80 mt-1">
                              Rainfall levels are elevated. Expect low visibility on roads, possible local waterlogging in low-lying zones, and storm drains operating at maximum capacity.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 rounded-xl p-4 flex gap-3">
                          <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                          <div>
                            <h4 className="font-bold text-sm">Normal Rain Conditions</h4>
                            <p className="text-xs text-emerald-200/80 mt-1">
                              Current precipitation levels are standard. It is still recommended to review and construct your customized emergency preparedness plans.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                          <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">Household Priority</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Clear nearby storm gutters, secure loose objects on patios/balconies, and test critical backup power devices. Keep basic emergency survival gear stored at arm&apos;s reach.
                          </p>
                        </div>
                        <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800">
                          <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">Community Advice</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Stay updated on local municipal disaster warnings. Do not wade or swim through flooded underpasses or touch public electrical installations during heavy downpours.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Search for weather above to see safety analysis.</p>
                  )}
                </div>

              </div>

              {/* Col 3: Side Panel with Fast Actions */}
              <div className="flex flex-col gap-6">
                
                {/* Citizen Quick Helplines */}
                <div className="glass-panel p-6">
                  <h3 className="text-lg font-bold tracking-tight mb-4 flex items-center gap-2">
                    <PhoneCall className="w-5 h-5 text-teal-400" />
                    Emergency Contact Directory
                  </h3>
                  <div className="flex flex-col gap-3">
                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">National Emergency Services</p>
                        <p className="font-bold text-sm">Police, Fire & Ambulance</p>
                      </div>
                      <span className="text-sky-400 font-bold bg-sky-950/40 border border-sky-800/60 px-3 py-1 rounded-lg text-sm">112</span>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Disaster Mgmt Response</p>
                        <p className="font-bold text-sm">NDMA Helpline</p>
                      </div>
                      <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-lg text-sm">1078</span>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-800/80 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Municipal Waterlogging Desk</p>
                        <p className="font-bold text-sm">Local Flood Control</p>
                      </div>
                      <span className="text-amber-400 font-bold bg-amber-950/40 border border-amber-800/60 px-3 py-1 rounded-lg text-sm">1070</span>
                    </div>

                    <p className="text-[10px] text-slate-500 text-center leading-relaxed mt-2">
                      *Generate a personalized preparedness plan to retrieve direct emergency contacts tailored to your city.
                    </p>
                  </div>
                </div>

                {/* Quick Chat Assistant Mini Widget */}
                <div className="glass-panel p-6 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-sky-400" />
                      AI Safety Assistant
                    </h3>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Have questions about floods, lightning safety, power failures, or road water depths? Ask our Copilot.
                  </p>
                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-slate-700 cursor-pointer transition-all" onClick={() => { setActiveTab("chat"); handleSendChat("What are the key safety steps during a severe flood?"); }}>
                    <p className="text-xs text-sky-400 font-bold flex items-center justify-between">
                      <span>Flooding Safety</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">&quot;What are the key safety steps during a severe flood?&quot;</p>
                  </div>

                  <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 hover:border-slate-700 cursor-pointer transition-all" onClick={() => { setActiveTab("chat"); handleSendChat("Is it safe to use electronic equipment during severe lightning?"); }}>
                    <p className="text-xs text-sky-400 font-bold flex items-center justify-between">
                      <span>Lightning Hazard</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">&quot;Is it safe to use electronic equipment during severe lightning?&quot;</p>
                  </div>

                  <button
                    onClick={() => setActiveTab("chat")}
                    className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 text-[#090d16] font-bold text-xs py-2.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all shadow-md shadow-sky-500/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Open Safety Chat
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* --- TAB 2: PREPAREDNESS PLANNER --- */}
          {activeTab === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Plan Setup Questionnaire Form */}
              <div className="glass-panel p-6 flex flex-col gap-6 self-start">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Personalize Your Plan</h3>
                  <p className="text-xs text-slate-400 mt-1">Configure your household parameters to tailor your safety alerts & checklists.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Household Size */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Household Size</label>
                    <input 
                      type="number"
                      min={1}
                      max={15}
                      value={householdSize}
                      onChange={(e) => setHouseholdSize(Math.max(1, parseInt(e.target.value) || 1))}
                      className="glass-input text-sm"
                    />
                    <span className="text-[10px] text-slate-500">Tailors water and ration calculations.</span>
                  </div>

                  {/* Has Pets Toggle */}
                  <label className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Do you have pets?</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Adds pet carrier, food, leash, and care guidelines.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={hasPets}
                      onChange={(e) => setHasPets(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 bg-[#090d16] text-sky-400 focus:ring-sky-400/20"
                    />
                  </label>

                  {/* Has Vulnerable Members */}
                  <label className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Elderly or Infants?</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Includes pediatric, chronic meds, and accessibility prep.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={hasElderlyOrInfants}
                      onChange={(e) => setHasElderlyOrInfants(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 bg-[#090d16] text-sky-400 focus:ring-sky-400/20"
                    />
                  </label>

                  {/* Flood History */}
                  <label className="flex items-center justify-between p-3 bg-slate-900/40 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-all">
                    <div>
                      <p className="text-xs font-semibold text-slate-300">Past Flooding at Home?</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Customizes drainage checks and height elevation advice.</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={floodHistory}
                      onChange={(e) => setFloodHistory(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-800 bg-[#090d16] text-sky-400 focus:ring-sky-400/20"
                    />
                  </label>

                  {/* Generate Button */}
                  <button
                    onClick={handleGeneratePlan}
                    disabled={generatingPlan}
                    className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 disabled:opacity-60 disabled:pointer-events-none text-[#090d16] font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 active:scale-98 transition-all"
                  >
                    {generatingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Safety Matrix...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Custom Plan
                      </>
                    )}
                  </button>

                  {planError && (
                    <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">{planError}</p>
                  )}
                </div>
              </div>

              {/* Generated Plan & Checklist View */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {planResponse ? (
                  <>
                    {/* Action Bar */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold tracking-tight text-slate-200">
                        Safety Advisory & Preparedness Protocol for <span className="text-sky-400">{planResponse.city}</span>
                      </h3>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={downloadPlanAsText}
                          className="bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Download Text File"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Download
                        </button>
                        <button 
                          onClick={() => window.print()}
                          className="bg-slate-800/80 hover:bg-slate-700/80 active:scale-95 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                          title="Print Plan"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Print
                        </button>
                      </div>
                    </div>

                    {/* Preparedness Plan Detail Blocks */}
                    <div className="glass-panel p-6 flex flex-col gap-6">
                      
                      {/* Overview Block */}
                      <div className="relative">
                        <span className={`absolute right-0 top-0 text-xs font-extrabold px-3 py-1 rounded-full border ${
                          planResponse.plan.risk_level.toLowerCase() === 'critical' || planResponse.plan.risk_level.toLowerCase() === 'high'
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 alert-pulse-red'
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        }`}>
                          Risk: {planResponse.plan.risk_level}
                        </span>
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-2">Household Risk Overview</h4>
                        <p className="text-sm text-slate-300 leading-relaxed max-w-[85%]">{planResponse.plan.overview}</p>
                      </div>

                      {/* Immediate Actions */}
                      <div className="border-t border-slate-800/80 pt-6">
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-500" />
                          Immediate Emergency Steps (Next 1-2 Hours)
                        </h4>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {planResponse.plan.immediate_actions.map((act, i) => (
                            <li key={i} className="bg-slate-900/60 rounded-xl p-3 border border-slate-800/80 text-xs leading-relaxed flex gap-2.5 items-start">
                              <span className="text-sky-400 font-bold bg-sky-950/30 px-2 py-0.5 rounded text-[10px]">{i+1}</span>
                              <span className="text-slate-300">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Family Safety */}
                      <div className="border-t border-slate-800/80 pt-6">
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Family & Vulnerable Group Protection
                        </h4>
                        <ul className="flex flex-col gap-2.5">
                          {planResponse.plan.family_safety_steps.map((act, i) => (
                            <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2 items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Home Reinforcements */}
                      <div className="border-t border-slate-800/80 pt-6">
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <Compass className="w-4 h-4 text-teal-400" />
                          Home & Drainage Reinforcements
                        </h4>
                        <ul className="flex flex-col gap-2.5">
                          {planResponse.plan.home_reinforcements.map((act, i) => (
                            <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2 items-start">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0" />
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Local Contacts */}
                      <div className="border-t border-slate-800/80 pt-6">
                        <h4 className="font-bold text-sm text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                          <PhoneCall className="w-4 h-4 text-sky-400" />
                          City Emergency Helplines
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {planResponse.plan.emergency_contacts.map((contact, i) => (
                            <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex justify-between items-center">
                              <div>
                                <p className="text-xs font-semibold text-slate-200">{contact.name}</p>
                                <p className="text-[10px] text-slate-500">Emergency support channel</p>
                              </div>
                              <span className="text-xs font-bold text-sky-400 bg-sky-950/40 border border-sky-800/40 px-2.5 py-1 rounded-lg">
                                {contact.contact_info}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Interactive Emergency Checklist Block */}
                    <div className="glass-panel p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                          <h4 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-sky-400" />
                            {planResponse.checklist.title}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">Toggle items as you package and prepare them. Pack critical items first.</p>
                        </div>
                        {/* Progress Gauge */}
                        <div className="flex items-center gap-3">
                          <div className="w-32 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-sky-400 to-teal-400 h-full rounded-full transition-all duration-300"
                              style={{ width: `${getChecklistStats().percentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-300 flex-shrink-0">
                            {getChecklistStats().checked} / {getChecklistStats().total} ({getChecklistStats().percentage}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-6">
                        {planResponse.checklist.categories.map((cat, i) => (
                          <div key={i} className="bg-slate-900/40 rounded-xl border border-slate-800/80 p-4">
                            <h5 className="font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2 mb-3">
                              {cat.category}
                            </h5>
                            <div className="flex flex-col gap-3">
                              {cat.items.map((item, idx) => (
                                <div 
                                  key={idx}
                                  onClick={() => toggleCheck(item.name)}
                                  className={`flex items-start justify-between p-3 rounded-lg border transition-all cursor-pointer ${
                                    checkedItems[item.name]
                                      ? 'bg-slate-950/40 border-emerald-500/20 text-slate-500'
                                      : 'bg-slate-900/50 border-slate-800/60 text-slate-200 hover:border-slate-700'
                                  }`}
                                >
                                  <div className="flex gap-3 items-start max-w-[85%]">
                                    <div className={`w-4 h-4 rounded border mt-0.5 flex items-center justify-center flex-shrink-0 transition-all ${
                                      checkedItems[item.name]
                                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                                        : 'bg-slate-950 border-slate-700'
                                    }`}>
                                      {checkedItems[item.name] && <Check className="w-3 h-3" />}
                                    </div>
                                    <div>
                                      <p className={`text-xs font-semibold ${checkedItems[item.name] ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                        {item.name}
                                      </p>
                                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                                        {item.description}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {item.critical && (
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                                      checkedItems[item.name]
                                        ? 'bg-slate-950 border border-slate-800 text-slate-600'
                                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    }`}>
                                      CRITICAL
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="glass-panel p-16 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                    <Sparkles className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-300">No Plan Generated Yet</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                      Enter your household parameters and click &quot;Generate Custom Plan&quot; on the left panel to build your weather-aware emergency guide.
                    </p>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* --- TAB 3: TRAVEL RISK ADVISOR --- */}
          {activeTab === "travel" && (
            <motion.div
              key="travel"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Route Input Panel */}
              <div className="glass-panel p-6 flex flex-col gap-5 self-start">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Travel Safety Checker</h3>
                  <p className="text-xs text-slate-400 mt-1">Determine potential monsoon travel hazards and safe alternative routes.</p>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Origin */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Departure Location</label>
                    <select 
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="glass-input text-sm bg-slate-900"
                    >
                      {MONSOON_CITIES.map((c) => (
                        <option key={c.name} value={c.name} className="bg-slate-950 text-slate-200">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Destination */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Arrival Destination</label>
                    <select 
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="glass-input text-sm bg-slate-900"
                    >
                      {MONSOON_CITIES.map((c) => (
                        <option key={c.name} value={c.name} className="bg-slate-950 text-slate-200">
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Transport Mode */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Transport Mode</label>
                    <select
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value)}
                      className="glass-input text-sm bg-slate-900"
                    >
                      <option value="Car">Car / Cab</option>
                      <option value="Two-wheeler">Two-Wheeler (Bike/Scooter)</option>
                      <option value="Public Transport">Public Transport (Bus/Local Train)</option>
                      <option value="Walking">Walking</option>
                    </select>
                  </div>

                  {/* Analyze Button */}
                  <button
                    onClick={handleAnalyzeTravel}
                    disabled={analyzingTravel}
                    className="w-full bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 disabled:opacity-60 disabled:pointer-events-none text-[#090d16] font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10 active:scale-98 transition-all"
                  >
                    {analyzingTravel ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Analyzing Route Safety...
                      </>
                    ) : (
                      <>
                        <Navigation className="w-4 h-4" />
                        Analyze Travel Risks
                      </>
                    )}
                  </button>

                  {travelError && (
                    <p className="text-xs text-red-400 text-center font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">{travelError}</p>
                  )}
                </div>
              </div>

              {/* Travel Advisory Report View */}
              <div className="lg:col-span-2">
                {travelAdvisory ? (
                  <div className="glass-panel p-6 flex flex-col gap-6">
                    
                    {/* Header Summary */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
                      <div>
                        <h4 className="font-bold text-base text-slate-200">
                          Route Risk Matrix: <span className="text-sky-400">{origin}</span> to <span className="text-sky-400">{destination}</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Configured Mode: {transportMode}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Safe to Travel Status */}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          travelAdvisory.safe_to_travel 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400 alert-pulse-red'
                        }`}>
                          {travelAdvisory.safe_to_travel ? "Travel Recommended" : "Avoid Travel"}
                        </span>
                        
                        {/* Hazard level badge */}
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          travelAdvisory.hazard_level.toLowerCase() === 'severe' 
                            ? 'bg-red-500/10 border-red-500/30 text-red-400 alert-pulse-red' 
                            : travelAdvisory.hazard_level.toLowerCase() === 'moderate' 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}>
                          Hazard: {travelAdvisory.hazard_level}
                        </span>
                      </div>
                    </div>

                    {/* Warnings List */}
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Monsoon Route Warnings
                      </h4>
                      <ul className="flex flex-col gap-2">
                        {travelAdvisory.warnings.map((warn, i) => (
                          <li key={i} className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 text-xs leading-relaxed text-red-200/90 flex gap-2 items-start">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                            <span>{warn}</span>
                          </li>
                        ))}
                        {travelAdvisory.warnings.length === 0 && (
                          <li className="text-xs text-slate-500 bg-slate-900/40 p-3 rounded-xl border border-slate-800 text-center">No active weather hazards reported on route.</li>
                        )}
                      </ul>
                    </div>

                    {/* Route Advice / Alternative route */}
                    <div className="border-t border-slate-800 pt-5">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                        <Compass className="w-4 h-4 text-teal-400" />
                        Route Safety & Transit Alternatives
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
                        {travelAdvisory.alternative_routes_advice}
                      </p>
                    </div>

                    {/* Recommended Precautions */}
                    <div className="border-t border-slate-800 pt-5">
                      <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-400" />
                        Pre-Travel Safety Precautions
                      </h4>
                      <ul className="flex flex-col gap-2.5">
                        {travelAdvisory.recommended_precautions.map((prec, i) => (
                          <li key={i} className="text-xs text-slate-300 leading-relaxed flex gap-2 items-start">
                            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
                            <span>{prec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                ) : (
                  <div className="glass-panel p-16 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                    <Compass className="w-12 h-12 text-slate-600 mb-3" />
                    <p className="font-semibold text-slate-300">Route Analysis Pending</p>
                    <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
                      Enter departure/arrival locations on the left panel and click &quot;Analyze Travel Risks&quot; to see AI-powered route advisories and safety guidance.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* --- TAB 4: SAFETY COPILOT CHAT --- */}
          {activeTab === "chat" && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Quick Prompts Panel */}
              <div className="glass-panel p-6 flex flex-col gap-5 lg:col-span-1 self-start">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Safety Quick Queries</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click any standard question to prompt the Safety Copilot instantly.</p>
                </div>
                
                <div className="flex flex-col gap-2.5">
                  <button 
                    onClick={() => handleSendChat("How many liters of drinking water should I store for 4 people during floods?")}
                    className="text-left bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 font-medium leading-relaxed transition-all"
                  >
                    &quot;How many liters of drinking water should I store for 4 people?&quot;
                  </button>

                  <button 
                    onClick={() => handleSendChat("What basic medicines should be kept in a monsoon emergency kit?")}
                    className="text-left bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 font-medium leading-relaxed transition-all"
                  >
                    &quot;What medicines should be kept in a monsoon emergency kit?&quot;
                  </button>

                  <button 
                    onClick={() => handleSendChat("What are key rules for electrical safety when water starts entering the house?")}
                    className="text-left bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 font-medium leading-relaxed transition-all"
                  >
                    &quot;What are electrical safety rules if water enters the house?&quot;
                  </button>

                  <button 
                    onClick={() => handleSendChat("What should I do if a family member is bitten by a snake or insect in floodwaters?")}
                    className="text-left bg-slate-900/50 border border-slate-800 hover:border-slate-700/80 rounded-xl p-3 text-xs text-slate-300 font-medium leading-relaxed transition-all"
                  >
                    &quot;How to handle insect/snake bites in floodwaters?&quot;
                  </button>
                  
                  {chatHistory.length > 1 && (
                    <button 
                      onClick={() => setChatHistory([
                        {
                          role: "model",
                          content: "Hello! I am your AI Monsoon Safety Copilot. Ask me anything about emergency kits, storm safety, or household plans in your language."
                        }
                      ])}
                      className="text-xs font-semibold py-2 mt-2 bg-slate-800/40 hover:bg-slate-800 border border-slate-700 text-slate-400 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset Conversation
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Console Panel */}
              <div className="glass-panel p-5 lg:col-span-3 flex flex-col h-[600px] justify-between relative overflow-hidden">
                {/* Glowing Copilot Head */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-sky-500/10 p-2 rounded-lg text-sky-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">24/7 AI Preparedness Assistant</p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Context aware ({city || "General"})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                    GenAI API Mode
                  </span>
                </div>

                {/* Chat History Area */}
                <div className="h-[420px] overflow-y-auto py-4 flex flex-col gap-4 my-2 px-1 scrollbar-thin">
                  {chatHistory.map((chat, idx) => (
                    <div 
                      key={idx} 
                      className={`flex gap-3 max-w-[85%] ${
                        chat.role === "user" ? "ml-auto flex-row-reverse" : ""
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        chat.role === "user" 
                          ? "bg-sky-950/60 border border-sky-800/40 text-sky-400" 
                          : "bg-teal-950/60 border border-teal-800/40 text-teal-400"
                      }`}>
                        {chat.role === "user" ? "U" : "AI"}
                      </div>

                      {/* Content block */}
                      <div className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        chat.role === "user"
                          ? "bg-sky-950/20 border-sky-500/10 text-sky-200"
                          : "bg-slate-900/60 border-slate-800/80 text-slate-200"
                      }`}>
                        {/* Format linebreaks for readable markdown-like representation */}
                        {chat.content.split("\n").map((line, lidx) => (
                          <p key={lidx} className={lidx > 0 ? "mt-1.5" : ""}>{line}</p>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Sending loader */}
                  {sendingChat && (
                    <div className="flex gap-3 max-w-[85%]">
                      <div className="w-8 h-8 rounded-lg bg-teal-950/60 border border-teal-800/40 text-teal-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                        AI
                      </div>
                      <div className="p-3.5 rounded-xl border bg-slate-900/60 border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-400" />
                        Analyzing safety protocols...
                      </div>
                    </div>
                  )}

                  {chatError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl p-3 text-xs leading-relaxed text-center font-medium">
                      {chatError}
                    </div>
                  )}

                  <div ref={chatBottomRef} />
                </div>

                {/* Input Area */}
                <div className="flex gap-2 border-t border-slate-800 pt-3 mt-auto">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                    placeholder="Ask standard monsoon guidelines or specific queries..."
                    className="glass-input flex-1 text-xs"
                    disabled={sendingChat}
                  />
                  <button 
                    onClick={() => handleSendChat()}
                    disabled={sendingChat}
                    className="bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-400 hover:to-teal-400 disabled:opacity-50 text-[#090d16] font-bold px-4 py-2 rounded-xl flex items-center justify-center transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer copyright */}
      <footer className="glass-panel border-b-0 border-x-0 rounded-none bg-[#070b13] px-6 py-6 text-center text-[10px] text-slate-500 tracking-wider">
        <p>© 2026 JALDRISHTI CITIZEN ASSISTANCE HUB. ALL RIGHTS RESERVED.</p>
        <p className="mt-1 uppercase">Powered by Google Gemini 1.5 Flash & Open-Meteo Weather APIs</p>
      </footer>
    </div>
  );
}
