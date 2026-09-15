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

// Indica si existe un token guardado.
export function estaAutenticado(): boolean {
  return obtenerToken() !== null;
}