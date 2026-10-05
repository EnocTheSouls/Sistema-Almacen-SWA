import sonidoNuevaSolicitud
  from "../sounds/nueva-solicitud.mp3";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  NotificationContext,
} from "./notificationContext";

import type {
  ReactNode,
} from "react";

import type {
  HubConnection,
} from "@microsoft/signalr";

import {
  obtenerToken,
} from "../auth/authService";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

import {
  crearConexionNotificaciones,
  iniciarConexion,
} from "../services/notificacionService";

import type {
  SolicitudNotificacion,
} from "../services/notificacionService";


interface NotificationProviderProps {
  children: ReactNode;
}


export function NotificationProvider({
  children,
}: NotificationProviderProps) {
  const [
    notificaciones,
    setNotificaciones,
  ] = useState<
    SolicitudNotificacion[]
  >([]);

  const [
    sonidoActivo,
    setSonidoActivo,
  ] = useState(() => {
    return (
      localStorage.getItem(
        "notificaciones_sonido"
      ) === "activo"
    );
  });
  const conexionRef =
    useRef<HubConnection | null>(
      null
    );

  const audioRef =
    useRef<HTMLAudioElement | null>(
      null
    );

  const sonidoActivoRef =
    useRef(
      sonidoActivo
    );
  // Prepara el sonido.
  useEffect(() => {
    const audio =
      new Audio(
        sonidoNuevaSolicitud
      );

    audio.volume =
      0.9;

    audio.preload =
      "auto";

    audioRef.current =
      audio;

    return () => {
      audio.pause();
      audioRef.current =
        null;
    };
  }, []);
  // Mantiene disponible el estado actual
  // sin reiniciar la conexión SignalR.
  useEffect(() => {
    sonidoActivoRef.current =
      sonidoActivo;
  }, [
    sonidoActivo,
  ]);

  // Abre una sola conexión SignalR.
  useEffect(() => {
    const token =
      obtenerToken();

    const usuario =
      obtenerUsuarioActual();

    if (!token || !usuario) {
      return;
    }

    const rolActual =
      usuario.role
        ?.trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        ) ?? "";

    const puedeRecibirAvisos =
      rolActual === "ADMIN" ||
      rolActual === "ADMINISTRADOR" ||
      rolActual === "SUPERVISOR" ||
      rolActual === "MATERIALISTA" ||
      rolActual === "SURTIDOR";

    if (!puedeRecibirAvisos) {
      return;
    }

    const conexion =
      crearConexionNotificaciones(
        token,
        (notificacion) => {
          setNotificaciones(
            (actuales) => {
              const yaExiste =
                actuales.some(
                  (item) =>
                    item.idSolicitud ===
                    notificacion.idSolicitud
                );

              if (yaExiste) {
                return actuales;
              }

              return [
                notificacion,
                ...actuales,
              ];
            }
          );
          console.log(
            "Solicitud recibida por SignalR:",
            notificacion
          );

          if (
            sonidoActivoRef.current &&
            audioRef.current
          ) {
            const audioNotificacion =
              audioRef.current.cloneNode(
                true
              ) as HTMLAudioElement;

            audioNotificacion.volume =
              0.9;

            audioNotificacion
              .play()
              .then(() => {
                console.log(
                  "Sonido de solicitud reproducido."
                );
              })
              .catch((error) => {
                console.error(
                  "No se pudo reproducir el sonido:",
                  error
                );
              });
          } else {
            console.warn(
              "Llegó la solicitud, pero el sonido está desactivado."
            );
          }
          ``



        }
      );

    conexionRef.current =
      conexion;

    iniciarConexion(
      conexion
    )
      .then(() => {
        console.log(
          "SignalR conectado correctamente."
        );
      })
      .catch((error) => {
        console.error(
          "No se pudo conectar SignalR:",
          error
        );
      });

    return () => {
      conexionRef.current =
        null;

      conexion
        .stop()
        .catch(() => {
          // Evita errores al desmontar.
        });
    };
  }, []);


  const activarSonido = async () => {
    console.log(
      "Clic en activar sonido"
    );

    const nuevoEstado =
      !sonidoActivoRef.current;

    // Permite apagar el sonido.
    if (!nuevoEstado) {
      sonidoActivoRef.current =
        false;

      setSonidoActivo(false);

      localStorage.removeItem(
        "notificaciones_sonido"
      );

      console.log(
        "Sonido de notificaciones desactivado."
      );

      return;
    }

    const audio =
      audioRef.current;

    if (!audio) {
      console.error(
        "El archivo de sonido no está preparado."
      );

      return;
    }

    try {
      audio.currentTime = 0;

      // Debe ejecutarse directamente
      // como consecuencia del clic.
      await audio.play();

      audio.pause();
      audio.currentTime = 0;

      sonidoActivoRef.current =
        true;

      setSonidoActivo(true);

      localStorage.setItem(
        "notificaciones_sonido",
        "activo"
      );

      console.log(
        "Sonido de notificaciones activado."
      );
    } catch (error) {
      sonidoActivoRef.current =
        false;

      setSonidoActivo(false);

      localStorage.removeItem(
        "notificaciones_sonido"
      );

      console.error(
        "El navegador rechazó el sonido:",
        error
      );
    }
  };





  const limpiarNotificaciones =
    () => {
      setNotificaciones([]);
    };

  const value =
    useMemo(
      () => ({
        notificaciones,

        totalNuevas:
          notificaciones.length,

        sonidoActivo,

        activarSonido,

        limpiarNotificaciones,
      }),
      [
        notificaciones,
        sonidoActivo,
      ]
    );

  return (
    <NotificationContext.Provider
      value={value}
    >
      {children}
    </NotificationContext.Provider>
  );
}
