import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

export interface SolicitudNotificacion {
  tipo: string;
  titulo: string;
  mensaje: string;
  idSolicitud: number;
  proyecto: string;
  familia: string;
  estacion: string;
  fecha: string;
}
// Usa la misma IP o nombre desde donde
// se abrió el frontend. 
const hostServidor =
  window.location.hostname;

const apiUrl =
  import.meta.env.VITE_API_URL ??
  `http://${hostServidor}:5042/api`;  

const hubUrl =
  apiUrl.replace(
    /\/api\/?$/,
    ""
  ) +
  "/hubs/notificaciones";

// Crea la conexión en tiempo real.
export function crearConexionNotificaciones(
  token: string,
  alRecibirSolicitud: (
    notificacion:
      SolicitudNotificacion
  ) => void
) {
  const conexion =
    new HubConnectionBuilder()
      .withUrl(
        hubUrl,
        {
          accessTokenFactory:
            () => token,
        }
      )
      .withAutomaticReconnect([
        0,
        2000,
        5000,
        10000,
      ])
      .configureLogging(
        LogLevel.Warning
      )
      .build();

  conexion.on(
    "SolicitudCreada",
    alRecibirSolicitud
  );

  return conexion;
}

// Inicia la conexión si está desconectada.
export async function iniciarConexion(
  conexion: ReturnType<
    typeof crearConexionNotificaciones
  >
) {
  if (
    conexion.state !==
    HubConnectionState.Disconnected
  ) {
    return;
  }

  await conexion.start();
}