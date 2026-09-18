import {
    useMemo,
    useState,
} from "react";

import axios from "axios";

import {
    cambiarEstadoSolicitud,
} from "../../services/solicitudService";

import type {
    Solicitud,
} from "../../types/solicitud";

interface SolicitudDetalleModalProps {
    solicitud: Solicitud;

    onCerrar: () => void;

    onSolicitudActualizada: (
        solicitud: Solicitud,
        mensaje: string
    ) => void;
}

interface EstadoSolicitud {
    idEstado: number;
    nombre: string;
}

const estados: EstadoSolicitud[] = [
    {
        idEstado: 1,
        nombre: "Pendiente",
    },
    {
        idEstado: 3,
        nombre: "En surtido",
    },
    {
        idEstado: 4,
        nombre: "Parcial",
    },
    {
        idEstado: 5,
        nombre: "Faltante",
    },
    {
        idEstado: 6,
        nombre: "Surtida",
    },
    {
        idEstado: 8,
        nombre: "Cancelada",
    },
];
// Los estados relacionados con cantidades
// se actualizan durante el surtido.
const transicionesPermitidas: Record<
    number,
    number[]
> = {
    1: [8],
    2: [8],
    3: [],
    4: [],
    5: [],
    6: [7],
    7: [],
    8: [],
};

