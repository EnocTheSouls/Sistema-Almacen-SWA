// Credenciales enviadas al backend.
export interface LoginRequest {
  nombreUsuario: string;
  password: string;
}

// Respuesta recibida después de iniciar sesión.
export interface LoginResponse {
  token: string;
}