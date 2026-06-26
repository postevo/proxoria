import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Module-level token getter — set by ClerkTokenProvider in client layouts
let _getToken: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _getToken = fn;
}

// Dashboard management API — authenticated with Clerk session JWT
export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    const token = await _getToken();
    if (token) config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});
