import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import axios from "axios";

import {
  obtenerProyectos,
} from "../../services/proyectoService";

import {
  obtenerFamilias,
} from "../../services/familiaService";

import {
  obtenerEstaciones,
} from "../../services/estacionService";

import {
  obtenerMateriales,
} from "../../services/materialService";

import {
  crearSolicitud,
} from "../../services/solicitudService";

import type {
  Proyecto,
} from "../../types/proyecto";

import type {
  Familia,
} from "../../types/familia";

import type {
  Estacion,
} from "../../types/estacion";

import type {
  MaterialCatalogo,
} from "../../types/material";

import type {
  Solicitud,
} from "../../types/solicitud";

interface NuevaSolicitudModalProps {
  onCerrar: () => void;

  onSolicitudCreada: (
    solicitud: Solicitud
  ) => void;
}

interface MaterialSeleccionado {
  idMaterial: number;
  numeroParte: string;
  descripcion: string;
  cantidad: string;
}

export function NuevaSolicitudModal({
  onCerrar,
  onSolicitudCreada,
}: NuevaSolicitudModalProps) {
  const [proyectos, setProyectos] =
    useState<Proyecto[]>([]);

  const [familias, setFamilias] =
    useState<Familia[]>([]);

  const [estaciones, setEstaciones] =
    useState<Estacion[]>([]);

  const [
    catalogoMateriales,
    setCatalogoMateriales,
  ] = useState<MaterialCatalogo[]>([]);

  const [
    idProyecto,
    setIdProyecto,
  ] = useState(0);

  const [
    idFamilia,
    setIdFamilia,
  ] = useState(0);

  const [
    idEstacion,
    setIdEstacion,
  ] = useState(0);

  const [
    busquedaMaterial,
    setBusquedaMaterial,
  ] = useState("");

  const [
    materiales,
    setMateriales,
  ] = useState<MaterialSeleccionado[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] =
    useState("");

  // Carga los catálogos usados por la solicitud.
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setCargando(true);
        setError("");

        const [
          proyectosData,
          familiasData,
          estacionesData,
          materialesData,
        ] = await Promise.all([
          obtenerProyectos(),
          obtenerFamilias(),
          obtenerEstaciones(),
          obtenerMateriales(),
        ]);

        setProyectos(proyectosData);
        setFamilias(familiasData);
        setEstaciones(estacionesData);
        setCatalogoMateriales(
          materialesData
        );
      } catch (errorCarga) {
        console.error(
          "Error al cargar catálogos:",
          errorCarga
        );

        setError(
          "No se pudieron cargar los catálogos."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogos();
  }, []);

  const proyectosDisponibles =
    useMemo(
      () =>
        proyectos.filter(
          (proyecto) =>
            proyecto.activo
        ),
      [proyectos]
    );

  const familiasDisponibles =
    useMemo(
      () =>
        familias.filter(
          (familia) =>
            familia.activo &&
            familia.idProyecto ===
              idProyecto
        ),
      [
        familias,
        idProyecto,
      ]
    );

  const estacionesDisponibles =
    useMemo(
      () =>
        estaciones.filter(
          (estacion) =>
            estacion.activo &&
            estacion.idFamilia ===
              idFamilia
        ),
      [
        estaciones,
        idFamilia,
      ]
    );

  const materialesEncontrados =
    useMemo(() => {
      const termino =
        busquedaMaterial
          .trim()
          .toLowerCase();

      if (!termino) {
        return [];
      }

      return catalogoMateriales
        .filter(
          (material) =>
            material.activo
        )
        .filter((material) => {
          const numeroParte =
            material.numeroParteMaterial
              .toLowerCase();

          const descripcion =
            material.descripcion
              .toLowerCase();

          const codigoBarras =
            material.codigoBarras
              ?.toLowerCase() ?? "";

          const serialKits =
            material.serialKits
              ?.toLowerCase() ?? "";

          return (
            numeroParte.includes(
              termino
            ) ||
            descripcion.includes(
              termino
            ) ||
            codigoBarras.includes(
              termino
            ) ||
            serialKits.includes(
              termino
            )
          );
        })
        .slice(0, 8);
    }, [
      busquedaMaterial,
      catalogoMateriales,
    ]);

  const manejarCambioProyecto = (
    nuevoIdProyecto: number
  ) => {
    setIdProyecto(
      nuevoIdProyecto
    );

    setIdFamilia(0);
    setIdEstacion(0);
    setError("");
  };

  const manejarCambioFamilia = (
    nuevoIdFamilia: number
  ) => {
    setIdFamilia(
      nuevoIdFamilia
    );

    setIdEstacion(0);
    setError("");
  };

  const agregarMaterial = (
    material: MaterialCatalogo
  ) => {
    const materialRepetido =
      materiales.some(
        (materialActual) =>
          materialActual.idMaterial ===
          material.idMaterial
      );

    if (materialRepetido) {
      setError(
        `El material ${material.numeroParteMaterial} ya está agregado.`
      );

      return;
    }

    setMateriales(
      (materialesActuales) => [
        ...materialesActuales,
        {
          idMaterial:
            material.idMaterial,

          numeroParte:
            material.numeroParteMaterial,

          descripcion:
            material.descripcion,

          cantidad:
            material.stdPack &&
            material.stdPack > 0
              ? String(
                  material.stdPack
                )
              : "1",
        },
      ]
    );

    setBusquedaMaterial("");
    setError("");
  };

  const cambiarCantidad = (
    idMaterial: number,
    cantidad: string
  ) => {
    setMateriales(
      (materialesActuales) =>
        materialesActuales.map(
          (material) =>
            material.idMaterial ===
            idMaterial
              ? {
                  ...material,
                  cantidad,
                }
              : material
        )
    );
  };

  const quitarMaterial = (
    idMaterial: number
  ) => {
    setMateriales(
      (materialesActuales) =>
        materialesActuales.filter(
          (material) =>
            material.idMaterial !==
            idMaterial
        )
    );

    setError("");
  };

  const obtenerMensajeError = (
    errorSolicitud: unknown
  ) => {
    if (
      axios.isAxiosError(
        errorSolicitud
      )
    ) {
      const mensaje =
        errorSolicitud.response
          ?.data?.mensaje;

      if (
        typeof mensaje === "string"
      ) {
        return mensaje;
      }

      const detalle =
        errorSolicitud.response
          ?.data?.detail;

      if (
        typeof detalle === "string"
      ) {
        return detalle;
      }
    }

    return "No se pudo registrar la solicitud.";
  };

  const guardarSolicitud = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (idProyecto <= 0) {
      setError(
        "Debes seleccionar un proyecto."
      );

      return;
    }

    if (idFamilia <= 0) {
      setError(
        "Debes seleccionar una familia."
      );

      return;
    }

    if (idEstacion <= 0) {
      setError(
        "Debes seleccionar una estación."
      );

      return;
    }

    if (materiales.length === 0) {
      setError(
        "Debes agregar al menos un material."
      );

      return;
    }

    const cantidadInvalida =
      materiales.some(
        (material) => {
          const cantidad =
            Number(
              material.cantidad
            );

          return (
            !Number.isFinite(
              cantidad
            ) ||
            cantidad <= 0
          );
        }
      );

    if (cantidadInvalida) {
      setError(
        "Todas las cantidades deben ser mayores que cero."
      );

      return;
    }

    try {
      setEnviando(true);

      const solicitudCreada =
        await crearSolicitud({
          idProyecto,
          idFamilia,
          idEstacion,
          origenSolicitud:
            "MANUAL",

          materiales:
            materiales.map(
              (material) => ({
                idMaterial:
                  material.idMaterial,

                cantidadSolicitada:
                  Number(
                    material.cantidad
                  ),
              })
            ),
        });

      onSolicitudCreada(
        solicitudCreada
      );
    } catch (errorSolicitud) {
      console.error(
        "Error al crear solicitud:",
        errorSolicitud
      );

      setError(
        obtenerMensajeError(
          errorSolicitud
        )
      );
    } finally {
      setEnviando(false);
    }
  };

  const cerrarModal = () => {
    if (enviando) {
      return;
    }

    onCerrar();
  };

  return (
    <div style={overlayStyle}>
      <section style={modalStyle}>
        <div style={headerStyle}>
          <div>
            <h2 style={titleStyle}>
              Nueva solicitud
            </h2>

            <p style={descriptionStyle}>
              Selecciona el destino y agrega
              los materiales requeridos.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={enviando}
            style={closeButtonStyle}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        {cargando ? (
          <div style={messageStyle}>
            Cargando catálogos...
          </div>
        ) : (
          <form
            onSubmit={
              guardarSolicitud
            }
          >
            <h3 style={sectionTitleStyle}>
              Destino
            </h3>

            <div style={selectorsGridStyle}>
              <div style={formGroupStyle}>
                <label
                  htmlFor="nuevoProyecto"
                  style={labelStyle}
                >
                  Proyecto *
                </label>

                <select
                  id="nuevoProyecto"
                  value={
                    idProyecto > 0
                      ? idProyecto
                      : ""
                  }
                  onChange={(event) =>
                    manejarCambioProyecto(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  disabled={enviando}
                  style={inputStyle}
                >
                  <option value="">
                    Seleccionar proyecto
                  </option>

                  {proyectosDisponibles.map(
                    (proyecto) => (
                      <option
                        key={
                          proyecto.idProyecto
                        }
                        value={
                          proyecto.idProyecto
                        }
                      >
                        {proyecto.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div style={formGroupStyle}>
                <label
                  htmlFor="nuevaFamilia"
                  style={labelStyle}
                >
                  Familia *
                </label>

                <select
                  id="nuevaFamilia"
                  value={
                    idFamilia > 0
                      ? idFamilia
                      : ""
                  }
                  onChange={(event) =>
                    manejarCambioFamilia(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  disabled={
                    enviando ||
                    idProyecto <= 0
                  }
                  style={inputStyle}
                >
                  <option value="">
                    {idProyecto > 0
                      ? "Seleccionar familia"
                      : "Selecciona un proyecto"}
                  </option>

                  {familiasDisponibles.map(
                    (familia) => (
                      <option
                        key={
                          familia.idFamilia
                        }
                        value={
                          familia.idFamilia
                        }
                      >
                        {familia.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div style={formGroupStyle}>
                <label
                  htmlFor="nuevaEstacion"
                  style={labelStyle}
                >
                  Estación *
                </label>

                <select
                  id="nuevaEstacion"
                  value={
                    idEstacion > 0
                      ? idEstacion
                      : ""
                  }
                  onChange={(event) =>
                    setIdEstacion(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  disabled={
                    enviando ||
                    idFamilia <= 0
                  }
                  style={inputStyle}
                >
                  <option value="">
                    {idFamilia > 0
                      ? "Seleccionar estación"
                      : "Selecciona una familia"}
                  </option>

                  {estacionesDisponibles.map(
                    (estacion) => (
                      <option
                        key={
                          estacion.idEstacion
                        }
                        value={
                          estacion.idEstacion
                        }
                      >
                        {estacion.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {idProyecto > 0 &&
              familiasDisponibles.length ===
                0 && (
                <div style={warningStyle}>
                  El proyecto no tiene familias
                  activas.
                </div>
              )}

            {idFamilia > 0 &&
              estacionesDisponibles.length ===
                0 && (
                <div style={warningStyle}>
                  La familia no tiene estaciones
                  activas.
                </div>
              )}

            <div style={separatorStyle} />

            <div style={materialsHeaderStyle}>
              <h3 style={sectionTitleStyle}>
                Materiales
              </h3>

              <span style={counterStyle}>
                {materiales.length}{" "}
                {materiales.length === 1
                  ? "material"
                  : "materiales"}
              </span>
            </div>

            <div style={searchContainerStyle}>
              <label
                htmlFor="buscarMaterialSolicitud"
                style={labelStyle}
              >
                Buscar material
              </label>

              <input
                id="buscarMaterialSolicitud"
                type="text"
                value={busquedaMaterial}
                onChange={(event) =>
                  setBusquedaMaterial(
                    event.target.value
                  )
                }
                disabled={enviando}
                placeholder="Número de parte, descripción, código de barras o serial"
                autoComplete="off"
                style={inputStyle}
              />

              {busquedaMaterial.trim() &&
                materialesEncontrados.length >
                  0 && (
                  <div style={resultsStyle}>
                    {materialesEncontrados.map(
                      (material) => (
                        <button
                          key={
                            material.idMaterial
                          }
                          type="button"
                          disabled={enviando}
                          onClick={() =>
                            agregarMaterial(
                              material
                            )
                          }
                          style={resultButtonStyle}
                        >
                          <strong>
                            {
                              material.numeroParteMaterial
                            }
                          </strong>

                          <span
                            style={
                              resultDescriptionStyle
                            }
                          >
                            {
                              material.descripcion
                            }
                          </span>

                          {material.codigoBarras && (
                            <small>
                              Código:{" "}
                              {
                                material.codigoBarras
                              }
                            </small>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}

              {busquedaMaterial.trim() &&
                materialesEncontrados.length ===
                  0 && (
                  <div style={noResultsStyle}>
                    No se encontraron materiales
                    activos.
                  </div>
                )}
            </div>

            {materiales.length === 0 ? (
              <div style={emptyStyle}>
                Busca un material y selecciónalo
                para agregarlo.
              </div>
            ) : (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={thStyle}>
                        Material
                      </th>

                      <th style={thStyle}>
                        Descripción
                      </th>

                      <th style={thStyle}>
                        Cantidad
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
                    {materiales.map(
                      (material) => (
                        <tr
                          key={
                            material.idMaterial
                          }
                        >
                          <td style={tdStyle}>
                            <strong>
                              {
                                material.numeroParte
                              }
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            {
                              material.descripcion
                            }
                          </td>

                          <td style={tdStyle}>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={
                                material.cantidad
                              }
                              onChange={(event) =>
                                cambiarCantidad(
                                  material.idMaterial,
                                  event.target.value
                                )
                              }
                              disabled={enviando}
                              style={
                                quantityInputStyle
                              }
                            />
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign: "right",
                            }}
                          >
                            <button
                              type="button"
                              disabled={enviando}
                              onClick={() =>
                                quitarMaterial(
                                  material.idMaterial
                                )
                              }
                              style={
                                removeButtonStyle
                              }
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <div style={actionsStyle}>
              <button
                type="button"
                onClick={cerrarModal}
                disabled={enviando}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  enviando ||
                  cargando ||
                  materiales.length === 0
                }
                style={{
                  ...primaryButtonStyle,
                  opacity:
                    enviando ||
                    materiales.length === 0
                      ? 0.65
                      : 1,
                }}
              >
                {enviando
                  ? "Enviando..."
                  : "Enviar solicitud"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1100,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box" as const,
  background:
    "rgba(15, 23, 42, 0.58)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "1050px",
  maxHeight: "92vh",
  overflowY: "auto" as const,
  padding: "28px",
  boxSizing: "border-box" as const,
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 25px 70px rgba(15, 23, 42, 0.3)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "25px",
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
};

const closeButtonStyle = {
  width: "38px",
  height: "38px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "24px",
  cursor: "pointer",
};

const sectionTitleStyle = {
  margin: "0 0 15px",
  color: "#102957",
  fontSize: "18px",
};

const selectorsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const labelStyle = {
  color: "#17335f",
  fontSize: "14px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box" as const,
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "14px",
  outline: "none",
};

const separatorStyle = {
  height: "1px",
  margin: "26px 0",
  background: "#e2e8f0",
};

const materialsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
};

const counterStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "700",
};

const searchContainerStyle = {
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginBottom: "18px",
};

const resultsStyle = {
  position: "absolute" as const,
  top: "74px",
  left: 0,
  right: 0,
  zIndex: 30,
  maxHeight: "280px",
  overflowY: "auto" as const,
  padding: "6px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  boxShadow:
    "0 15px 35px rgba(15, 23, 42, 0.16)",
};

const resultButtonStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
  gap: "4px",
  padding: "11px 12px",
  border: "none",
  borderBottom:
    "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#102957",
  textAlign: "left" as const,
  cursor: "pointer",
};

const resultDescriptionStyle = {
  color: "#475569",
  fontSize: "13px",
};

const noResultsStyle = {
  color: "#64748b",
  fontSize: "13px",
};

const emptyStyle = {
  padding: "28px",
  border: "1px dashed #cbd5e1",
  borderRadius: "9px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const tableContainerStyle = {
  width: "100%",
  overflowX: "auto" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
  background: "#f8fafc",
};

const thStyle = {
  padding: "12px",
  borderBottom:
    "2px solid #e2e8f0",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "12px",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#334155",
  fontSize: "14px",
};

const quantityInputStyle = {
  width: "105px",
  minHeight: "37px",
  boxSizing: "border-box" as const,
  padding: "7px 9px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  color: "#102957",
};

const removeButtonStyle = {
  padding: "7px 11px",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: "700",
  cursor: "pointer",
};

const warningStyle = {
  marginTop: "13px",
  padding: "11px 13px",
  borderRadius: "8px",
  background: "#fff7ed",
  color: "#9a3412",
  fontSize: "13px",
};

const errorStyle = {
  marginTop: "18px",
  padding: "13px 15px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "14px",
};

const messageStyle = {
  padding: "35px",
  borderRadius: "9px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "23px",
};

const primaryButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#102957",
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: "700",
  cursor: "pointer",
};