import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Layout } from "../components/Layout";

import {
  SolicitudDetalleModal,
} from "../components/solicitudes/SolicitudDetalleModal";

import {
  obtenerDashboard,
} from "../services/dashboardService";

import {
  obtenerAlertasDiseno,
} from "../services/alertaCambioDisenoService";

import type {
  AlertaCambioDiseno,
} from "../types/alertaCambioDiseno";

import {
  obtenerSolicitudes,
} from "../services/solicitudService";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

import type {
  DashboardSolicitudes,
} from "../types/dashboard";

import type {
  Solicitud,
} from "../types/solicitud";

import "./EstructuraPage.css";

interface ConfiguracionDashboard {
  actualizacionAutomatica: boolean;
  segundosActualizacion: number;
  limiteAmarillo: number;
  limiteNaranja: number;
  limiteRojo: number;
  solicitudesVisibles: number;
}
type VistaTarjetas =
  | "mosaico"
  | "horizontal"
  | "compacta";

const VISTA_TARJETAS_KEY =
  "dashboard_vista_tarjetas";
  
const configuracionInicial: ConfiguracionDashboard = {
  actualizacionAutomatica: true,
  segundosActualizacion: 2,
  limiteAmarillo: 10,
  limiteNaranja: 20,
  limiteRojo: 30,
  solicitudesVisibles: 8,
};


