const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8080";

export const apiFetch = (path, options = {}) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const token = localStorage.getItem("token");

  const headers = {
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${normalizedPath}`, { ...options, headers });
};

