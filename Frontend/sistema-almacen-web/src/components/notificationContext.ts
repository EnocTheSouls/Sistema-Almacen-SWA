import {
  createContext,
  useContext,
} from "react";

import type {
  SolicitudNotificacion,
} from "../services/notificacionService";

export interface NotificationContextValue {
  notificaciones:
    SolicitudNotificacion[];

  totalNuevas: number;

  sonidoActivo: boolean;

  activarSonido:
    () => Promise<void>;

  limpiarNotificaciones:
    () => void;
}

export const NotificationContext =
  createContext<
    NotificationContextValue |
    undefined
  >(undefined);

export function useNotifications() {
  const context =
    useContext(
      NotificationContext
    );

  if (!context) {
    throw new Error(
      "useNotifications debe utilizarse dentro de NotificationProvider."
    );
  }

  return context;
}