export function DashboardPage() {
  // Lee el usuario autenticado desde el JWT.
  const currentUser =
    obtenerUsuarioActual();

  // Evita ejecutar varias actualizaciones al mismo tiempo.
  const consultaEnProceso =
    useRef(false);

  // Elemento que entrará en modo de monitoreo.
  const dashboardRef =
    useRef<HTMLElement | null>(
      null
    );

  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardSolicitudes | null>(
    null
  );

  const [
    solicitudes,
    setSolicitudes,
  ] = useState<Solicitud[]>([]);

  const [
    alertasDiseno,
    setAlertasDiseno,
  ] = useState<AlertaCambioDiseno[]>([]);

  const [
    mostrarAlertasDiseno,
    setMostrarAlertasDiseno,
  ] = useState(false);

  const [
    paginaAlertas,
    setPaginaAlertas,
  ] = useState(1);

  const [
    solicitudSeleccionada,
    setSolicitudSeleccionada,
  ] = useState<Solicitud | null>(
    null
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    actualizando,
    setActualizando,
  ] = useState(false);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const [
    fechaHoraActual,
    setFechaHoraActual,
  ] = useState(new Date());

  // Controla la vista ampliada del Dashboard.
  const [
    esPantallaCompleta,
    setEsPantallaCompleta,
  ] = useState(
    Boolean(
      document.fullscreenElement
    )
  );
  // Vista elegida para acomodar las solicitudes.
  const [
    vistaTarjetas,
    setVistaTarjetas,
  ] = useState<VistaTarjetas>(() => {
    const vistaGuardada =
      localStorage.getItem(
        VISTA_TARJETAS_KEY
      );

    if (
      vistaGuardada === "mosaico" ||
      vistaGuardada === "horizontal" ||
      vistaGuardada === "compacta"
    ) {
      return vistaGuardada;
    }

    return "mosaico";
  });


  // Detecta pantallas móviles.
  const [
    modoMovil,
    setModoMovil,
  ] = useState(
    () =>
      window.matchMedia(
        "(max-width: 768px)"
      ).matches
  );

  const configuracion =
    configuracionInicial;

  // Carga los KPI y las solicitudes sin acumular peticiones.
  const cargarDatos = useCallback(
    async (
      mostrarIndicadorPrincipal = false
    ) => {
      // No inicia otra consulta si todavía existe una activa.
      if (consultaEnProceso.current) {
        return;
      }

      consultaEnProceso.current = true;

      try {
        if (mostrarIndicadorPrincipal) {
          setCargando(true);
        } else {
          setActualizando(true);
        }

        setErrorCarga("");

        const [
          dashboardData,
          solicitudesData,
          alertasData,
        ] = await Promise.all([
          obtenerDashboard(),
          obtenerSolicitudes(),
          obtenerAlertasDiseno(),
        ]);

        setAlertasDiseno(alertasData);


        setDashboard(
          dashboardData
        );

        setSolicitudes(
          solicitudesData
        );
      } catch (error) {
        console.error(
          "Error al cargar el Dashboard:",
          error
        );

        setErrorCarga(
          "No se pudieron cargar los indicadores y las solicitudes."
        );
      } finally {
        consultaEnProceso.current = false;
        setCargando(false);
        setActualizando(false);
      }
    },
    []
  );

  // Realiza la primera carga.
  useEffect(() => {
    cargarDatos(true);
  }, [cargarDatos]);

  // Actualiza el reloj cada segundo.
  useEffect(() => {
    const intervaloReloj =
      window.setInterval(() => {
        setFechaHoraActual(
          new Date()
        );
      }, 1000);

    return () => {
      window.clearInterval(
        intervaloReloj
      );
    };
  }, []);
  // Detecta la entrada y salida de pantalla completa,
  // incluso cuando se utiliza la tecla Esc.
  useEffect(() => {
    const actualizarPantallaCompleta =
      () => {
        setEsPantallaCompleta(
          Boolean(
            document.fullscreenElement
          )
        );
      };

    document.addEventListener(
      "fullscreenchange",
      actualizarPantallaCompleta
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        actualizarPantallaCompleta
      );
    };
  }, []);




  // Actualiza el diseño al cambiar
  // el tamaño de la pantalla.
  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 768px)"
      );

    const actualizarModoMovil = (
      event: MediaQueryListEvent
    ) => {
      setModoMovil(
        event.matches
      );
    };

    setModoMovil(
      mediaQuery.matches
    );

    mediaQuery.addEventListener(
      "change",
      actualizarModoMovil
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        actualizarModoMovil
      );
    };
  }, []);

  // Actualiza automáticamente el Dashboard.
  useEffect(() => {
    if (
      !configuracion.actualizacionAutomatica
    ) {
      return;
    }

    const segundos =
      Math.max(
        2,
        configuracion.segundosActualizacion
      );

    const intervalo =
      window.setInterval(() => {
        cargarDatos(false);
      }, segundos * 1000);

    return () => {
      window.clearInterval(
        intervalo
      );
    };
  }, [
    cargarDatos,
    configuracion.actualizacionAutomatica,
    configuracion.segundosActualizacion,
  ]);
  const solicitudesPendientes =
    useMemo(() => {
      const prioridadEstado = (
        estado: string
      ) => {
        const estadoNormalizado =
          estado
            .trim()
            .toLowerCase();

        if (
          estadoNormalizado ===
          "pendiente"
        ) {
          return 1;
        }

        if (
          estadoNormalizado ===
          "parcial"
        ) {
          return 2;
        }

        return 3;
      };

      return solicitudes
        .filter((solicitud) => {
          const estado =
            solicitud.nombreEstado
              .trim()
              .toLowerCase();

          return (
            estado === "pendiente" ||
            estado === "parcial"
          );
        })
        .sort(
          (
            solicitudA,
            solicitudB
          ) => {
            const diferenciaEstado =
              prioridadEstado(
                solicitudA.nombreEstado
              ) -
              prioridadEstado(
                solicitudB.nombreEstado
              );

            if (diferenciaEstado !== 0) {
              return diferenciaEstado;
            }

            return (
              new Date(
                solicitudA.fechaSolicitud
              ).getTime() -
              new Date(
                solicitudB.fechaSolicitud
              ).getTime()
            );
          }
        )
        .slice(
          0,
          configuracion.solicitudesVisibles
        );
    }, [
      solicitudes,
      configuracion.solicitudesVisibles,
    ]);


  // Incluye solicitudes pendientes y parciales.
  const totalSolicitudesPendientes =
    (dashboard?.pendientes ?? 0) +
    (dashboard?.parciales ?? 0);



  const solicitudesSurtidas =
    useMemo(() => {
      return solicitudes.filter(
        (solicitud) =>
          solicitud.nombreEstado
            .toLowerCase() ===
          "surtida"
      ).length;
    }, [solicitudes]);

  const alertasOrdenadas =
    [...alertasDiseno].sort(
      (a, b) =>
        a.diasRestantes -
        b.diasRestantes
    );

  const alertasResumen =
    alertasOrdenadas.slice(0, 3);


  const ALERTAS_POR_PAGINA = 15;

  const totalPaginasAlertas =
    Math.max(
      1,
      Math.ceil(
        alertasDiseno.length /
        ALERTAS_POR_PAGINA
      )
    );

  const alertasPaginadas =
    alertasOrdenadas.slice(
      (paginaAlertas - 1) *
      ALERTAS_POR_PAGINA,
      paginaAlertas *
      ALERTAS_POR_PAGINA
    );

  const abrirDetalle = (
    solicitud: Solicitud
  ) => {
    setSolicitudSeleccionada(
      solicitud
    );

    setMensajeExito("");
  };

  const cerrarDetalle = () => {
    setSolicitudSeleccionada(
      null
    );
  };

  // Actualiza la solicitud después de modificarla.
  const manejarSolicitudActualizada = (
    solicitudActualizada: Solicitud,
    mensaje: string
  ) => {
    setSolicitudes(
      (solicitudesActuales) =>
        solicitudesActuales.map(
          (solicitud) =>
            solicitud.idSolicitud ===
              solicitudActualizada.idSolicitud
              ? solicitudActualizada
              : solicitud
        )
    );

    setSolicitudSeleccionada(
      solicitudActualizada
    );

    setMensajeExito(
      mensaje
    );

    cargarDatos(false);
  };
  // Guarda la distribución seleccionada.
  const cambiarVistaTarjetas = (
    nuevaVista: VistaTarjetas
  ) => {
    setVistaTarjetas(
      nuevaVista
    );

    localStorage.setItem(
      VISTA_TARJETAS_KEY,
      nuevaVista
    );
  };

  const activarPantallaCompleta =
    async () => {
      try {
        if (
          !document.fullscreenElement
        ) {
          await dashboardRef.current
            ?.requestFullscreen();

          return;
        }

        await document.exitFullscreen();
      } catch (error) {
        console.error(
          "No se pudo cambiar a pantalla completa:",
          error
        );
      }
    };

  const configuracionTarjeta =
    useMemo(() => {
      // Tres mosaicos compactos.
      if (
        vistaTarjetas === "compacta"
      ) {
        return {
          columnas:
            "repeat(auto-fit, minmax(280px, 1fr))",

          alturaMinima:
            "auto",

          padding:
            "12px",

          separacion:
            "5px",

          materialesVisibles:
            1,

          mostrarDescripcion:
            true,

          columnasInformacion:
            "repeat(2, minmax(0, 1fr))",

          tamanoSolicitud:
            "18px",

          tamanoTotal:
            "18px",
        };
      }

      // Una tarjeta por fila.
      if (
        vistaTarjetas === "horizontal"
      ) {
        return {
          columnas:
            "minmax(0, 1fr)",

          alturaMinima:
            "auto",

          padding:
            "10px 13px",

          separacion:
            "7px",

          materialesVisibles:
            1,

          mostrarDescripcion:
            true,

          columnasInformacion:
            "repeat(2, minmax(0, 1fr))",

          tamanoSolicitud:
            "20px",

          tamanoTotal:
            "19px",
        };
      }

      // Dos mosaicos por fila.
      return {
        columnas:
          "repeat(2, minmax(0, 1fr))",

        alturaMinima:
          "auto",

        padding:
          "14px",

        separacion:
          "10px",

        materialesVisibles:
          2,

        mostrarDescripcion:
          true,

        columnasInformacion:
          "repeat(2, minmax(0, 1fr))",

        tamanoSolicitud:
          "20px",

        tamanoTotal:
          "19px",
      };
    }, [vistaTarjetas]);




  // Indica si la solicitud debe ocupar una fila completa.
  const esVistaHorizontal =
    vistaTarjetas === "horizontal";

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section
          ref={dashboardRef}
          style={{
            ...dashboardContainerStyle,

            padding:
              modoMovil
                ? "14px"
                : esPantallaCompleta
                  ? "24px 34px"
                  : "30px",

            borderRadius:
              modoMovil
                ? "10px"
                : esPantallaCompleta
                  ? 0
                  : "16px",

            minHeight:
              esPantallaCompleta
                ? "100vh"
                : undefined,

            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            overflowX: "hidden",
            boxSizing: "border-box",

            overflowY:
              esPantallaCompleta
                ? "auto"
                : undefined,

            background:
              esPantallaCompleta
                ? "#f1f5f9"
                : "#ffffff",
          }}
        >

          {mensajeExito && (
            <div style={successStyle}>
              {mensajeExito}
            </div>
          )}



          <header
            style={{
              ...headerStyle,

              flexDirection:
                modoMovil
                  ? "column"
                  : "row",

              alignItems:
                modoMovil
                  ? "stretch"
                  : "center",

              gap:
                modoMovil
                  ? "14px"
                  : "20px",
            }}
          >
            <div>
              <h1
                style={{
                  ...titleStyle,

                  fontSize:
                    modoMovil
                      ? "23px"
                      : "30px",
                }}
              >
                Centro de solicitudes
              </h1>

              <p style={welcomeStyle}>
                Bienvenido,{" "}
                {currentUser?.nombre ??
                  currentUser?.username ??
                  "Usuario"}
              </p>
            </div>

            <div
              style={{
                ...headerActionsStyle,

                width:
                  modoMovil
                    ? "100%"
                    : "auto",

                justifyContent:
                  modoMovil
                    ? "space-between"
                    : "flex-end",

                padding:
                  modoMovil
                    ? "10px 0"
                    : 0,

                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  ...clockStyle,

                  alignItems:
                    modoMovil
                      ? "flex-start"
                      : "flex-end",

                  marginRight:
                    modoMovil
                      ? 0
                      : "10px",

                  flex: "1 1 auto",
                  minWidth: 0,
                }}
              >
                <strong
                  style={{
                    ...timeStyle,

                    fontSize:
                      modoMovil
                        ? "21px"
                        : "27px",
                  }}
                >
                  {fechaHoraActual.toLocaleTimeString(
                    "es-MX",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}
                </strong>

                <span
                  style={{
                    ...dateStyle,

                    fontSize:
                      modoMovil
                        ? "11px"
                        : "12px",

                    maxWidth:
                      modoMovil
                        ? "190px"
                        : "none",

                    lineHeight: 1.35,
                  }}
                >
                  {fechaHoraActual.toLocaleDateString(
                    "es-MX",
                    {
                      weekday: "long",
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  cargarDatos(false)
                }
                disabled={actualizando}
                title="Actualizar información"
                aria-label="Actualizar información"
                style={{
                  ...iconButtonStyle,

                  width:
                    modoMovil
                      ? "40px"
                      : "44px",

                  height:
                    modoMovil
                      ? "40px"
                      : "44px",

                  flexShrink: 0,
                }}
              >
                {actualizando
                  ? "..."
                  : "↻"}
              </button>

              <button
                type="button"
                onClick={
                  activarPantallaCompleta
                }
                title={
                  esPantallaCompleta
                    ? "Salir de pantalla completa"
                    : "Modo de monitoreo"
                }
                aria-label={
                  esPantallaCompleta
                    ? "Salir de pantalla completa"
                    : "Activar modo de monitoreo"
                }
                style={{
                  ...iconButtonStyle,

                  width:
                    modoMovil
                      ? "40px"
                      : "44px",

                  height:
                    modoMovil
                      ? "40px"
                      : "44px",

                  flexShrink: 0,
                }}
              >
                {esPantallaCompleta
                  ? "×"
                  : "⛶"}
              </button>
            </div>
          </header>
          {
            errorCarga && (
              <div style={errorStyle}>
                {errorCarga}
              </div>
            )
          }

          {
            cargando ? (
              <div style={loadingStyle}>
                Cargando Dashboard...
              </div>
            ) : (
              <>
                <div
                  style={{
                    ...kpiGridStyle,

                    // En móvil muestra un KPI por fila.
                    gridTemplateColumns:
                      modoMovil
                        ? "minmax(0, 1fr)"
                        : "repeat(3, minmax(220px, 1fr))",

                    gap:
                      modoMovil
                        ? "10px"
                        : "18px",

                    marginBottom:
                      modoMovil
                        ? "18px"
                        : "28px",
                  }}
                >
                  <KpiCard
                    titulo="Pendientes"
                    cantidad={
                      totalSolicitudesPendientes
                    }
                    color="#ffffff"
                    fondo="#dc2626"
                    descripcion="Solicitudes esperando atención"
                    compacto={modoMovil}
                    alerta={
                      totalSolicitudesPendientes > 0
                    }
                    pantallaCompleta={
                      esPantallaCompleta
                    }


                  />
                  <KpiCard
                    titulo="Surtidas"
                    cantidad={
                      solicitudesSurtidas
                    }
                    color="#ffffff"
                    fondo="#16a34a"
                    descripcion="Material descontado y preparado"
                    compacto={modoMovil}
                    pantallaCompleta={
                      esPantallaCompleta
                    }
                  />

                  <KpiCard
                    titulo="Total"
                    cantidad={
                      solicitudes.length
                    }
                    color="#ffffff"
                    fondo="#2563eb"
                    descripcion="Solicitudes registradas"
                    compacto={modoMovil}
                    pantallaCompleta={
                      esPantallaCompleta
                    }
                  />
                </div>
                <section
                  style={{
                    ...pendingSectionStyle,

                    padding:
                      esPantallaCompleta
                        ? "22px"
                        : "18px",

                    minHeight: 0,
                  }}
                >

                  <div style={pendingHeaderStyle}>
                    <div>
                      <h2
                        style={{
                          ...sectionTitleStyle,

                          fontSize:
                            esPantallaCompleta
                              ? "30px"
                              : "22px",
                        }}
                      >
                        Solicitudes pendientes
                      </h2>

                      <p style={sectionDescriptionStyle}>
                        Las solicitudes más antiguas aparecen primero.
                      </p>
                    </div>

                    <div style={pendingHeaderControlsStyle}>
                      <div style={cardSizeControlStyle}>
                        <label
                          htmlFor="vistaTarjetas"
                          style={cardSizeLabelStyle}
                        >
                          Vista
                        </label>
                        <select
                          id="vistaTarjetas"
                          value={vistaTarjetas}
                          onChange={(event) => {
                            cambiarVistaTarjetas(
                              event.target
                                .value as VistaTarjetas
                            );
                          }}
                          style={cardSizeSelectStyle}
                        >
                          <option value="mosaico">
                            Dos columnas
                          </option>

                          <option value="horizontal">
                            Una por fila
                          </option>

                          <option value="compacta">
                            Tres columnas
                          </option>
                        </select>
                      </div>

                      <div
                        style={{
                          ...pendingCounterStyle,

                          padding:
                            esPantallaCompleta
                              ? "10px 17px"
                              : "8px 13px",

                          fontSize:
                            esPantallaCompleta
                              ? "16px"
                              : "13px",
                        }}
                      >
                        {totalSolicitudesPendientes}{" "}
                        {totalSolicitudesPendientes === 1
                          ? "pendiente"
                          : "pendientes"}
                      </div>
                    </div>
                  </div>

                  {solicitudesPendientes.length === 0 ? (
                    <div style={emptyStyle}>
                      No hay solicitudes pendientes.
                    </div>
                  ) : (
                    <div
                      style={{
                        ...pendingCardsGridStyle,

                        gridTemplateColumns:
                          modoMovil
                            ? "minmax(0, 1fr)"
                            : configuracionTarjeta.columnas,

                        gap:
                          configuracionTarjeta.separacion,
                      }}
                    >
                      {solicitudesPendientes.map(
                        (solicitud) => {
                          const minutos =
                            calcularMinutosEspera(
                              solicitud.fechaSolicitud,
                              fechaHoraActual
                            );

                          const alerta =
                            obtenerAlertaEspera(
                              minutos,
                              configuracion
                            );

                          const materialesPendientes =
                            [...(solicitud.materiales ?? [])]
                              .filter(
                                (material) =>
                                  material.cantidadSurtida <
                                  material.cantidadSolicitada
                              )
                              .sort(
                                (
                                  materialA,
                                  materialB
                                ) => {
                                  const prioridadA =
                                    materialA.cantidadSurtida === 0
                                      ? 1
                                      : 2;

                                  const prioridadB =
                                    materialB.cantidadSurtida === 0
                                      ? 1
                                      : 2;

                                  return (
                                    prioridadA -
                                    prioridadB
                                  );
                                }
                              );

                          const cantidadTotalPendiente =
                            materialesPendientes.reduce(
                              (
                                acumulado,
                                material
                              ) =>
                                acumulado +
                                Math.max(
                                  0,
                                  material.cantidadSolicitada -
                                  material.cantidadSurtida
                                ),
                              0
                            );

                          const esParcial =
                            solicitud.nombreEstado
                              .trim()
                              .toLowerCase() ===
                            "parcial";

                          return (
                            <article
                              key={
                                solicitud.idSolicitud
                              }
                              onClick={() => {
                                abrirDetalle(
                                  solicitud
                                );
                              }}
                              style={{
                                ...pendingRequestCardStyle,

                                minHeight:
                                  configuracionTarjeta
                                    .alturaMinima,

                                padding:
                                  esVistaHorizontal
                                    ? "8px 12px"
                                    : configuracionTarjeta.padding,

                                gap:
                                  esVistaHorizontal
                                    ? "5px"
                                    : configuracionTarjeta.separacion,
                                background: "#ffffff",
                              }}
                            >
                              <div
                                style={
                                  pendingRequestCardHeaderStyle
                                }
                              >
                                <div>
                                  <span
                                    style={
                                      requestLabelStyle
                                    }
                                  >
                                    Solicitud
                                  </span>

                                  <strong
                                    style={{
                                      ...requestNumberStyle,

                                      fontSize:
                                        configuracionTarjeta
                                          .tamanoSolicitud,
                                    }}
                                  >
                                    #
                                    {
                                      solicitud.idSolicitud
                                    }
                                  </strong>
                                </div>
                                <span
                                  style={{
                                    ...waitingBadgeStyle,

                                    minWidth:
                                      esPantallaCompleta
                                        ? "90px"
                                        : "70px",

                                    padding:
                                      esPantallaCompleta
                                        ? "7px 12px"
                                        : "5px 9px",

                                    border:
                                      `1px solid ${alerta.color}`,

                                    background:
                                      alerta.fondo,

                                    color:
                                      alerta.color,

                                    fontSize:
                                      esPantallaCompleta
                                        ? "13px"
                                        : "11px",
                                  }}
                                >
                                  {formatearTiempoEspera(
                                    minutos
                                  )}
                                </span>
                              </div>
                              {/* Distribuye la información según la vista elegida. */}
                              <div
                                style={{
                                  display: "grid",

                                  gridTemplateColumns:
                                    esVistaHorizontal &&
                                      !modoMovil
                                      ? "minmax(320px, 0.75fr) minmax(0, 1.25fr)"
                                      : "minmax(0, 1fr)",

                                  alignItems: "start",

                                  gap:
                                    configuracionTarjeta
                                      .separacion,

                                  minWidth: 0,
                                }}
                              >
                                {/* Información general de la solicitud. */}
                                <div
                                  style={{
                                    ...requestLocationGridStyle,

                                    gridTemplateColumns:
                                      modoMovil
                                        ? "repeat(2, minmax(0, 1fr))"
                                        : esVistaHorizontal
                                          ? "repeat(2, minmax(0, 1fr))"
                                          : configuracionTarjeta
                                            .columnasInformacion,
                                  }}
                                >
                                  <div
                                    style={
                                      requestInformationStyle
                                    }
                                  >
                                    <span
                                      style={
                                        requestInformationLabelStyle
                                      }
                                    >
                                      Proyecto
                                    </span>

                                    <strong>
                                      {
                                        solicitud.nombreProyecto
                                      }
                                    </strong>
                                  </div>

                                  <div
                                    style={
                                      requestInformationStyle
                                    }
                                  >
                                    <span
                                      style={
                                        requestInformationLabelStyle
                                      }
                                    >
                                      Familia
                                    </span>

                                    <strong>
                                      {
                                        solicitud.nombreFamilia
                                      }
                                    </strong>
                                  </div>

                                  <div
                                    style={
                                      requestInformationStyle
                                    }
                                  >
                                    <span
                                      style={
                                        requestInformationLabelStyle
                                      }
                                    >
                                      Estación
                                    </span>

                                    <strong>
                                      {solicitud.nombreEstacion ??
                                        materialesPendientes[0]
                                          ?.nombreEstacion ??
                                        "Sin estación"}
                                    </strong>
                                  </div>

                                  <div
                                    style={
                                      requestInformationStyle
                                    }
                                  >
                                    <span
                                      style={
                                        requestInformationLabelStyle
                                      }
                                    >
                                      Materiales
                                    </span>

                                    <strong>
                                      {
                                        materialesPendientes.length
                                      }
                                    </strong>
                                  </div>
                                </div>

                                {/* Lista de materiales pendientes. */}
                                <div
                                  style={
                                    requestMaterialsStyle
                                  }
                                >
                                  <span
                                    style={
                                      requestInformationLabelStyle
                                    }
                                  >
                                    Material pendiente
                                  </span>

                                  {materialesPendientes
                                    .slice(
                                      0,
                                      configuracionTarjeta
                                        .materialesVisibles
                                    )
                                    .map(
                                      (
                                        material,
                                        indice
                                      ) => {
                                        const pendiente =
                                          Math.max(
                                            0,
                                            material
                                              .cantidadSolicitada -
                                            material
                                              .cantidadSurtida
                                          );

                                        return (
                                          <div
                                            key={
                                              `${solicitud.idSolicitud}-` +
                                              `${material.numeroParteMaterial}-` +
                                              `${indice}`
                                            }
                                            style={
                                              requestMaterialRowStyle
                                            }
                                          >
                                            <div style={requestMaterialContentStyle}>
                                              <div style={requestMaterialHeadingStyle}>
                                                <strong
                                                  style={
                                                    requestMaterialNumberStyle
                                                  }
                                                  title={
                                                    material.numeroParteMaterial
                                                  }
                                                >
                                                  {
                                                    material.numeroParteMaterial
                                                  }
                                                </strong>

                                                <span style={requestMaterialTypeStyle}>
                                                  Material
                                                </span>


                                              </div>

                                              <span
                                                style={
                                                  requestMaterialDescriptionStyle
                                                }
                                                title={
                                                  material.descripcionMaterial ??
                                                  "Sin descripción"
                                                }
                                              >
                                                {material.descripcionMaterial ??
                                                  "Sin descripción"}
                                              </span>

                                              <div style={requestMaterialBottomStyle}>
                                                <span style={requestMaterialStationStyle}>
                                                  {materialesPendientes.length === 1
                                                    ? "Estación:"
                                                    : "Estación del primer material:"}{" "}

                                                  <strong>
                                                    {materialesPendientes[0]
                                                      ?.nombreEstacion ??
                                                      solicitud.nombreEstacion ??
                                                      "N/A"}
                                                  </strong>
                                                </span>

                                                <div
                                                  style={
                                                    requestPendingQuantityStyle
                                                  }
                                                >
                                                  <span
                                                    style={
                                                      requestPendingQuantityLabelStyle
                                                    }
                                                  >
                                                    Pendiente
                                                  </span>

                                                  <strong
                                                    style={
                                                      requestQuantityStyle
                                                    }
                                                  >
                                                    {pendiente}
                                                  </strong>
                                                </div>
                                              </div>
                                            </div>
                                          </div>





                                        );
                                      }
                                    )}

                                  {materialesPendientes.length >
                                    configuracionTarjeta
                                      .materialesVisibles && (
                                      <span
                                        style={
                                          additionalMaterialsStyle
                                        }
                                      >
                                        +
                                        {materialesPendientes.length -
                                          configuracionTarjeta
                                            .materialesVisibles}{" "}
                                        materiales adicionales
                                      </span>
                                    )}
                                </div>
                              </div>


                              <div
                                style={
                                  requestCardFooterStyle
                                }
                              >
                                <div>
                                  <span
                                    style={
                                      requestInformationLabelStyle
                                    }
                                  >
                                    Total pendiente
                                  </span>

                                  <strong
                                    style={{
                                      ...requestTotalStyle,

                                      fontSize:
                                        configuracionTarjeta
                                          .tamanoTotal,
                                    }}
                                  >
                                    {cantidadTotalPendiente}
                                  </strong>
                                </div>

                                <span
                                  style={{
                                    ...pendingStatusStyle,

                                    justifySelf: "center",

                                    background:
                                      esParcial
                                        ? "#fef3c7"
                                        : "#eef2f7",

                                    color:
                                      esParcial
                                        ? "#92400e"
                                        : "#334155",
                                  }}
                                >
                                  {solicitud.nombreEstado}
                                </span>

                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();

                                    abrirDetalle(
                                      solicitud
                                    );
                                  }}
                                  style={
                                    requestOpenButtonStyle
                                  }
                                >
                                  Abrir
                                </button>
                              </div>
                            </article>
                          );
                        }
                      )}
                    </div>
                  )}


                  {!esPantallaCompleta && (
                    <div
                      style={
                        sectionActionsStyle
                      }
                    >
                      <button
                        type="button"
                        onClick={() => {
                          window.location.href =
                            "/solicitudes";
                        }}
                        style={
                          viewAllButtonStyle
                        }
                      >
                        Ver todas las solicitudes
                      </button>
                    </div>
                  )}


                </section>
                {!esPantallaCompleta && (

                  <section
                    style={{
                      ...pendingSectionStyle,
                      marginTop: "20px",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      setMostrarAlertasDiseno(true)
                    }
                  >
                    <div style={pendingHeaderStyle}>
                      <div>
                        <h2 style={sectionTitleStyle}>
                          Próximos Cambios de Diseño
                        </h2>

                        <p style={sectionDescriptionStyle}>
                          Cambios detectados automáticamente
                          desde el 5MF.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarAlertasDiseno(true)
                        }
                        style={viewAllButtonStyle}
                      >
                        Ver todos
                      </button>
                    </div>

                    {alertasDiseno.length === 0 ? (
                      <div style={emptyStyle}>
                        No hay cambios próximos.
                      </div>
                    ) : (
                      <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                          <thead>
                            <tr style={tableHeaderStyle}>
                              <th style={thStyle}>
                                Proyecto
                              </th>

                              <th style={thStyle}>
                                Familia
                              </th>

                              <th style={thStyle}>
                                Cambio
                              </th>

                              <th style={thStyle}>
                                Fecha
                              </th>

                              <th style={thStyle}>
                                Días
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {alertasResumen.map(
                              (alerta) => (
                                <tr
                                  key={
                                    alerta.arnesActual +
                                    alerta.disenoSiguiente
                                  }
                                >
                                  <td style={tdStyle}>
                                    {alerta.proyecto}
                                  </td>

                                  <td style={tdStyle}>
                                    {alerta.familia}
                                  </td>

                                  <td style={tdStyle}>
                                    <strong>
                                      {alerta.disenoActual}
                                    </strong>
                                    {" → "}
                                    <strong>
                                      {alerta.disenoSiguiente}
                                    </strong>
                                  </td>

                                  <td style={tdStyle}>
                                    {alerta.fechaCambio}
                                  </td>

                                  <td style={tdStyle}>
                                    <span
                                      style={{
                                        padding:
                                          "6px 10px",
                                        borderRadius:
                                          "999px",
                                        background:
                                          alerta.diasRestantes <= 7
                                            ? "#fecaca"
                                            : alerta.diasRestantes <= 14
                                              ? "#fed7aa"
                                              : "#dcfce7",

                                        color:
                                          alerta.diasRestantes <= 7
                                            ? "#991b1b"
                                            : alerta.diasRestantes <= 14
                                              ? "#9a3412"
                                              : "#166534",
                                      }}
                                    >
                                      {alerta.diasRestantes === 0
                                        ? "Hoy"
                                        : `${alerta.diasRestantes} días`}
                                    </span>
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                )}


              </>
            )
          }
        </section >
      </div >
      {
        mostrarAlertasDiseno && (
          <div style={modalOverlayStyle}>
            <section
              style={{
                ...modalStyle,
                maxWidth: "1400px",
              }}
            >
              <div style={modalHeaderStyle}>
                <div>
                  <h2 style={modalTitleStyle}>
                    Cambios de Diseño
                  </h2>

                  <p style={modalDescriptionStyle}>
                    Todos los cambios detectados
                    desde los archivos 5MF.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setMostrarAlertasDiseno(false)
                  }
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>

              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={thStyle}>Proyecto</th>
                      <th style={thStyle}>Familia</th>
                      <th style={thStyle}>Arnés</th>
                      <th style={thStyle}>Diseño Actual</th>
                      <th style={thStyle}>Diseño Nuevo</th>
                      <th style={thStyle}>Fecha Cambio</th>
                      <th style={thStyle}>Días</th>
                    </tr>
                  </thead>

                  <tbody>
                    {alertasPaginadas.map(
                      (alerta) => (
                        <tr
                          key={
                            alerta.arnesActual +
                            alerta.disenoSiguiente
                          }
                        >
                          <td style={tdStyle}>
                            {alerta.proyecto}
                          </td>

                          <td style={tdStyle}>
                            {alerta.familia}
                          </td>

                          <td style={tdStyle}>
                            {alerta.arnesActual}
                          </td>

                          <td style={tdStyle}>
                            {alerta.disenoActual}
                          </td>

                          <td style={tdStyle}>
                            {alerta.disenoSiguiente}
                          </td>

                          <td style={tdStyle}>
                            {alerta.fechaCambio}
                          </td>

                          <td style={tdStyle}>
                            {alerta.diasRestantes === 0
                              ? "Hoy"
                              : `${alerta.diasRestantes} días`}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              <div style={paginationStyle}>
                <button
                  type="button"
                  onClick={() =>
                    setPaginaAlertas(
                      (p) =>
                        Math.max(1, p - 1)
                    )
                  }
                  disabled={
                    paginaAlertas === 1
                  }
                  style={paginationButtonStyle}
                >
                  Anterior
                </button>

                <span style={paginationInfoStyle}>
                  Página {paginaAlertas} de{" "}
                  {totalPaginasAlertas}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPaginaAlertas(
                      (p) =>
                        Math.min(
                          totalPaginasAlertas,
                          p + 1
                        )
                    )
                  }
                  disabled={
                    paginaAlertas ===
                    totalPaginasAlertas
                  }
                  style={paginationButtonStyle}
                >
                  Siguiente
                </button>
              </div>
            </section>
          </div>
        )
      }

      {
        solicitudSeleccionada && (
          <SolicitudDetalleModal
            solicitud={
              solicitudSeleccionada
            }
            onCerrar={
              cerrarDetalle
            }
            onSolicitudActualizada={
              manejarSolicitudActualizada
            }
          />
        )
      }
    </Layout >
  );
}

interface KpiCardProps {
  titulo: string;
  cantidad: number;
  color: string;
  fondo: string;
  descripcion: string;
  compacto: boolean;

  alerta?: boolean;

  // Amplía la tarjeta en modo de monitoreo.
  pantallaCompleta?: boolean;
}

function KpiCard({
  titulo,
  cantidad,
  color,
  fondo,
  descripcion,
  compacto,
  alerta = false,
  pantallaCompleta = false,
}: KpiCardProps) {
  return (
    <article
      className={
        alerta
          ? "kpi-pendientes-alerta"
          : undefined
      }
      style={{
        ...kpiCardStyle,
        background: fondo,

        width: "100%",
        minWidth: 0,

        minHeight:
          compacto
            ? "82px"
            : pantallaCompleta
              ? "190px"
              : "155px",
        padding:
          compacto
            ? "13px 16px"
            : pantallaCompleta
              ? "28px"
              : "22px",

        flexDirection:
          compacto
            ? "row"
            : "column",

        justifyContent:
          compacto
            ? "flex-start"
            : "center",

        textAlign:
          compacto
            ? "left"
            : "center",

        gap:
          compacto
            ? "15px"
            : 0,

        boxSizing: "border-box",
      }}
    >
      <strong
        style={{
          ...kpiNumberStyle,
          color,

          minWidth:
            compacto
              ? "52px"
              : "auto",

          fontSize:
            compacto
              ? "31px"
              : pantallaCompleta
                ? "64px"
                : "46px",


          textAlign:
            compacto
              ? "center"
              : "inherit",
        }}
      >
        {cantidad}
      </strong>

      <div
        style={{
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h3
          style={{
            ...kpiTitleStyle,
            color,

            margin:
              compacto
                ? "0 0 3px"
                : "10px 0 5px",

            fontSize:
              compacto
                ? "16px"
                : pantallaCompleta
                  ? "26px"
                  : "20px",

          }}
        >
          {titulo}
        </h3>

        <span
          style={{
            ...kpiDescriptionStyle,
            color,

            fontSize:
              compacto
                ? "11px"
                : pantallaCompleta
                  ? "16px"
                  : "13px",

            lineHeight: 1.35,
          }}
        >
          {descripcion}
        </span>
      </div>
    </article>
  );
}

function calcularMinutosEspera(
  fechaSolicitud: string,
  fechaActual: Date
) {
  const fecha =
    new Date(fechaSolicitud);

  if (
    Number.isNaN(
      fecha.getTime()
    )
  ) {
    return 0;
  }

  const diferencia =
    fechaActual.getTime() -
    fecha.getTime();

  return Math.max(
    0,
    Math.floor(
      diferencia / 60000
    )
  );
}

function formatearTiempoEspera(
  minutos: number
) {
  if (minutos < 1) {
    return "Ahora";
  }

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const minutosRestantes =
    minutos % 60;

  if (minutosRestantes === 0) {
    return `${horas} h`;
  }

  return `${horas} h ${minutosRestantes} min`;
}

function obtenerAlertaEspera(
  minutos: number,
  configuracion: ConfiguracionDashboard

) {
  if (
    minutos >=
    configuracion.limiteRojo
  ) {
    return {
      fondo: "#fef2f2",
      color: "#dc2626",
    };
  }

  if (
    minutos >=
    configuracion.limiteNaranja
  ) {
    return {
      fondo: "#fff7ed",
      color: "#ea580c",
    };
  }

  if (
    minutos >=
    configuracion.limiteAmarillo
  ) {
    return {
      fondo: "#fefce8",
      color: "#ca8a04",
    };
  }

  return {
    fondo: "#f8fafc",
    color: "#2563eb",
  };
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1500px",
  minWidth: 0,
  margin: "0 auto",
  boxSizing: "border-box" as const,
  overflowX: "hidden" as const,
};


const dashboardContainerStyle = {
  padding: "30px",
  borderRadius: "16px",
  background: "#ffffff",

  boxShadow:
    "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "12px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "30px",
};

const welcomeStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  fontSize: "14px",
};

const headerActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const clockStyle = {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-end",
  marginRight: "10px",
};

const timeStyle = {
  color: "#102957",
  fontSize: "27px",
  fontWeight: "800",
  lineHeight: 1,
};

const dateStyle = {
  marginTop: "6px",
  color: "#64748b",
  fontSize: "12px",
  textTransform:
    "capitalize" as const,
};

const iconButtonStyle = {
  width: "44px",
  height: "44px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "22px",
  cursor: "pointer",
};

const kpiGridStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(3, minmax(220px, 1fr))",

  gap: "18px",
  marginBottom: "28px",
};

const kpiCardStyle = {
  minHeight: "155px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "22px",
  borderRadius: "12px",
  textAlign: "center" as const,
};

const kpiNumberStyle = {
  fontSize: "46px",
  fontWeight: "800",
  lineHeight: 1,
};

const kpiTitleStyle = {
  margin: "10px 0 5px",
  fontSize: "20px",
};

const kpiDescriptionStyle = {
  fontSize: "13px",
  opacity: 0.9,
};

const pendingSectionStyle = {
  padding: "22px",

  border: "1px solid #cbd5e1",
  borderRadius: "12px",

  background: "#f5f7fb",

  boxShadow:
    "0 6px 20px rgba(15, 23, 42, 0.07)",
};

const pendingHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "18px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "22px",
};

const sectionDescriptionStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const pendingCounterStyle = {
  padding: "9px 14px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontWeight: "800",
};

const tableContainerStyle = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto" as const,
  overflowY: "hidden" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  boxSizing: "border-box" as const,
};

const tableStyle = {
  width: "100%",
  borderCollapse:
    "collapse" as const,
};

const tableHeaderStyle = {
  background: "#f1f5f9",
};

const thStyle = {
  padding: "13px",
  borderBottom:
    "2px solid #cbd5e1",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "14px 13px",
  borderBottom:
    "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "14px",
};


const waitingBadgeStyle = {
  display: "inline-block",

  borderRadius: "999px",

  fontWeight: "800",

  textAlign: "center" as const,

  whiteSpace: "nowrap" as const,
};




const sectionActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "18px",
};

const viewAllButtonStyle = {
  minHeight: "42px",
  padding: "10px 17px",
  border: "1px solid #102957",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontWeight: "700",
  cursor: "pointer",
};

const loadingStyle = {
  padding: "45px",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const emptyStyle = {
  padding: "38px",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const successStyle = {
  marginBottom: "18px",
  padding: "13px 15px",
  border: "1px solid #bbf7d0",
  borderRadius: "9px",
  background: "#f0fdf4",
  color: "#166534",
  fontWeight: "700",
};

const errorStyle = {
  marginBottom: "18px",
  padding: "13px 15px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fef2f2",
  color: "#991b1b",
};

const pendingStatusStyle = {
  display: "inline-block",

  minWidth: "66px",

  padding: "4px 8px",

  borderRadius: "999px",

  fontSize: "10px",
  fontWeight: "800",

  textAlign: "center" as const,
};


const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  background:
    "rgba(15,23,42,0.60)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 3000,
};

const modalStyle = {
  width: "100%",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  background: "#ffffff",
  borderRadius: "16px",
  padding: "24px",
};
const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "20px",
};

const modalTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "24px",
};

const modalDescriptionStyle = {
  marginTop: "6px",
  color: "#64748b",
};

const closeButtonStyle = {
  width: "40px",
  height: "40px",
  border: "none",
  borderRadius: "8px",
  background: "#e2e8f0",
  cursor: "pointer",
  fontSize: "24px",
};

const paginationStyle = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "12px",
  marginTop: "20px",
};

