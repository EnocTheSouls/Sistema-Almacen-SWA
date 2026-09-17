import { apiClient } from "../api/apiClient";
import type { LoginRequest, LoginResponse } from "../types/auth";

const TOKEN_KEY = "swa_token";

// Envía las credenciales al backend.
export async function iniciarSesion(
  datos: LoginRequest,
): Promise<LoginResponse> {
  const respuesta = await apiClient.post<LoginResponse>(
    "/auth/login",
    datos,
  );

  return respuesta.data;
}

// Guarda el JWT en el navegador.
export function guardarToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// Recupera el JWT almacenado.
export function obtenerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

// Elimina la sesión del navegador.
export function cerrarSesion(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function estaAutenticado(): boolean {
  const token = obtenerToken();

  if (!token) {
    return false;
  }

  try {
    const partes = token.split(".");

    if (partes.length !== 3) {
      cerrarSesion();
      return false;
    }

    const payloadTexto =
      partes[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    const payload = JSON.parse(
      window.atob(payloadTexto)
    ) as {
      exp?: number;
    };

    if (!payload.exp) {
      cerrarSesion();
      return false;
    }

    const fechaExpiracion =
      payload.exp * 1000;

    const tokenVigente =
      fechaExpiracion > Date.now();

    if (!tokenVigente) {
      cerrarSesion();
      return false;
    }

    return true;
  } catch (error) {
    console.error(
      "El token guardado no es válido:",
      error
    );

    cerrarSesion();
    return false;
  }
}