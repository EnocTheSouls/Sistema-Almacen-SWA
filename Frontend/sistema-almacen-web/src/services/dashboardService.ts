import { apiClient } from "../api/apiClient";
import type { DashboardSolicitudes } from "../types/dashboard";

export async function obtenerDashboard() {
  const respuesta =
    await apiClient.get<DashboardSolicitudes>(
      "/solicitudes/dashboard"
    );

  return respuesta.data;
}