const paginationButtonStyle = {
  minHeight: "40px",
  padding: "8px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  cursor: "pointer",
};

const paginationInfoStyle = {
  fontWeight: "700",
  color: "#475569",
};

const pendingCardsGridStyle = {
  display: "grid",
  gap: "8px",

  width: "100%",
  minWidth: 0,
};
const pendingRequestCardStyle = {
  display: "flex",
  flexDirection: "column" as const,

  minWidth: 0,

  boxSizing: "border-box" as const,

  border: "1px solid #d8e0eb",
  borderRadius: "8px",

  background: "#ffffff",

  boxShadow:
    "0 3px 10px rgba(15, 23, 42, 0.06)",

  cursor: "pointer",

  transition:
    "border-color 160ms ease, box-shadow 160ms ease",
};
const pendingRequestCardHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "8px",

  padding: "0 0 6px",

  borderBottom:
    "1px solid #e2e8f0",
};
const requestLabelStyle = {
  display: "block",

  marginBottom: "1px",

  color: "#64748b",

  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.8px",

  textTransform:
    "uppercase" as const,
};

const requestNumberStyle = {
  display: "block",

  color: "#102957",

  fontWeight: "800",
  lineHeight: 1.1,
};

const requestLocationGridStyle = {
  display: "grid",

  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",

  columnGap: "14px",
  rowGap: "2px",

  minWidth: 0,
};
const requestInformationStyle = {
  minWidth: 0,

  padding: "4px 8px",

  boxSizing: "border-box" as const,

  borderBottom:
    "1px solid #e2e8f0",

  background: "#ffffff",

  color: "#102957",

  fontSize: "11px",
  lineHeight: 1.15,

  overflowWrap:
    "anywhere" as const,
};

