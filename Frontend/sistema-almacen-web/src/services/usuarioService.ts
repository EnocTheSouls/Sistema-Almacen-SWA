import {
  apiClient,
} from "../api/apiClient";

import type {
  ActualizarUsuarioRequest,
  CrearUsuarioRequest,
  User,
} from "../types/user";

// Obtiene todos los usuarios.
export async function obtenerUsuarios(): Promise<User[]> {
  const respuesta =
    await apiClient.get<User[]>(
      "/usuarios"
    );

  return respuesta.data;
}

// Crea un usuario.
// El backend genera el hash de la contraseña.
export async function crearUsuario(
  datos: CrearUsuarioRequest
): Promise<User> {
  const respuesta =
    await apiClient.post<User>(
      "/usuarios",
      datos
    );

  return respuesta.data;
}

// Actualiza los datos y el estado del usuario.
export async function actualizarUsuario(
  idUsuario: number,
  datos: ActualizarUsuarioRequest
): Promise<User> {
  const respuesta =
    await apiClient.put<User>(
      `/usuarios/${idUsuario}`,
      datos
    );

  return respuesta.data;
}