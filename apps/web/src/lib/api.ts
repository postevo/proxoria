import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

// Attach API key from localStorage (set after sign-in flow)
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const key = localStorage.getItem("ai_gateway_api_key");
    if (key) config.headers["Authorization"] = `Bearer ${key}`;
  }
  return config;
});