const requestInformationLabelStyle = {
  display: "block",

  marginBottom: "2px",

  color: "#64748b",

  fontSize: "12px",
  fontWeight: "800",

  letterSpacing: "0.5px",

  textTransform:
    "uppercase" as const,
};


const requestMaterialNumberStyle = {
  display: "block",

  color: "#102957",

  fontSize: "14px",
  fontWeight: "800",

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const requestMaterialDescriptionStyle = {
  display: "block",

  marginTop: "3px",

  color: "#64748b",

  fontSize: "11px",

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const requestQuantityStyle = {
  minWidth: "36px",

  padding: "4px 7px",

  borderRadius: "4px",

  background: "#edf2f7",
  color: "#102957",

  fontSize: "12px",
  fontWeight: "800",

  textAlign: "center" as const,
};

const requestCardFooterStyle = {
  display: "grid",

  gridTemplateColumns:
    "auto 1fr auto",

  alignItems: "center",
  gap: "10px",

  marginTop: "auto",
  paddingTop: "8px",

  borderTop:
    "1px solid #e2e8f0",
};
const requestTotalStyle = {
  display: "block",

  color: "#102957",

  fontWeight: "800",
  lineHeight: 1.1,
};

const requestOpenButtonStyle = {
  minHeight: "32px",

  padding: "6px 12px",

  border: "1px solid #102957",
  borderRadius: "5px",

  background:
    "linear-gradient(180deg, #102957 0%, #0b2148 100%)",

  color: "#ffffff",

  fontSize: "11px",
  fontWeight: "800",

  whiteSpace: "nowrap" as const,

  cursor: "pointer",
};

const additionalMaterialsStyle = {
  color: "#1d4ed8",
  fontSize: "11px",
  fontWeight: "800",
  textAlign: "center" as const,
};

const pendingHeaderControlsStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  flexWrap: "wrap" as const,
  gap: "10px",
};

const cardSizeControlStyle = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
};

