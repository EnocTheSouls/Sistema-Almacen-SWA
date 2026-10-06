import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import { Layout } from "../components/Layout";

import {
  NuevaSolicitudModal,
} from "../components/solicitudes/NuevaSolicitudModal";

import {
  SolicitudDetalleModal,
} from "../components/solicitudes/SolicitudDetalleModal";

import {
  SolicitudesTable,
} from "../components/solicitudes/SolicitudesTable";

import {
  obtenerSolicitudes,
} from "../services/solicitudService";

import type {
  Solicitud,
} from "../types/solicitud";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

export function SolicitudesPage() {
  const currentUser =
    obtenerUsuarioActual();

  const rolActual =
    currentUser?.role
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      ) ?? "";

  const esProduccion =
    rolActual === "PRODUCCION";

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
    mostrarNuevaSolicitud,
    setMostrarNuevaSolicitud,
  ] = useState(false);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState("Todos");

  // Detecta la vista móvil para ajustar la página.
  const [
    modoMovil,
    setModoMovil,
  ] = useState(
    () =>
      window.matchMedia(
        "(max-width: 768px)"
      ).matches
  );

  // Carga todas las solicitudes registradas.
  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      setErrorCarga("");

      const solicitudesData =
        await obtenerSolicitudes();

      setSolicitudes(
        solicitudesData
      );
    } catch (error) {
      console.error(
        "Error al cargar solicitudes:",
        error
      );

      setErrorCarga(
        obtenerMensajeError(
          error,
          "No se pudieron cargar las solicitudes."
        )
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);


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

  // Obtiene los estados que existen actualmente.
  // Obtiene los estados que existen actualmente.
  const estadosDisponibles =
    useMemo(() => {
      const estados =
        solicitudes
          .map(
            (solicitud) =>
              solicitud.nombreEstado
          )
          .filter(
            (estado) =>
              Boolean(estado)
          );

      return [
        "Todos",
        ...Array.from(
          new Set(estados)
        ),
      ];
    }, [solicitudes]);

  // Filtra solicitudes por texto y estado.
  const solicitudesFiltradas =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return solicitudes.filter(
        (solicitud) => {
          const coincideEstado =
            filtroEstado === "Todos" ||
            solicitud.nombreEstado ===
            filtroEstado;

          if (!coincideEstado) {
            return false;
          }

          if (!texto) {
            return true;
          }

          const identificador =
            String(
              solicitud.idSolicitud
            );

          const proyecto =
            solicitud.nombreProyecto
              ?.toLowerCase() ?? "";

          const familia =
            solicitud.nombreFamilia
              ?.toLowerCase() ?? "";

          const estacion =
            solicitud.nombreEstacion
              ?.toLowerCase() ?? "";

          const solicitante =
            solicitud
              .nombreUsuarioSolicitud
              ?.toLowerCase() ?? "";

          const contieneMaterial =
            solicitud.materiales?.some(
              (material) => {
                const numeroParte =
                  material
                    .numeroParteMaterial
                    ?.toLowerCase() ?? "";

                const descripcion =
                  material
                    .descripcionMaterial
                    ?.toLowerCase() ?? "";

                return (
                  numeroParte.includes(
                    texto
                  ) ||
                  descripcion.includes(
                    texto
                  )
                );
              }
            ) ?? false;

          return (
            identificador.includes(
              texto
            ) ||
            proyecto.includes(texto) ||
            familia.includes(texto) ||
            estacion.includes(texto) ||
            solicitante.includes(
              texto
            ) ||
            contieneMaterial
          );
        }
      );
    }, [
      solicitudes,
      busqueda,
      filtroEstado,
    ]);
  // Peticiones activas que se muestran como tarjetas operativas.
  const peticionesActivas =
    useMemo(() => {
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
          ) =>
            new Date(
              solicitudA.fechaSolicitud
            ).getTime() -
            new Date(
              solicitudB.fechaSolicitud
            ).getTime()
        )
        .slice(0, 8);
    }, [solicitudes]);

  const abrirNuevaSolicitud = () => {
    setMensajeExito("");
    setErrorCarga("");
    setMostrarNuevaSolicitud(true);
  };

  const cerrarNuevaSolicitud = () => {
    setMostrarNuevaSolicitud(false);
  };

  // Agrega la solicitud creada al principio de la tabla.
  const manejarSolicitudCreada = (
    solicitud: Solicitud
  ) => {
    setSolicitudes(
      (solicitudesActuales) => [
        solicitud,
        ...solicitudesActuales,
      ]
    );

    setMostrarNuevaSolicitud(false);

    setMensajeExito(
      `La solicitud #${solicitud.idSolicitud} se registró correctamente con estado ${solicitud.nombreEstado}.`
    );
  };

  const abrirDetalle = (
    solicitud: Solicitud
  ) => {
    setSolicitudSeleccionada(
      solicitud
    );
  };

  const cerrarDetalle = () => {
    setSolicitudSeleccionada(
      null
    );
  };

  // Actualiza la solicitud en la tabla después de cambiar su estado.
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

    setMensajeExito(mensaje);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEstado("Todos");
  };

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section
          style={{
            ...cardStyle,
            padding:
              modoMovil
                ? "16px"
                : "30px",
            borderRadius:
              modoMovil
                ? "12px"
                : "16px",
          }}
        >
          <div
            style={{
              ...headerStyle,

              flexDirection:
                modoMovil
                  ? "column"
                  : "row",

              alignItems:
                modoMovil
                  ? "stretch"
                  : "flex-start",

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
                      ? "24px"
                      : "30px",
                }}
              >
                Requisiciones
              </h1>

              <p style={descriptionStyle}>
                Bandeja de solicitudes de material
                enviadas por las líneas de producción.
              </p>
            </div>

            <button
              type="button"
              onClick={
                abrirNuevaSolicitud
              }
              style={{
                ...primaryButtonStyle,

                // En móvil ocupa todo el ancho.
                // En escritorio conserva su tamaño actual.
                width:
                  modoMovil
                    ? "100%"
                    : "auto",

                maxWidth: "100%",

                alignSelf:
                  modoMovil
                    ? "stretch"
                    : "auto",

                boxSizing:
                  "border-box",
              }}
            >
              + Crear nueva
            </button>
          </div>


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
          {!esProduccion && (
            <div style={summaryGridStyle}>
              <Resumen
                etiqueta="Total"
                cantidad={
                  solicitudes.length
                }
                color="rgb(29, 78, 216)"
                fondo="#eff6ff"
              />

              <Resumen
                etiqueta="Pendientes"
                cantidad={
                  solicitudes.filter(
                    (solicitud) =>
                      solicitud.nombreEstado
                        .toLowerCase() ===
                      "pendiente"
                  ).length
                }
                color="rgb(146, 14, 14)"
                fondo="rgba(254, 199, 199)"
              />

              <Resumen
                etiqueta="En proceso"
                cantidad={
                  solicitudes.filter(
                    (solicitud) => {
                      const estado =
                        solicitud.nombreEstado
                          .toLowerCase();

                      return (
                        estado ===
                        "en surtido" ||
                        estado ===
                        "parcial" ||
                        estado ===
                        "faltante"
                      );
                    }
                  ).length
                }
                color="rgb(146,14,14)"
                fondo="rgb(254,243,199)"
              />

              <Resumen
                etiqueta="Surtidas"
                cantidad={
                  solicitudes.filter(
                    (solicitud) => {
                      const estado =
                        solicitud.nombreEstado
                          .toLowerCase();

                      return (
                        estado ===
                        "surtida"
                      );
                    }
                  ).length
                }
                color="#166534"
                fondo="#dcfce7"
              />
            </div>
          )}
          {!esProduccion && (

            <section style={activeRequestsSectionStyle}>
              <div
                style={{
                  ...activeRequestsHeaderStyle,

                  flexDirection:
                    modoMovil
                      ? "column"
                      : "row",

                  alignItems:
                    modoMovil
                      ? "stretch"
                      : "center",
                }}
              >
                <div>
                  <h2 style={activeRequestsTitleStyle}>
                     Pendientes
                  </h2>

                  <p style={activeRequestsDescriptionStyle}>
                    Selecciona para atender la petición.
                  </p>
                </div>

                <span style={activeRequestsCounterStyle}>
                  {peticionesActivas.length}{" "}
                  {peticionesActivas.length === 1
                    ? "petición activa"
                    : "peticiones activas"}
                </span>
              </div>

              {peticionesActivas.length === 0 ? (
                <div style={activeRequestsEmptyStyle}>
                  No hay pendientes por atender.
                </div>
              ) : (
                <div
                  style={{
                    ...activeRequestsGridStyle,

                    gridTemplateColumns:
                      modoMovil
                        ? "minmax(0, 1fr)"
                        : "repeat(auto-fit, minmax(280px, 1fr))",
                  }}
                >
                  {peticionesActivas.map(
                    (solicitud, indice) => {
                      const materialesPendientes =
                        (
                          solicitud.materiales ?? []
                        ).filter(
                          (material) =>
                            material.cantidadSurtida <
                            material.cantidadSolicitada
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
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            abrirDetalle(
                              solicitud
                            )
                          }
                          onKeyDown={(event) => {
                            if (
                              event.key === "Enter" ||
                              event.key === " "
                            ) {
                              event.preventDefault();

                              abrirDetalle(
                                solicitud
                              );
                            }
                          }}
                          style={{
                            ...activeRequestCardStyle,

                            borderLeft:
                              esParcial
                                ? "6px solid #d97706"
                                : "6px solid #dc2626",
                          }}
                        >
                          <div style={activeRequestCardHeaderStyle}>
                            <div>
                              <span style={activeRequestPositionStyle}>
                                Petición {indice + 1}
                              </span>

                              <strong style={activeRequestNumberStyle}>
                                Solicitud #{solicitud.idSolicitud}
                              </strong>
                            </div>

                            <span
                              style={{
                                ...activeRequestStatusStyle,

                                background:
                                  esParcial
                                    ? "#fef3c7"
                                    : "#fee2e2",

                                color:
                                  esParcial
                                    ? "#92400e"
                                    : "#991b1b",
                              }}
                            >
                              {solicitud.nombreEstado}
                            </span>
                          </div>

                          <div style={activeRequestInfoGridStyle}>
                            <div style={activeRequestInfoStyle}>
                              <span style={activeRequestLabelStyle}>
                                Proyecto
                              </span>

                              <strong>
                                {solicitud.nombreProyecto ??
                                  "Sin proyecto"}
                              </strong>
                            </div>

                            <div style={activeRequestInfoStyle}>
                              <span style={activeRequestLabelStyle}>
                                Familia
                              </span>

                              <strong>
                                {solicitud.nombreFamilia ??
                                  "Sin familia"}
                              </strong>
                            </div>

                            <div style={activeRequestInfoStyle}>
                              <span style={activeRequestLabelStyle}>
                                Estación
                              </span>

                              <strong>
                                {solicitud.nombreEstacion ??
                                  materialesPendientes[0]
                                    ?.nombreEstacion ??
                                  "Sin estación"}
                              </strong>
                            </div>

                            <div style={activeRequestInfoStyle}>
                              <span style={activeRequestLabelStyle}>
                                Materiales pendientes
                              </span>

                              <strong>
                                {materialesPendientes.length}
                              </strong>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();

                              abrirDetalle(
                                solicitud
                              );
                            }}
                            style={activeRequestOpenButtonStyle}
                          >
                            Abrir
                          </button>
                        </article>
                      );
                    }
                  )}
                </div>
              )}
            </section>
          )}
          {esProduccion && (
            <section style={productionActiveSectionStyle}>
              <div
                style={{
                  ...resultsHeaderStyle,

                  flexDirection:
                    modoMovil
                      ? "column"
                      : "row",

                  alignItems:
                    modoMovil
                      ? "stretch"
                      : "center",
                }}
              >
                <div>
                  <h2 style={sectionTitleStyle}>
                    Peticiones activas
                  </h2>

                  <p style={productionDescriptionStyle}>
                    Consulta el estado de las Requisiciones
                    pendientes y parciales.
                  </p>
                </div>

                <span style={activeRequestsCounterStyle}>
                  {peticionesActivas.length}{" "}
                  {peticionesActivas.length === 1
                    ? "petición activa"
                    : "peticiones activas"}
                </span>
              </div>

              <SolicitudesTable
                solicitudes={
                  peticionesActivas
                }
                cargando={cargando}
                onSeleccionar={
                  abrirDetalle
                }
              />
            </section>
          )}
          {!esProduccion && (
            <div
              style={{
                ...filtersStyle,

                gridTemplateColumns:
                  modoMovil
                    ? "minmax(0, 1fr)"
                    : "minmax(250px, 2fr) minmax(180px, 1fr) auto",

                padding:
                  modoMovil
                    ? "12px"
                    : "17px",

                gap:
                  modoMovil
                    ? "12px"
                    : "13px",

                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >

              <div style={statusGroupStyle}>
                <label
                  htmlFor="filtroEstado"
                  style={labelStyle}
                >
                  Estado
                </label>

                <select
                  id="filtroEstado"
                  value={filtroEstado}
                  onChange={(event) =>
                    setFiltroEstado(
                      event.target.value
                    )
                  }
                  style={inputStyle}
                >
                  {estadosDisponibles.map(
                    (estado) => (
                      <option
                        key={estado}
                        value={estado}
                      >
                        {estado}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="button"
                onClick={limpiarFiltros}
                style={secondaryButtonStyle}
              >
                Limpiar filtros
              </button>
            </div>
          )}
          {!esProduccion && (
            <>
              <div style={resultsHeaderStyle}>
                <h2 style={sectionTitleStyle}>
                  Recibidas
                </h2>

                <span style={counterStyle}>
                  {
                    solicitudesFiltradas.length
                  }{" "}
                  {solicitudesFiltradas.length === 1
                    ? "solicitud"
                    : "solicitudes"}
                </span>
              </div>

              <SolicitudesTable
                solicitudes={
                  solicitudesFiltradas
                }
                cargando={cargando}
                onSeleccionar={
                  abrirDetalle
                }
              />
            </>
          )}

        </section>
      </div>

      {mostrarNuevaSolicitud && (
        <NuevaSolicitudModal
          onCerrar={
            cerrarNuevaSolicitud
          }
          onSolicitudCreada={
            manejarSolicitudCreada
          }
        />
      )}

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

interface ResumenProps {
  etiqueta: string;
  cantidad: number;
  color: string;
  fondo: string;
}

function Resumen({
  etiqueta,
  cantidad,
  color,
  fondo,
}: ResumenProps) {
  return (
    <div
      style={{
        ...summaryCardStyle,
        background: fondo,
      }}
    >
      <span
        style={{
          ...summaryNumberStyle,
          color,
        }}
      >
        {cantidad}
      </span>

      <span
        style={{
          ...summaryLabelStyle,
          color,
        }}
      >
        {etiqueta}
      </span>
    </div>
  );
}

function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string
) {
  if (axios.isAxiosError(error)) {
    const mensajeBackend =
      error.response?.data?.mensaje;

    if (
      typeof mensajeBackend ===
      "string"
    ) {
      return mensajeBackend;
    }

    const detalleBackend =
      error.response?.data?.detail;

    if (
      typeof detalleBackend ===
      "string"
    ) {
      return detalleBackend;
    }
  }

  return mensajePredeterminado;
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1300px",
  margin: "0 auto",
};

const cardStyle = {
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
  marginBottom: "24px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "30px",
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  minHeight: "44px",
  padding: "11px 18px",
  border: "none",
  borderRadius: "9px",
  background: "#102957",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const secondaryButtonStyle = {
  minHeight: "44px",
  alignSelf: "flex-end",
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const summaryGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(145px, 1fr))",
  gap: "12px",
  marginBottom: "23px",
};

const summaryCardStyle = {
  minHeight: "80px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "14px 17px",
  borderRadius: "10px",
  textAlign: "center" as const,
};

const summaryNumberStyle = {
  display: "block",
  fontSize: "25px",
  fontWeight: "800",
  lineHeight: 1,
  letterSpacing: "-0.5px",


};

const summaryLabelStyle = {
  display: "block",
  marginTop: "12px",
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: 1.2,
  letterSpacing: "0.2px",
  textAlign: "center" as const,
};

const filtersStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(250px, 2fr) minmax(180px, 1fr) auto",
  alignItems: "end",
  gap: "13px",
  marginBottom: "25px",
  padding: "17px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#f8fafc",
  width: "100%",
  boxSizing: "border-box" as const,
};

const statusGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const labelStyle = {
  color: "#17335f",
  fontSize: "13px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "42px",
  boxSizing: "border-box" as const,
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "14px",
  outline: "none",
};

const resultsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  marginBottom: "14px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "19px",
};

const counterStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "700",
};

const errorStyle = {
  marginBottom: "18px",
  padding: "14px 16px",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "14px",
};

const successStyle = {
  marginBottom: "18px",
  padding: "14px 16px",
  border: "1px solid #bbf7d0",
  borderRadius: "10px",
  background: "#f0fdf4",
  color: "#166534",
  fontSize: "14px",
  fontWeight: "700",
};

const activeRequestsSectionStyle = {
  marginBottom: "24px",
  padding: "18px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  background: "#f8fafc",
};

const activeRequestsHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  marginBottom: "16px",
};

const activeRequestsTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "21px",
};

const activeRequestsDescriptionStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.4,
};

const activeRequestsCounterStyle = {
  alignSelf: "flex-start",
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#b91c1c",
  fontSize: "12px",
  fontWeight: "800",
  whiteSpace: "nowrap" as const,
};

const activeRequestsGridStyle = {
  display: "grid",
  gap: "13px",
  width: "100%",
};

const activeRequestCardStyle = {
  minWidth: 0,
  display: "flex",
  flexDirection: "column" as const,
  gap: "14px",
  padding: "16px",
  border: "1px solid #d8e0eb",
  borderRadius: "11px",
  background: "#ffffff",
  boxShadow:
    "0 4px 12px rgba(15, 23, 42, 0.08)",
  cursor: "pointer",
  boxSizing: "border-box" as const,
};

const activeRequestCardHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "12px",
  paddingBottom: "11px",
  borderBottom: "1px solid #e2e8f0",
};

const activeRequestPositionStyle = {
  display: "block",
  marginBottom: "3px",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const activeRequestNumberStyle = {
  display: "block",
  color: "#102957",
  fontSize: "18px",
  fontWeight: "900",
};

const activeRequestStatusStyle = {
  flexShrink: 0,
  padding: "6px 10px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "800",
};

const activeRequestInfoGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "10px",
};

