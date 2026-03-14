import axios from "axios";

const TOKEN_KEY = "luminor_vupix_token";

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setStoredToken(token) {
  if (!token) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, String(token));
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api",
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function extractApiError(error, fallback = "Ocorreu um erro inesperado.") {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}
