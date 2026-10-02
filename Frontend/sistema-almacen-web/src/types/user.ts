export type UserRole =
  | "ADMIN"
  | "ADMINISTRADOR"
  | "SUPERVISOR"
  | "MATERIALISTA"
  | "PRODUCCION"
  | "SURTIDOR";

export interface User {
  idUsuario: number;
  nombre: string;
  nombreUsuario: string;
  idRol: number;
  nombreRol: string;
  activo: boolean;
  fechaRegistro?: string;
}

export interface CrearUsuarioRequest {
  nombre: string;
  nombreUsuario: string;
  password: string;
  idRol: number;
}

export interface ActualizarUsuarioRequest {
  nombre: string;
  nombreUsuario: string;
  idRol: number;
  activo: boolean;
}