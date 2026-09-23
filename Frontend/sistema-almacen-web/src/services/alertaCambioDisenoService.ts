import { apiClient } from "../api/apiClient";
import type { AlertaCambioDiseno } from "../types/alertaCambioDiseno";

export async function obtenerAlertasDiseno() {
  const { data } =
    await apiClient.get<AlertaCambioDiseno[]>(
      "/alertas-diseno"
    );

  return data;
}