const cardSizeLabelStyle = {
  color: "#64748b",

  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "0.5px",
  textTransform:
    "uppercase" as const,
};

const cardSizeSelectStyle = {
  minHeight: "36px",

  padding: "7px 30px 7px 10px",

  border: "1px solid #cbd5e1",
  borderRadius: "7px",

  background: "#ffffff",
  color: "#102957",

  fontSize: "12px",
  fontWeight: "700",

  cursor: "pointer",
  outline: "none",
};

const requestMaterialsStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "2px",

  minWidth: 0,

  padding: "5px 7px",

  boxSizing: "border-box" as const,

  border: "1px solid #d8e0eb",
  borderRadius: "6px",

  background: "#f8fafc",
};

const requestMaterialRowStyle = {
  display: "flex",

  minWidth: 0,

  padding: "3px 5px",

  borderRadius: "4px",

  background: "#ffffff",
};

const requestMaterialContentStyle = {
  width: "100%",
  minWidth: 0,

  display: "flex",
  flexDirection: "column" as const,
  gap: "5px",
};

const requestMaterialHeadingStyle = {
  minWidth: 0,

  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
};

const requestMaterialTypeStyle = {
  flexShrink: 0,

  padding: "3px 7px",

  border: "1px solid #cbd5e1",
  borderRadius: "4px",

  background: "#edf2f7",
  color: "#102957",

  fontSize: "11px",
  fontWeight: "800",
};

const requestMaterialBottomStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",

  marginTop: "2px",
};

const requestMaterialStationStyle = {
  minWidth: 0,

  color: "#475569",

  fontSize: "12px",
  fontWeight: "500",

  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const requestPendingQuantityStyle = {
  flexShrink: 0,

  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const requestPendingQuantityLabelStyle = {
  color: "#64748b",

  fontSize: "10px",
  fontWeight: "700",

  textTransform:
    "uppercase" as const,
};
