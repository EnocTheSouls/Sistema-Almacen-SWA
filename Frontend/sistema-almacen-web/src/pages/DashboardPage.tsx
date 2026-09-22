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

const configuracionInicial: ConfiguracionDashboard = {
  actualizacionAutomatica: false,
  segundosActualizacion: 20,
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
        ] = await Promise.all([
          obtenerDashboard(),
          obtenerSolicitudes(),
        ]);

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

  // Actualiza automáticamente el Dashboard.
  useEffect(() => {
    if (
      !configuracion.actualizacionAutomatica
    ) {
      return;
    }

    const segundos =
      Math.max(
        5,
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



  const solicitudesSurtidas =
    useMemo(() => {
      return solicitudes.filter(
        (solicitud) =>
          solicitud.nombreEstado
            .toLowerCase() ===
          "surtida"
      ).length;
    }, [solicitudes]);

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

  const activarPantallaCompleta =
    async () => {
      try {
        if (
          !document.fullscreenElement
        ) {
          await document.documentElement
            .requestFullscreen();

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

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section
          style={
            dashboardContainerStyle
          }
        >
          <header style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
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
              style={
                headerActionsStyle
              }
            >
              <div style={clockStyle}>
                <strong style={timeStyle}>
                  {fechaHoraActual.toLocaleTimeString(
                    "es-MX",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    }
                  )}
                </strong>

                <span style={dateStyle}>
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
                style={iconButtonStyle}
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
                title="Pantalla completa"
                aria-label="Pantalla completa"
                style={iconButtonStyle}
              >
                ⛶
              </button>
            </div>
          </header>
          {mensajeExito && (
            <div style={successStyle}>
              {mensajeExito}
            </div>
          )}

          {errorCarga && (
            <div style={errorStyle}>
              {errorCarga}
            </div>
          )}

          {cargando ? (
            <div style={loadingStyle}>
              Cargando Dashboard...
            </div>
          ) : (
            <>
              <div style={kpiGridStyle}>
                <KpiCard
                  titulo="Pendientes"
                  cantidad={
                    (dashboard?.pendientes ?? 0) +
                    (dashboard?.parciales ?? 0)
                  }
                  color="#ffffff"
                  fondo="#ea580c"
                  descripcion="Solicitudes esperando atención"
                />

                <KpiCard
                  titulo="Surtidas"
                  cantidad={
                    solicitudesSurtidas
                  }
                  color="#ffffff"
                  fondo="#16a34a"
                  descripcion="Material descontado y preparado"
                />

                <KpiCard
                  titulo="Total"
                  cantidad={
                    solicitudes.length
                  }
                  color="#ffffff"
                  fondo="#2563eb"
                  descripcion="Solicitudes registradas"
                />
              </div>

              <section
                style={
                  pendingSectionStyle
                }
              >
                <div
                  style={
                    pendingHeaderStyle
                  }
                >
                  <div>
                    <h2
                      style={
                        sectionTitleStyle
                      }
                    >
                      Solicitudes pendientes
                    </h2>

                    <p
                      style={
                        sectionDescriptionStyle
                      }
                    >
                      Las solicitudes más
                      antiguas aparecen primero.
                    </p>
                  </div>

                  <div
                    style={
                      pendingCounterStyle
                    }
                  >
                    {(dashboard?.pendientes ?? 0) +
                      (dashboard?.parciales ?? 0)}{" "}
                    pendientes
                  </div>
                </div>

                {solicitudesPendientes.length ===
                  0 ? (
                  <div style={emptyStyle}>
                    No hay solicitudes
                    pendientes.
                  </div>
                ) : (
                  <div
                    style={
                      tableContainerStyle
                    }
                  >
                    <table
                      style={tableStyle}
                    >
                      <thead>
                        <tr style={tableHeaderStyle}>
                          <th style={thStyle}>
                            Solicitud
                          </th>

                          <th style={thStyle}>
                            Espera
                          </th>

                          <th style={thStyle}>
                            Proyecto
                          </th>

                          <th style={thStyle}>
                            Familia
                          </th>

                          <th style={thStyle}>
                            Estación
                          </th>

                          <th style={thStyle}>
                            Material
                          </th>

                          <th style={thStyle}>
                            Cantidad pendiente
                          </th>

                          <th style={thStyle}>
                            Estado
                          </th>

                          <th
                            style={{
                              ...thStyle,
                              textAlign: "right",
                            }}
                          >
                            Acción
                          </th>
                        </tr>
                      </thead>

                      <tbody>
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
                            // Materiales que todavía tienen cantidad pendiente.
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

                                    return prioridadA - prioridadB;
                                  }
                                );

                            // Primero muestra un material sin surtir.
                            // Después muestra uno parcialmente surtido.
                            const materialPrincipal =
                              materialesPendientes[0];

                            const cantidadPendiente =
                              materialPrincipal
                                ? Math.max(
                                  0,
                                  materialPrincipal
                                    .cantidadSolicitada -
                                  materialPrincipal
                                    .cantidadSurtida
                                )
                                : 0;

                            const materialesAdicionales =
                              Math.max(
                                0,
                                materialesPendientes.length - 1
                              );


                            return (
                              <tr
                                key={
                                  solicitud.idSolicitud
                                }
                                style={{
                                  ...pendingRowStyle,

                                  background:
                                    alerta.fondo,

                                  borderLeft:
                                    `6px solid ${alerta.color}`,
                                }}
                                onClick={() =>
                                  abrirDetalle(
                                    solicitud
                                  )
                                }
                              >
                                <td style={tdStyle}>
                                  <strong>
                                    #
                                    {
                                      solicitud.idSolicitud
                                    }
                                  </strong>
                                </td>

                                <td style={tdStyle}>
                                  <span
                                    style={{
                                      ...waitingBadgeStyle,

                                      background:
                                        alerta.color,
                                    }}
                                  >
                                    {formatearTiempoEspera(
                                      minutos
                                    )}
                                  </span>
                                </td>

                                <td style={tdStyle}>
                                  <div
                                    style={shortTextStyle}
                                    title={solicitud.nombreProyecto}
                                  >
                                    {solicitud.nombreProyecto}
                                  </div>
                                </td>

                                <td style={tdStyle}>
                                  <div
                                    style={familyTextStyle}
                                    title={solicitud.nombreFamilia}
                                  >
                                    {solicitud.nombreFamilia}
                                  </div>
                                </td>
                                <td style={tdStyle}>
                                  <div
                                    style={stationTextStyle}
                                    title={solicitud.nombreEstacion}
                                  >
                                    <strong>
                                      {solicitud.nombreEstacion}
                                    </strong>
                                  </div>
                                </td>

                                <td style={tdStyle}>
                                  <div style={materialCellStyle}>
                                    <strong
                                      title={
                                        materialPrincipal
                                          ?.numeroParteMaterial ??
                                        "Sin material"
                                      }
                                    >
                                      {materialPrincipal
                                        ?.numeroParteMaterial ??
                                        "N/A"}
                                    </strong>

                                    <span
                                      style={materialDescriptionStyle}
                                      title={
                                        materialPrincipal
                                          ?.descripcionMaterial ??
                                        "Sin descripción"
                                      }
                                    >
                                      {materialPrincipal
                                        ?.descripcionMaterial ??
                                        "Sin descripción"}
                                    </span>
                                    {materialesAdicionales > 0 && (
                                      <span style={additionalBadgeStyle}>
                                        +{materialesAdicionales} pendientes
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td style={tdStyle}>
                                  <strong>
                                    {cantidadPendiente}
                                  </strong>
                                </td>
                                <td style={tdStyle}>
                                  <span
                                    style={
                                      solicitud.nombreEstado
                                        .trim()
                                        .toLowerCase() === "parcial"
                                        ? partialStatusStyle
                                        : pendingStatusStyle
                                    }
                                  >
                                    {solicitud.nombreEstado}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    ...tdStyle,

                                    textAlign:
                                      "right",
                                  }}
                                >
                                  <button
                                    type="button"
                                    onClick={(
                                      event
                                    ) => {
                                      event.stopPropagation();

                                      abrirDetalle(
                                        solicitud
                                      );
                                    }}
                                    style={
                                      openButtonStyle
                                    }
                                  >
                                    Abrir
                                  </button>
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

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
              </section>
            </>
          )}
        </section>
      </div>

      {solicitudSeleccionada && (
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
      )}
    </Layout>
  );
}

interface KpiCardProps {
  titulo: string;
  cantidad: number;
  color: string;
  fondo: string;
  descripcion: string;
}

function KpiCard({
  titulo,
  cantidad,
  color,
  fondo,
  descripcion,
}: KpiCardProps) {
  return (
    <article
      style={{
        ...kpiCardStyle,
        background: fondo,
      }}
    >
      <strong
        style={{
          ...kpiNumberStyle,
          color,
        }}
      >
        {cantidad}
      </strong>

      <h3
        style={{
          ...kpiTitleStyle,
          color,
        }}
      >
        {titulo}
      </h3>

      <span
        style={{
          ...kpiDescriptionStyle,
          color,
        }}
      >
        {descripcion}
      </span>
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
  margin: "0 auto",
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
  border: "1px solid #e2e8f0",
  borderRadius: "12px",
  background: "#ffffff",
};

const pendingHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  marginBottom: "16px",
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
  background: "#ffedd5",
  color: "#c2410c",
  fontWeight: "800",
};

const tableContainerStyle = {
  overflowX: "auto" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
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

const pendingRowStyle = {
  cursor: "pointer",
};

const waitingBadgeStyle = {
  display: "inline-block",
  minWidth: "74px",
  padding: "7px 10px",
  borderRadius: "999px",
  color: "#ffffff",
  fontSize: "12px",
  fontWeight: "800",
  textAlign: "center" as const,
};

const openButtonStyle = {
  padding: "8px 14px",
  border: "none",
  borderRadius: "7px",
  background: "#102957",
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
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

const shortTextStyle = {
  maxWidth: "105px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const familyTextStyle = {
  maxWidth: "160px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};


const additionalBadgeStyle = {
  display: "inline-block",
  marginTop: "4px",
  padding: "3px 7px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "11px",
  fontWeight: "800",
};
const stationTextStyle = {
  maxWidth: "90px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
};

const materialCellStyle = {
  minWidth: "190px",
  maxWidth: "260px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "3px",
};

const materialDescriptionStyle = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap" as const,
  color: "#64748b",
  fontSize: "12px",
}; const pendingStatusStyle = {
  display: "inline-block",
  minWidth: "72px",
  padding: "6px 10px",
  borderRadius: "999px",
  background: "#ffedd5",
  color: "#c2410c",
  fontSize: "12px",
  fontWeight: "800",
  textAlign: "center" as const,
};

const partialStatusStyle = {
  ...pendingStatusStyle,
  background: "#fef3c7",
  color: "#92400e",
};