import axios from "axios";

const TOKEN_KEY = "swa_token";

// Cliente central para comunicarse con ASP.NET Core.
export const apiClient = axios.create({
  baseURL: "http://localhost:5042/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Agrega automáticamente el JWT.
apiClient.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(TOKEN_KEY);

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  }
);

// Detecta una sesión rechazada por el backend.
apiClient.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error.response?.status;

    const urlPeticion =
      String(error.config?.url ?? "");

    const esPeticionLogin =
      urlPeticion.includes("/auth/login");

    const habiaToken =
      localStorage.getItem(TOKEN_KEY) !==
      null;

    if (
      status === 401 &&
      habiaToken &&
      !esPeticionLogin
    ) {
      localStorage.removeItem(TOKEN_KEY);

      if (
        window.location.pathname !==
        "/sesion-expirada"
      ) {
        window.location.replace(
          "/sesion-expirada"
        );
      }
    }

    return Promise.reject(error);
  }
);