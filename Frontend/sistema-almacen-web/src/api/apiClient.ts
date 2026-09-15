import axios from "axios";

const TOKEN_KEY = "swa_token";

// Cliente central para comunicarse con ASP.NET Core.
export const apiClient = axios.create({
  baseURL: "http://localhost:5042/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Agrega automáticamente el JWT a cada petición.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
