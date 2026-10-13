import {
  useEffect,
  useRef,
} from "react";

import type {
  Solicitud,
} from "../../types/solicitud";

interface SolicitudesTableProps {
  solicitudes: Solicitud[];
  cargando: boolean;

  onSeleccionar: (
    solicitud: Solicitud
  ) => void;
}

export function SolicitudesTable({
  solicitudes,
  cargando,
  onSeleccionar,
}: SolicitudesTableProps) {
  const tableContainerRef =
    useRef<HTMLDivElement | null>(
      null
    );

  // Regresa la tabla a la primera columna
  // cuando cambian las solicitudes.
  useEffect(() => {
    const contenedor =
      tableContainerRef.current;

    if (!contenedor) {
      return;
    }

    contenedor.scrollLeft = 0;
  }, [solicitudes]);
  if (cargando) {
    return (
      <div style={messageStyle}>
        Cargando solicitudes...
      </div>
    );
  }

  if (solicitudes.length === 0) {
    return (
      <div style={emptyStyle}>
        No hay solicitudes registradas.
      </div>
    );
  }

  return (
    <div
      ref={tableContainerRef}
      style={tableContainerStyle}
      role="region"
      aria-label="Tabla de solicitudes"
      tabIndex={0}
    >
      <table style={tableStyle}>
        <thead>
          <tr style={headerRowStyle}>
            <th style={thStyle}>
              Solicitud
            </th>

            <th style={thStyle}>
              Fecha
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
              Solicitante
            </th>

            <th style={thStyle}>
              Materiales
            </th>

            <th style={thStyle}>
              Estado
            </th>
          </tr>
        </thead>

        <tbody>
          {solicitudes.map(
            (solicitud) => (
              <tr
                key={
                  solicitud.idSolicitud
                }
                onClick={() =>
                  onSeleccionar(
                    solicitud
                  )
                }
                style={rowStyle}
                title="Abrir detalle de solicitud"
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
                  {formatearFecha(
                    solicitud.fechaSolicitud
                  )}
                </td>

                <td style={tdStyle}>
                  {
                    solicitud.nombreProyecto
                  }
                </td>

                <td style={tdStyle}>
                  {
                    solicitud.nombreFamilia
                  }
                </td>

                <td style={tdStyle}>
                  {
                    solicitud.nombreEstacion
                  }
                </td>

                <td style={tdStyle}>
                  {
                    solicitud.nombreUsuarioSolicitud
                  }
                </td>

                <td style={tdStyle}>
                  {
                    solicitud.materiales
                      ?.length ?? 0
                  }
                </td>

                <td style={tdStyle}>
                  <span
                    style={obtenerEstadoStyle(
                      solicitud.nombreEstado
                    )}
                  >
                    {
                      solicitud.nombreEstado
                    }
                  </span>
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

function formatearFecha(
  fecha: string
) {
  const fechaConvertida =
    new Date(fecha);

  if (
    Number.isNaN(
      fechaConvertida.getTime()
    )
  ) {
    return fecha;
  }

  return fechaConvertida.toLocaleString(
    "es-MX"
  );
}

function obtenerEstadoStyle(
  nombreEstado: string
) {
  const estado =
    nombreEstado.toLowerCase();

  let background = "#f1f5f9";
  let color = "#475569";

  if (estado === "pendiente") {
    background = "#fef3c7";
    color = "#920e0e";
  }

  if (
    estado === "asignada" ||
    estado === "en surtido"
  ) {
    background = "#dbeafe";
    color = "#1d4ed8";
  }

  if (
    estado === "parcial" ||
    estado === "faltante"
  ) {
    background = "#ffedd5";
    color = "#c2410c";
  }

  if (
    estado === "surtida"

  ) {
    background = "#dcfce7";
    color = "#166534";
  }

  if (estado === "cancelada") {
    background = "#f1f5f9";
    color = "#475569";
  }

  return {
    display: "inline-block",
    minWidth: "90px",
    padding: "6px 10px",
    borderRadius: "999px",
    background,
    color,
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
  };
}

const tableContainerStyle = {
  display: "block",

  width: "100%",
  maxWidth: "100%",
  minWidth: 0,

  overflowX: "auto" as const,
  overflowY: "hidden" as const,

  WebkitOverflowScrolling:
    "touch" as const,

  overscrollBehaviorX:
    "contain" as const,

  boxSizing: "border-box" as const,

  border: "1px solid #e2e8f0",
  borderRadius: "10px",

  background: "#ffffff",
};

const tableStyle = {
  width: "100%",

  // Conserva completas todas las columnas.
  // En móvil se desplaza dentro del contenedor.
  minWidth: "920px",

  borderCollapse:
    "collapse" as const,

  tableLayout:
    "auto" as const,
};
const headerRowStyle = {
  background: "#f8fafc",
};

const thStyle = {
  padding: "13px",
  borderBottom:
    "2px solid #e2e8f0",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "13px",

  borderBottom:
    "1px solid #e5e7eb",

  color: "#334155",
  fontSize: "14px",

  verticalAlign:
    "middle" as const,

  whiteSpace:
    "nowrap" as const,
};

const rowStyle = {
  cursor: "pointer",

  minHeight: "52px",

  background: "#ffffff",
};
const messageStyle = {
  padding: "35px",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
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
