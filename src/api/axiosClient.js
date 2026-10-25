import axios from "axios";

export const TOKEN_STORAGE_KEY = "kb_token";
export const USER_STORAGE_KEY = "kb_user";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://localhost:7084/api",
  headers: {
    "Content-Type": "application/json"
  }
});

// Every endpoint except /Auth/login and /Auth/register is [Authorize]-protected,
// so attach the stored JWT to each outgoing request.
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Used when the API answers 401 (missing/expired token) - the user has to sign in again.
export function clearSession() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

export default axiosClient;