const activeRequestInfoStyle = {
  minWidth: 0,
  padding: "9px 10px",
  borderRadius: "8px",
  background: "#f8fafc",
  color: "#102957",
  overflowWrap: "anywhere" as const,
};

const activeRequestLabelStyle = {
  display: "block",
  marginBottom: "4px",
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "800",
  textTransform: "uppercase" as const,
};

const activeRequestOpenButtonStyle = {
  width: "40%",
  minWidth: "120px",
  maxWidth: "170px",
  minHeight: "36px",

  // Empuja el botón hacia la derecha.
  marginLeft: "auto",
  marginRight: 0,

  padding: "7px 12px",
  border: "1px solid #102957",
  borderRadius: "8px",
  background: "#102957",
  color: "#ffffff",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  display: "block",
};

const activeRequestsEmptyStyle = {
  padding: "22px",
  border: "1px dashed #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#64748b",
  textAlign: "center" as const,
};



// Contenedor de la tabla de peticiones activas
// visible únicamente para Producción.
const productionActiveSectionStyle = {
  marginBottom: "24px",
  padding: "18px",
  border: "1px solid #cbd5e1",
  borderRadius: "12px",
  background: "#f8fafc",
};

// Texto descriptivo debajo de Peticiones activas.
const productionDescriptionStyle = {
  margin: "5px 0 0",
  color: "#64748b",
  fontSize: "13px",
  lineHeight: 1.4,
};