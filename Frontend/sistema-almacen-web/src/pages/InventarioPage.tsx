import {
  useEffect,
  useRef,
  useState,
} from "react";

import axios from "axios";

import {
  Layout,
} from "../components/Layout";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

import {
  importarArchivoMrp,
  obtenerFiltrosMrp,
  obtenerRequerimientosMrp,
} from "../services/mrpService";

import type {
  FiltrosMrp,
  RequerimientoMrp,
} from "../services/mrpService";

type TipoPeriodo =
  | "DIA"
  | "SEMANA";

export function InventarioPage() {
  const usuarioActual =
    obtenerUsuarioActual();

  const rolActual =
    normalizarTexto(
      usuarioActual?.role
    );

  const puedeImportar =
    rolActual === "ADMIN" ||
    rolActual === "ADMINISTRADOR" ||
    rolActual === "SUPERVISOR";

  const inputArchivoRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    registros,
    setRegistros,
  ] = useState<RequerimientoMrp[]>(
    []
  );

  const [
    filtrosDisponibles,
    setFiltrosDisponibles,
  ] = useState<FiltrosMrp>({
    proyectos: [],
    familias: [],
    fechaMinima: null,
    fechaMaxima: null,
  });

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    proyecto,
    setProyecto,
  ] = useState("");

  const [
    familia,
    setFamilia,
  ] = useState("");

  const [
    tipoPeriodo,
    setTipoPeriodo,
  ] = useState<TipoPeriodo>(
    "SEMANA"
  );

  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] = useState("");

  const [
    pagina,
    setPagina,
  ] = useState(1);

  const [
    totalRegistros,
    setTotalRegistros,
  ] = useState(0);

  const [
    totalPaginas,
    setTotalPaginas,
  ] = useState(0);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    importando,
    setImportando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const tamanoPagina = 50;

  // Obtiene los valores disponibles para los filtros.
  const cargarFiltros =
    async () => {
      try {
        const datos =
          await obtenerFiltrosMrp();

        setFiltrosDisponibles(
          datos
        );

        setFechaSeleccionada(
          (fechaActual) =>
            fechaActual ||
            obtenerFechaInput(
              datos.fechaMinima
            ) ||
            obtenerFechaLocal()
        );
      } catch (errorFiltros) {
        console.error(
          "Error al cargar filtros MRP:",
          errorFiltros
        );

        setError(
          obtenerMensajeError(
            errorFiltros,
            "No se pudieron cargar los filtros del plan semanal."
          )
        );
      }
    };

  // Consulta los requerimientos del periodo seleccionado.
  const cargarRequerimientos =
    async (
      numeroPagina = pagina
    ) => {
      try {
        setCargando(true);
        setError("");

        const periodo =
          obtenerRangoPeriodo(
            fechaSeleccionada,
            tipoPeriodo
          );

        const resultado =
          await obtenerRequerimientosMrp({
            busqueda:
              busqueda.trim() ||
              undefined,

            proyecto:
              proyecto ||
              undefined,

            familia:
              familia ||
              undefined,

            fechaDesde:
              periodo.fechaDesde,

            fechaHasta:
              periodo.fechaHasta,

            pagina:
              numeroPagina,

            tamanoPagina,
          });

        setRegistros(
          resultado.registros
        );

        setPagina(
          resultado.pagina
        );

        setTotalRegistros(
          resultado.totalRegistros
        );

        setTotalPaginas(
          resultado.totalPaginas
        );
      } catch (errorCarga) {
        console.error(
          "Error al cargar MRP:",
          errorCarga
        );

        setRegistros([]);
        setTotalRegistros(0);
        setTotalPaginas(0);

        setError(
          obtenerMensajeError(
            errorCarga,
            "No se pudo cargar el plan semanal de surtido."
          )
        );
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarFiltros();
  }, []);

  useEffect(() => {
    if (!fechaSeleccionada) {
      return;
    }

    cargarRequerimientos(1);
  }, [
    fechaSeleccionada,
    tipoPeriodo,
    proyecto,
    familia,
  ]);

  const manejarBusqueda = () => {
    setPagina(1);
    cargarRequerimientos(1);
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setProyecto("");
    setFamilia("");
    setTipoPeriodo("SEMANA");

    setFechaSeleccionada(
      obtenerFechaInput(
        filtrosDisponibles.fechaMinima
      ) ||
      obtenerFechaLocal()
    );

    setPagina(1);
  };

  const manejarArchivo = async (
    archivo: File
  ) => {
    if (!puedeImportar) {
      setError(
        "Solo Administrador o Supervisor puede importar el archivo semanal."
      );
      return;
    }

    const extension =
      archivo.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (extension !== "xlsx") {
      setError(
        "Selecciona un archivo Excel con extensión .xlsx."
      );
      return;
    }

    const confirmar =
      window.confirm(
        `¿Importar el archivo semanal ${archivo.name}?`
      );

    if (!confirmar) {
      if (inputArchivoRef.current) {
        inputArchivoRef.current.value =
          "";
      }

      return;
    }

    try {
      setImportando(true);
      setError("");
      setMensajeExito("");

      const resultado =
        await importarArchivoMrp(
          archivo
        );

      setMensajeExito(
        `${resultado.mensaje} ` +
        `${resultado.registrosImportados.toLocaleString(
          "es-MX"
        )} registros importados, ` +
        `${resultado.registrosRechazados.toLocaleString(
          "es-MX"
        )} rechazados.`
      );

      await cargarFiltros();

      setFechaSeleccionada(
        obtenerFechaInput(
          resultado.fechaInicio
        )
      );

      setTipoPeriodo(
        "SEMANA"
      );

      setPagina(1);

      await cargarRequerimientos(
        1
      );
    } catch (errorImportacion) {
      console.error(
        "Error al importar MRP:",
        errorImportacion
      );

      setError(
        obtenerMensajeError(
          errorImportacion,
          "No se pudo importar el archivo semanal."
        )
      );
    } finally {
      setImportando(false);

      if (inputArchivoRef.current) {
        inputArchivoRef.current.value =
          "";
      }
    }
  };

  const rangoActual =
    obtenerRangoPeriodo(
      fechaSeleccionada,
      tipoPeriodo
    );

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section style={cardStyle}>
          <header style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Plan semanal de surtido
              </h1>

              <p style={descriptionStyle}>
                Consulta los requerimientos MRP
                por material, proyecto, familia,
                día o semana.
              </p>
            </div>

            {puedeImportar && (
              <>
                <input
                  ref={inputArchivoRef}
                  type="file"
                  accept=".xlsx"
                  hidden
                  onChange={(event) => {
                    const archivo =
                      event.target
                        .files?.[0];

                    if (archivo) {
                      manejarArchivo(
                        archivo
                      );
                    }
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    inputArchivoRef.current
                      ?.click()
                  }
                  disabled={importando}
                  style={{
                    ...primaryButtonStyle,

                    opacity:
                      importando
                        ? 0.65
                        : 1,

                    cursor:
                      importando
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {importando
                    ? "Importando..."
                    : "Importar archivo semanal"}
                </button>
              </>
            )}
          </header>

          {mensajeExito && (
            <div style={successStyle}>
              {mensajeExito}
            </div>
          )}

          {error && (
            <div
              style={errorStyle}
              role="alert"
            >
              {error}
            </div>
          )}

          <div style={periodStyle}>
            <strong>
              Periodo consultado:
            </strong>

            <span>
              {formatearFecha(
                rangoActual.fechaDesde
              )}{" "}
              al{" "}
              {formatearFecha(
                rangoActual.fechaHasta
              )}
            </span>
          </div>

          <div style={filtersStyle}>
            <div style={formGroupStyle}>
              <label
                htmlFor="busquedaMrp"
                style={labelStyle}
              >
                Material
              </label>

              <input
                id="busquedaMrp"
                type="text"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter"
                  ) {
                    manejarBusqueda();
                  }
                }}
                placeholder="Número o nombre del material"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="proyectoMrp"
                style={labelStyle}
              >
                Proyecto
              </label>

              <select
                id="proyectoMrp"
                value={proyecto}
                onChange={(event) => {
                  setProyecto(
                    event.target.value
                  );

                  setPagina(1);
                }}
                style={inputStyle}
              >
                <option value="">
                  Todos
                </option>

                {filtrosDisponibles
                  .proyectos
                  .map((valor) => (
                    <option
                      key={valor}
                      value={valor}
                    >
                      {valor}
                    </option>
                  ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="familiaMrp"
                style={labelStyle}
              >
                Familia
              </label>

              <select
                id="familiaMrp"
                value={familia}
                onChange={(event) => {
                  setFamilia(
                    event.target.value
                  );

                  setPagina(1);
                }}
                style={inputStyle}
              >
                <option value="">
                  Todas
                </option>

                {filtrosDisponibles
                  .familias
                  .map((valor) => (
                    <option
                      key={valor}
                      value={valor}
                    >
                      {valor}
                    </option>
                  ))}
              </select>
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="periodoMrp"
                style={labelStyle}
              >
                Periodo
              </label>

              <select
                id="periodoMrp"
                value={tipoPeriodo}
                onChange={(event) => {
                  setTipoPeriodo(
                    event.target
                      .value as TipoPeriodo
                  );

                  setPagina(1);
                }}
                style={inputStyle}
              >
                <option value="DIA">
                  Día
                </option>

                <option value="SEMANA">
                  Semana
                </option>
              </select>
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="fechaMrp"
                style={labelStyle}
              >
                {tipoPeriodo === "DIA"
                  ? "Fecha"
                  : "Día de la semana"}
              </label>

              <input
                id="fechaMrp"
                type="date"
                value={
                  fechaSeleccionada
                }
                onChange={(event) => {
                  setFechaSeleccionada(
                    event.target.value
                  );

                  setPagina(1);
                }}
                min={
                  obtenerFechaInput(
                    filtrosDisponibles
                      .fechaMinima
                  ) || undefined
                }
                max={
                  obtenerFechaInput(
                    filtrosDisponibles
                      .fechaMaxima
                  ) || undefined
                }
                style={inputStyle}
              />
            </div>

            <div style={filterActionsStyle}>
              <button
                type="button"
                onClick={
                  manejarBusqueda
                }
                style={searchButtonStyle}
              >
                Buscar
              </button>

              <button
                type="button"
                onClick={
                  limpiarFiltros
                }
                style={secondaryButtonStyle}
              >
                Limpiar
              </button>
            </div>
          </div>

          <div style={resultsHeaderStyle}>
            <div>
              <h2 style={sectionTitleStyle}>
                Requerimientos
              </h2>

              <p style={resultsDescriptionStyle}>
                Los registros corresponden a
                la importación vigente.
              </p>
            </div>

            <span style={counterStyle}>
              {totalRegistros.toLocaleString(
                "es-MX"
              )}{" "}
              registros
            </span>
          </div>

          {cargando ? (
            <div style={emptyStyle}>
              Cargando plan semanal...
            </div>
          ) : registros.length === 0 ? (
            <div style={emptyStyle}>
              No hay requerimientos que
              coincidan con los filtros.
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
                      Nombre
                    </th>

                    <th style={thStyle}>
                      Familia
                    </th>

                    <th style={thStyle}>
                      Proyecto
                    </th>

                    <th style={thStyle}>
                      ETA
                    </th>

                    <th style={numericThStyle}>
                      Requerido
                    </th>

                    <th style={numericThStyle}>
                      Pack Size
                    </th>

                    <th style={numericThStyle}>
                      Bolsas
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {registros.map(
                    (registro) => (
                      <tr
                        key={
                          registro.idRequerimiento
                        }
                      >
                        <td style={tdStyle}>
                          <strong>
                            {
                              registro.numeroMaterial
                            }
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {registro.nombreMaterial ??
                            "Sin descripción"}
                        </td>

                        <td style={tdStyle}>
                          {registro.familia ??
                            "Sin familia"}
                        </td>

                        <td style={tdStyle}>
                          {registro.proyecto ??
                            "Sin proyecto"}
                        </td>

                        <td style={tdStyle}>
                          {formatearFecha(
                            registro.fechaEta
                          )}
                        </td>

                        <td style={numericTdStyle}>
                          {formatearCantidad(
                            registro.cantidadRequerida
                          )}
                        </td>

                        <td style={numericTdStyle}>
                          {formatearCantidad(
                            registro.packSize
                          )}
                        </td>

                        <td style={numericTdStyle}>
                          <span style={bagsStyle}>
                            {
                              registro.bolsasNecesarias
                            }
                          </span>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div style={paginationStyle}>
            <button
              type="button"
              onClick={() =>
                cargarRequerimientos(
                  pagina - 1
                )
              }
              disabled={
                cargando ||
                pagina <= 1
              }
              style={paginationButtonStyle}
            >
              Anterior
            </button>

            <span style={paginationTextStyle}>
              Página {pagina} de{" "}
              {totalPaginas || 1}
            </span>

            <button
              type="button"
              onClick={() =>
                cargarRequerimientos(
                  pagina + 1
                )
              }
              disabled={
                cargando ||
                totalPaginas === 0 ||
                pagina >= totalPaginas
              }
              style={paginationButtonStyle}
            >
              Siguiente
            </button>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function obtenerRangoPeriodo(
  fecha: string,
  tipoPeriodo: TipoPeriodo
) {
  if (!fecha) {
    return {
      fechaDesde: undefined,
      fechaHasta: undefined,
    };
  }

  if (tipoPeriodo === "DIA") {
    return {
      fechaDesde: fecha,
      fechaHasta: fecha,
    };
  }

  const fechaBase =
    crearFechaLocal(fecha);

  const diaSemana =
    fechaBase.getDay();

  const diasDesdeLunes =
    diaSemana === 0
      ? 6
      : diaSemana - 1;

  const lunes =
    new Date(fechaBase);

  lunes.setDate(
    fechaBase.getDate() -
    diasDesdeLunes
  );

  const domingo =
    new Date(lunes);

  domingo.setDate(
    lunes.getDate() + 6
  );

  return {
    fechaDesde:
      fechaAInput(lunes),

    fechaHasta:
      fechaAInput(domingo),
  };
}

function crearFechaLocal(
  fecha: string
) {
  const [
    anio,
    mes,
    dia,
  ] = fecha
    .slice(0, 10)
    .split("-")
    .map(Number);

  return new Date(
    anio,
    mes - 1,
    dia
  );
}

function fechaAInput(
  fecha: Date
) {
  const anio =
    fecha.getFullYear();

  const mes =
    String(
      fecha.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const dia =
    String(
      fecha.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${anio}-${mes}-${dia}`;
}

function obtenerFechaInput(
  fecha: string | null
) {
  return fecha
    ? fecha.slice(0, 10)
    : "";
}

function obtenerFechaLocal() {
  return fechaAInput(
    new Date()
  );
}

function formatearFecha(
  fecha?: string
) {
  if (!fecha) {
    return "Sin fecha";
  }

  const fechaConvertida =
    crearFechaLocal(
      fecha.slice(0, 10)
    );

  return fechaConvertida
    .toLocaleDateString(
      "es-MX"
    );
}

function formatearCantidad(
  cantidad: number
) {
  return cantidad.toLocaleString(
    "es-MX",
    {
      maximumFractionDigits: 2,
    }
  );
}

function normalizarTexto(
  texto: string | null | undefined
) {
  return (
    texto
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      ) ?? ""
  );
}

function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string
) {
  if (axios.isAxiosError(error)) {
    const mensaje =
      error.response
        ?.data?.mensaje;

    if (
      typeof mensaje === "string"
    ) {
      return mensaje;
    }

    const detalle =
      error.response
        ?.data?.detail;

    if (
      typeof detalle === "string"
    ) {
      return detalle;
    }

    if (
      error.response?.status === 401
    ) {
      return "La sesión no es válida.";
    }

    if (
      error.response?.status === 403
    ) {
      return "No tienes permiso para realizar esta operación.";
    }
  }

  return mensajePredeterminado;
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1450px",
  margin: "0 auto",
};

const cardStyle = {
  padding: "28px",
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 4px 18px rgba(15, 23, 42, 0.08)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "16px",
  marginBottom: "20px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "29px",
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  lineHeight: 1.5,
};

const primaryButtonStyle = {
  minHeight: "44px",
  padding: "10px 17px",
  border: "none",
  borderRadius: "9px",
  background: "#102957",
  color: "#ffffff",
  fontWeight: "800",
};

const successStyle = {
  marginBottom: "16px",
  padding: "13px 15px",
  border: "1px solid #bbf7d0",
  borderRadius: "9px",
  background: "#f0fdf4",
  color: "#166534",
  fontWeight: "700",
};

const errorStyle = {
  marginBottom: "16px",
  padding: "13px 15px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fef2f2",
  color: "#991b1b",
  fontWeight: "700",
};

const periodStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "7px",
  marginBottom: "15px",
  padding: "11px 14px",
  borderRadius: "8px",
  background: "#eff6ff",
  color: "#1e3a8a",
  fontSize: "13px",
};

const filtersStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(180px, 1fr))",
  alignItems: "end",
  gap: "12px",
  marginBottom: "23px",
  padding: "16px",
  border: "1px solid #e2e8f0",
  borderRadius: "11px",
  background: "#f8fafc",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px",
  minWidth: 0,
};

const labelStyle = {
  color: "#17335f",
  fontSize: "12px",
  fontWeight: "800",
};

const inputStyle = {
  width: "100%",
  minWidth: 0,
  minHeight: "42px",
  boxSizing: "border-box" as const,
  padding: "8px 10px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "13px",
};

const filterActionsStyle = {
  display: "flex",
  gap: "7px",
};

const searchButtonStyle = {
  minHeight: "42px",
  padding: "8px 15px",
  border: "none",
  borderRadius: "8px",
  background: "#1d4ed8",
  color: "#ffffff",
  fontWeight: "800",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: "42px",
  padding: "8px 15px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: "800",
  cursor: "pointer",
};

const resultsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap" as const,
  gap: "12px",
  marginBottom: "12px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "20px",
};

const resultsDescriptionStyle = {
  margin: "4px 0 0",
  color: "#64748b",
  fontSize: "13px",
};

const counterStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "800",
};

const tableContainerStyle = {
  width: "100%",
  overflowX: "auto" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
};

const tableStyle = {
  width: "100%",
  minWidth: "980px",
  borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
  background: "#f1f5f9",
};

const thStyle = {
  padding: "11px",
  borderBottom: "2px solid #cbd5e1",
  color: "#102957",
  fontSize: "12px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const numericThStyle = {
  ...thStyle,
  textAlign: "right" as const,
};

const tdStyle = {
  padding: "11px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "13px",
};

const numericTdStyle = {
  ...tdStyle,
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
};

const bagsStyle = {
  display: "inline-block",
  minWidth: "38px",
  padding: "5px 8px",
  borderRadius: "999px",
  background: "#fef3c7",
  color: "#92400e",
  fontWeight: "900",
  textAlign: "center" as const,
};

const emptyStyle = {
  padding: "35px",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexWrap: "wrap" as const,
  gap: "12px",
  marginTop: "18px",
};

const paginationButtonStyle = {
  minHeight: "38px",
  padding: "7px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontWeight: "800",
  cursor: "pointer",
};

const paginationTextStyle = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: "700",
};