export function SolicitudDetalleModal({
    solicitud,
    onCerrar,
    onSolicitudActualizada,
}: SolicitudDetalleModalProps) {
    const [
        solicitudActual,
        setSolicitudActual,
    ] = useState(solicitud);

    const [
        idNuevoEstado,
        setIdNuevoEstado,
    ] = useState(0);

    const [
        actualizando,
        setActualizando,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        mensajeExito,
        setMensajeExito,
    ] = useState("");

    const estadosDisponibles =
        useMemo(() => {
            const identificadores =
                transicionesPermitidas[
                solicitudActual.idEstado
                ] ?? [];

            return estados.filter(
                (estado) =>
                    identificadores.includes(
                        estado.idEstado
                    )
            );
        }, [solicitudActual.idEstado]);

    const actualizarEstado = async () => {
        setError("");
        setMensajeExito("");

        if (idNuevoEstado <= 0) {
            setError(
                "Selecciona el nuevo estado de la solicitud."
            );

            return;
        }

        try {
            setActualizando(true);

            const respuesta =
                await cambiarEstadoSolicitud(
                    solicitudActual.idSolicitud,
                    idNuevoEstado
                );

            setSolicitudActual(
                respuesta.solicitud
            );

            setIdNuevoEstado(0);

            setMensajeExito(
                respuesta.mensaje
            );

            onSolicitudActualizada(
                respuesta.solicitud,
                respuesta.mensaje
            );
        } catch (errorActualizacion) {
            console.error(
                "Error al cambiar el estado:",
                errorActualizacion
            );

            if (
                axios.isAxiosError(
                    errorActualizacion
                )
            ) {
                const mensajeBackend =
                    errorActualizacion.response
                        ?.data?.mensaje;

                if (
                    typeof mensajeBackend ===
                    "string"
                ) {
                    setError(
                        mensajeBackend
                    );

                    return;
                }

                if (
                    errorActualizacion.response
                        ?.status === 403
                ) {
                    setError(
                        "No tienes permiso para modificar el estado de la solicitud."
                    );

                    return;
                }
            }

            setError(
                "No se pudo actualizar el estado de la solicitud."
            );
        } finally {
            setActualizando(false);
        }
    };

    const cerrarModal = () => {
        if (actualizando) {
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
                            Solicitud #
                            {
                                solicitudActual.idSolicitud
                            }
                        </h2>

                        <p style={descriptionStyle}>
                            Detalle completo de la
                            petición de materiales.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={cerrarModal}
                        disabled={actualizando}
                        style={closeButtonStyle}
                        aria-label="Cerrar detalle"
                    >
                        ×
                    </button>
                </div>

                <div style={summaryGridStyle}>
                    <Dato
                        etiqueta="Proyecto"
                        valor={
                            solicitudActual.nombreProyecto
                        }
                    />

                    <Dato
                        etiqueta="Familia"
                        valor={
                            solicitudActual.nombreFamilia
                        }
                    />

                    <Dato
                        etiqueta="Estación"
                        valor={
                            solicitudActual.nombreEstacion
                        }
                    />

                    <Dato
                        etiqueta="Estado"
                        valor={
                            solicitudActual.nombreEstado
                        }
                    />

                    <Dato
                        etiqueta="Solicitante"
                        valor={
                            solicitudActual
                                .nombreUsuarioSolicitud
                        }
                    />

                    <Dato
                        etiqueta="Fecha"
                        valor={formatearFecha(
                            solicitudActual.fechaSolicitud
                        )}
                    />
                </div>

                <section style={statusSectionStyle}>
                    <div>
                        <h3 style={statusTitleStyle}>
                            Estado de la solicitud
                        </h3>

                        <p style={statusDescriptionStyle}>
                            Estado actual:{" "}
                            <strong>
                                {
                                    solicitudActual.nombreEstado
                                }
                            </strong>
                        </p>
                    </div>

                    {estadosDisponibles.length > 0 ? (
                        <div style={statusControlsStyle}>
                            <select
                                value={
                                    idNuevoEstado > 0
                                        ? idNuevoEstado
                                        : ""
                                }
                                onChange={(event) => {
                                    setIdNuevoEstado(
                                        Number(
                                            event.target.value
                                        )
                                    );

                                    setError("");
                                    setMensajeExito("");
                                }}
                                disabled={actualizando}
                                style={selectStyle}
                            >
                                <option value="">
                                    Seleccionar nuevo estado
                                </option>

                                {estadosDisponibles.map(
                                    (estado) => (
                                        <option
                                            key={
                                                estado.idEstado
                                            }
                                            value={
                                                estado.idEstado
                                            }
                                        >
                                            {estado.nombre}
                                        </option>
                                    )
                                )}
                            </select>

                            <button
                                type="button"
                                onClick={actualizarEstado}
                                disabled={
                                    actualizando ||
                                    idNuevoEstado <= 0
                                }
                                style={{
                                    ...updateButtonStyle,
                                    opacity:
                                        actualizando ||
                                            idNuevoEstado <= 0
                                            ? 0.65
                                            : 1,
                                }}
                            >
                                {actualizando
                                    ? "Actualizando..."
                                    : "Actualizar estado"}
                            </button>
                        </div>
                    ) : (
                        <div style={finalStateStyle}>
                            {solicitudActual.idEstado === 3 ||
                                solicitudActual.idEstado === 4 ||
                                solicitudActual.idEstado === 5
                                ? "El estado se actualizará automáticamente al escanear y surtir los materiales."
                                : "La solicitud se encuentra en un estado final y no permite más cambios."}
                        </div>
                    )}
                </section>

                {mensajeExito && (
                    <div style={successStyle}>
                        {mensajeExito}
                    </div>
                )}

                {error && (
                    <div style={errorStyle}>
                        {error}
                    </div>
                )}

                <h3 style={sectionTitleStyle}>
                    Materiales solicitados
                </h3>

                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr style={headerRowStyle}>
                                <th style={thStyle}>
                                    Material
                                </th>

                                <th style={thStyle}>
                                    Descripción
                                </th>

                                <th style={thStyle}>
                                    Solicitado
                                </th>

                                <th style={thStyle}>
                                    Surtido
                                </th>

                                <th style={thStyle}>
                                    Pendiente
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {solicitudActual.materiales.map(
                                (material) => {
                                    const pendiente =
                                        material.cantidadSolicitada -
                                        material.cantidadSurtida;

                                    return (
                                        <tr
                                            key={
                                                material.idDetalle
                                            }
                                        >
                                            <td style={tdStyle}>
                                                <strong>
                                                    {
                                                        material.numeroParteMaterial
                                                    }
                                                </strong>
                                            </td>

                                            <td style={tdStyle}>
                                                {
                                                    material.descripcionMaterial
                                                }
                                            </td>

                                            <td style={tdStyle}>
                                                {
                                                    material.cantidadSolicitada
                                                }
                                            </td>

                                            <td style={tdStyle}>
                                                {
                                                    material.cantidadSurtida
                                                }
                                            </td>

                                            <td style={tdStyle}>
                                                {pendiente}
                                            </td>
                                        </tr>
                                    );
                                }
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={actionsStyle}>
                    <button
                        type="button"
                        onClick={cerrarModal}
                        disabled={actualizando}
                        style={primaryButtonStyle}
                    >
                        Cerrar
                    </button>
                </div>
            </section>
        </div>
    );
}

interface DatoProps {
    etiqueta: string;
    valor: string;
}

function Dato({
    etiqueta,
    valor,
}: DatoProps) {
    return (
        <div style={dataCardStyle}>
            <span style={dataLabelStyle}>
                {etiqueta}
            </span>

            <strong style={dataValueStyle}>
                {valor || "Sin información"}
            </strong>
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
    maxWidth: "950px",
    maxHeight: "90vh",
    overflowY: "auto" as const,
    boxSizing: "border-box" as const,
    padding: "28px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
        "0 25px 70px rgba(15, 23, 42, 0.3)",
};

const headerStyle = {
    display: "flex",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "22px",
};

const titleStyle = {
    margin: 0,
    color: "#102957",
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

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "12px",
    marginBottom: "22px",
};

const dataCardStyle = {
    padding: "14px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
};

const dataLabelStyle = {
    display: "block",
    marginBottom: "5px",
    color: "#64748b",
    fontSize: "12px",
};

const dataValueStyle = {
    color: "#102957",
    fontSize: "14px",
};

const statusSectionStyle = {
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "18px",
    padding: "17px",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    background: "#eff6ff",
};

const statusTitleStyle = {
    margin: 0,
    color: "#102957",
    fontSize: "17px",
};

const statusDescriptionStyle = {
    margin: "5px 0 0",
    color: "#475569",
    fontSize: "13px",
};

const statusControlsStyle = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
};

const selectStyle = {
    minWidth: "220px",
    minHeight: "42px",
    padding: "9px 12px",
    border: "1px solid #93c5fd",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#102957",
    fontSize: "14px",
};

const updateButtonStyle = {
    minHeight: "42px",
    padding: "9px 16px",
    border: "none",
    borderRadius: "8px",
    background: "#1d4ed8",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
};

const finalStateStyle = {
    padding: "10px 13px",
    borderRadius: "8px",
    background: "#e2e8f0",
    color: "#475569",
    fontSize: "13px",
};

const successStyle = {
    marginBottom: "18px",
    padding: "13px 15px",
    border: "1px solid #bbf7d0",
    borderRadius: "9px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "14px",
    fontWeight: "700",
};

const errorStyle = {
    marginBottom: "18px",
    padding: "13px 15px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: "14px",
};

const sectionTitleStyle = {
    margin: "0 0 14px",
    color: "#102957",
};

const tableContainerStyle = {
    overflowX: "auto" as const,
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
};

const tableStyle = {
    width: "100%",
    borderCollapse: "collapse" as const,
};

const headerRowStyle = {
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

const actionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "22px",
};

const primaryButtonStyle = {
    minHeight: "42px",
    padding: "10px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#102957",
    color: "#ffffff",
    fontWeight: "700",
    cursor: "pointer",
};