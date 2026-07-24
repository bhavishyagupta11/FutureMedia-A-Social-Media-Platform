import axios from "axios";
import { clearUserSession } from "../utils/session";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token is invalid or expired
      clearUserSession();
      // Force reload to kick user back to login page safely
      if (window.location.pathname !== "/") {
        window.location.href = "/";
      }
    }
    return Promise.reject(error);
  }
);

export const apiFetch = async (path, options = {}) => {
  let normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (normalizedPath.startsWith("/api/") && !normalizedPath.startsWith("/api/v1/")) {
    normalizedPath = normalizedPath.replace("/api/", "/api/v1/");
  }

  let parsedData;
  if (options.body instanceof FormData) {
    parsedData = options.body;
  } else if (typeof options.body === "string") {
    try {
      parsedData = JSON.parse(options.body);
    } catch (e) {
      parsedData = options.body;
    }
  } else {
    parsedData = options.body;
  }
  
  try {
    const response = await api({
      url: normalizedPath,
      method: options.method || "GET",
      data: parsedData,
      headers: options.headers,
    });
    return {
      ok: true,
      json: async () => response.data,
    };
  } catch (error) {
    return {
      ok: false,
      status: error.response?.status,
      json: async () => {
        if (error.response && error.response.data) {
          if (typeof error.response.data === "string" && error.response.data.includes("<html")) {
            console.error("Received HTML instead of JSON. Masked as 500.", error.response.data);
            return { success: false, message: "Unexpected server response.", errors: null };
          }
          return error.response.data;
        }
        return { success: false, message: "Network or Server Error", errors: null };
      },
    };
  }
};

export default api;
