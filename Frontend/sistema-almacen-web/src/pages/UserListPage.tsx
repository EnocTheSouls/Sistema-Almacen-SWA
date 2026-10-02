import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import {
  Layout,
} from "../components/Layout";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

import {
  actualizarUsuario,
  obtenerUsuarios,
} from "../services/usuarioService";

import type {
  ActualizarUsuarioRequest,
  User,
} from "../types/user";

export function UserListPage() {
  const navigate =
    useNavigate();

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

  const esAdministrador =
    rolActual === "ADMIN" ||
    rolActual === "ADMINISTRADOR";

  const esSupervisor =
    rolActual === "SUPERVISOR";

  const [
    usuarios,
    setUsuarios,
  ] = useState<User[]>([]);

  const [
    usuarioEditando,
    setUsuarioEditando,
  ] = useState<User | null>(
    null
  );

  const [
    formulario,
    setFormulario,
  ] = useState<ActualizarUsuarioRequest>({
    nombre: "",
    nombreUsuario: "",
    idRol: 3,
    activo: true,
  });

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroRol,
    setFiltroRol,
  ] = useState("TODOS");

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const cargarUsuarios =
    async () => {
      try {
        setCargando(true);
        setError("");

        const datos =
          await obtenerUsuarios();

        setUsuarios(datos);
      } catch (errorCarga) {
        console.error(
          "Error al cargar usuarios:",
          errorCarga
        );

        setError(
          obtenerMensajeError(
            errorCarga,
            "No se pudieron cargar los usuarios."
          )
        );
      } finally {
        setCargando(false);
      }
    };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const usuariosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      return usuarios.filter(
        (usuario) => {
          const coincideRol =
            filtroRol === "TODOS" ||
            usuario.nombreRol
              ?.trim()
              .toUpperCase()
              .normalize("NFD")
              .replace(
                /[\u0300-\u036f]/g,
                ""
              ) === filtroRol;

          if (!coincideRol) {
            return false;
          }

          if (!texto) {
            return true;
          }

          return (
            usuario.nombre
              .toLowerCase()
              .includes(texto) ||
            usuario.nombreUsuario
              .toLowerCase()
              .includes(texto) ||
            usuario.nombreRol
              .toLowerCase()
              .includes(texto)
          );
        }
      );
    }, [
      usuarios,
      busqueda,
      filtroRol,
    ]);

  const puedeGestionarUsuario = (
    usuario: User
  ) => {
    if (esAdministrador) {
      return true;
    }

    if (!esSupervisor) {
      return false;
    }

    const rolObjetivo =
      usuario.nombreRol
        ?.trim()
        .toUpperCase()
        .normalize("NFD")
        .replace(
          /[\u0300-\u036f]/g,
          ""
        ) ?? "";

    return (
      rolObjetivo !== "ADMIN" &&
      rolObjetivo !== "ADMINISTRADOR"
    );
  };

  const abrirEdicion = (
    usuario: User
  ) => {
    if (
      !puedeGestionarUsuario(
        usuario
      )
    ) {
      setError(
        "No tienes permiso para modificar este usuario."
      );
      return;
    }

    setUsuarioEditando(
      usuario
    );

    setFormulario({
      nombre:
        usuario.nombre,

      nombreUsuario:
        usuario.nombreUsuario,

      idRol:
        usuario.idRol,

      activo:
        usuario.activo,
    });

    setError("");
    setMensajeExito("");
  };

  const cerrarEdicion = () => {
    if (guardando) {
      return;
    }

    setUsuarioEditando(
      null
    );
  };

  const guardarEdicion =
    async () => {
      if (!usuarioEditando) {
        return;
      }

      const nombreLimpio =
        formulario.nombre.trim();

      const usuarioLimpio =
        formulario.nombreUsuario.trim();

      if (!nombreLimpio) {
        setError(
          "El nombre completo es obligatorio."
        );
        return;
      }

      if (!usuarioLimpio) {
        setError(
          "El nombre de usuario es obligatorio."
        );
        return;
      }

      if (
        esSupervisor &&
        formulario.idRol === 1
      ) {
        setError(
          "Un supervisor no puede asignar el rol Administrador."
        );
        return;
      }

      try {
        setGuardando(true);
        setError("");

        const actualizado =
          await actualizarUsuario(
            usuarioEditando.idUsuario,
            {
              nombre:
                nombreLimpio,

              nombreUsuario:
                usuarioLimpio,

              idRol:
                formulario.idRol,

              activo:
                formulario.activo,
            }
          );

        setUsuarios(
          (usuariosActuales) =>
            usuariosActuales.map(
              (usuario) =>
                usuario.idUsuario ===
                  actualizado.idUsuario
                  ? actualizado
                  : usuario
            )
        );

        setUsuarioEditando(null);

        setMensajeExito(
          `El usuario ${actualizado.nombreUsuario} se actualizó correctamente.`
        );
      } catch (errorActualizacion) {
        console.error(
          "Error al actualizar usuario:",
          errorActualizacion
        );

        setError(
          obtenerMensajeError(
            errorActualizacion,
            "No se pudo actualizar el usuario."
          )
        );
      } finally {
        setGuardando(false);
      }
    };

  const cambiarEstado =
    async (
      usuario: User
    ) => {
      if (
        !puedeGestionarUsuario(
          usuario
        )
      ) {
        setError(
          "No tienes permiso para modificar este usuario."
        );
        return;
      }

      const accion =
        usuario.activo
          ? "desactivar"
          : "activar";

      const confirmar =
        window.confirm(
          `¿Deseas ${accion} al usuario ${usuario.nombreUsuario}?`
        );

      if (!confirmar) {
        return;
      }

      try {
        setGuardando(true);
        setError("");

        const actualizado =
          await actualizarUsuario(
            usuario.idUsuario,
            {
              nombre:
                usuario.nombre,

              nombreUsuario:
                usuario.nombreUsuario,

              idRol:
                usuario.idRol,

              activo:
                !usuario.activo,
            }
          );

        setUsuarios(
          (usuariosActuales) =>
            usuariosActuales.map(
              (item) =>
                item.idUsuario ===
                  actualizado.idUsuario
                  ? actualizado
                  : item
            )
        );

        setMensajeExito(
          `El usuario ${actualizado.nombreUsuario} quedó ${actualizado.activo
            ? "activo"
            : "inactivo"
          }.`
        );
      } catch (errorEstado) {
        console.error(
          "Error al cambiar estado:",
          errorEstado
        );

        setError(
          obtenerMensajeError(
            errorEstado,
            "No se pudo cambiar el estado del usuario."
          )
        );
      } finally {
        setGuardando(false);
      }
    };

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section style={cardStyle}>
          <header style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Administración de usuarios
              </h1>

              <p style={descriptionStyle}>
                Consulta, edita, activa o desactiva
                las cuentas del sistema.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/usuarios/nuevo"
                )
              }
              style={primaryButtonStyle}
            >
              + Nuevo usuario
            </button>
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

          <div style={filtersStyle}>
            <div style={formGroupStyle}>
              <label
                htmlFor="buscarUsuario"
                style={labelStyle}
              >
                Buscar usuario
              </label>

              <input
                id="buscarUsuario"
                type="text"
                value={busqueda}
                onChange={(event) =>
                  setBusqueda(
                    event.target.value
                  )
                }
                placeholder="Nombre, usuario o rol"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="filtroRol"
                style={labelStyle}
              >
                Rol
              </label>

              <select
                id="filtroRol"
                value={filtroRol}
                onChange={(event) =>
                  setFiltroRol(
                    event.target.value
                  )
                }
                style={inputStyle}
              >
                <option value="TODOS">
                  Todos
                </option>

                <option value="ADMINISTRADOR">
                  Administrador
                </option>

                <option value="SUPERVISOR">
                  Supervisor
                </option>

                <option value="MATERIALISTA">
                  Materialista
                </option>

                <option value="PRODUCCION">
                  Producción
                </option>

                <option value="SURTIDOR">
                  Surtidor
                </option>
              </select>
            </div>
          </div>

          {cargando ? (
            <div style={messageStyle}>
              Cargando usuarios...
            </div>
          ) : usuariosFiltrados.length ===
            0 ? (
            <div style={messageStyle}>
              No se encontraron usuarios.
            </div>
          ) : (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th style={thStyle}>
                      Usuario
                    </th>

                    <th style={thStyle}>
                      Nombre
                    </th>

                    <th style={thStyle}>
                      Rol
                    </th>

                    <th style={thStyle}>
                      Estado
                    </th>

                    <th
                      style={{
                        ...thStyle,
                        textAlign:
                          "right",
                      }}
                    >
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {usuariosFiltrados.map(
                    (usuario) => (
                      <tr
                        key={
                          usuario.idUsuario
                        }
                      >
                        <td style={tdStyle}>
                          <strong>
                            {
                              usuario.nombreUsuario
                            }
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          {usuario.nombre}
                        </td>

                        <td style={tdStyle}>
                          {usuario.nombreRol}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              ...statusStyle,

                              background:
                                usuario.activo
                                  ? "#dcfce7"
                                  : "#fee2e2",

                              color:
                                usuario.activo
                                  ? "#166534"
                                  : "#991b1b",
                            }}
                          >
                            {usuario.activo
                              ? "Activo"
                              : "Inactivo"}
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              "right",
                          }}
                        >
                          {puedeGestionarUsuario(
                            usuario
                          ) ? (
                            <div style={rowActionsStyle}>
                              <button
                                type="button"
                                onClick={() =>
                                  abrirEdicion(
                                    usuario
                                  )
                                }
                                disabled={
                                  guardando
                                }
                                style={editButtonStyle}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  cambiarEstado(
                                    usuario
                                  )
                                }
                                disabled={
                                  guardando
                                }
                                style={
                                  usuario.activo
                                    ? deactivateButtonStyle
                                    : activateButtonStyle
                                }
                              >
                                {usuario.activo
                                  ? "Desactivar"
                                  : "Activar"}
                              </button>
                            </div>
                          ) : (
                            <span style={restrictedStyle}>
                              Protegido
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {usuarioEditando && (
        <div style={modalOverlayStyle}>
          <section style={modalStyle}>
            <header style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  Editar usuario
                </h2>

                <p style={descriptionStyle}>
                  Actualiza los datos y permisos
                  de la cuenta.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  cerrarEdicion
                }
                style={closeButtonStyle}
              >
                ×
              </button>
            </header>

            <div style={modalFormStyle}>
              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  Nombre completo
                </label>

                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        nombre:
                          event.target.value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  Nombre de usuario
                </label>

                <input
                  type="text"
                  value={
                    formulario.nombreUsuario
                  }
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        nombreUsuario:
                          event.target.value,
                      })
                    )
                  }
                  style={inputStyle}
                />
              </div>

              <div style={formGroupStyle}>
                <label style={labelStyle}>
                  Rol
                </label>

                <select
                  value={formulario.idRol}
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        idRol:
                          Number(
                            event.target.value
                          ),
                      })
                    )
                  }
                  style={inputStyle}
                >
                  {esAdministrador && (
                    <option value={1}>
                      Administrador
                    </option>
                  )}

                  <option value={2}>
                    Supervisor
                  </option>

                  <option value={3}>
                    Materialista
                  </option>

                  <option value={4}>
                    Producción
                  </option>

                  <option value={47}>
                    Surtidor
                  </option>
                </select>
              </div>

              <label style={checkboxStyle}>
                <input
                  type="checkbox"
                  checked={formulario.activo}
                  onChange={(event) =>
                    setFormulario(
                      (actual) => ({
                        ...actual,
                        activo:
                          event.target.checked,
                      })
                    )
                  }
                />

                Usuario activo
              </label>
            </div>

            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={
                  cerrarEdicion
                }
                disabled={guardando}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={
                  guardarEdicion
                }
                disabled={guardando}
                style={primaryButtonStyle}
              >
                {guardando
                  ? "Guardando..."
                  : "Guardar cambios"}
              </button>
            </div>
          </section>
        </div>
      )}
    </Layout>
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
      error.response?.status === 403
    ) {
      return "No tienes permiso para realizar esta operación.";
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
  padding: "28px",
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "30px",
};

const descriptionStyle = {
  margin: "6px 0 0",
  color: "#64748b",
};

const filtersStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(250px, 2fr) minmax(180px, 1fr)",
  gap: "12px",
  marginBottom: "20px",
  padding: "15px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#f8fafc",
};

const formGroupStyle = {
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
};

const tableContainerStyle = {
  width: "100%",
  overflowX: "auto" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
  background: "#f1f5f9",
};

const thStyle = {
  padding: "12px",
  borderBottom: "2px solid #cbd5e1",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #e2e8f0",
  color: "#334155",
  fontSize: "14px",
};

const statusStyle = {
  display: "inline-block",
  minWidth: "65px",
  padding: "5px 9px",
  borderRadius: "999px",
  fontSize: "12px",
  fontWeight: "800",
  textAlign: "center" as const,
};

const rowActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "7px",
};

const primaryButtonStyle = {
  minHeight: "42px",
  padding: "9px 16px",
  border: "none",
  borderRadius: "8px",
  background: "#102957",
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: "42px",
  padding: "9px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: "700",
  cursor: "pointer",
};

const editButtonStyle = {
  minHeight: "34px",
  padding: "6px 11px",
  border: "1px solid #93c5fd",
  borderRadius: "7px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontWeight: "700",
  cursor: "pointer",
};

const deactivateButtonStyle = {
  minHeight: "34px",
  padding: "6px 11px",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: "700",
  cursor: "pointer",
};

const activateButtonStyle = {
  ...deactivateButtonStyle,
  border: "1px solid #bbf7d0",
  background: "#f0fdf4",
  color: "#166534",
};

const restrictedStyle = {
  color: "#94a3b8",
  fontSize: "12px",
  fontWeight: "700",
};

const messageStyle = {
  padding: "35px",
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

const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 3000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  background:
    "rgba(15, 23, 42, 0.6)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "620px",
  padding: "24px",
  borderRadius: "14px",
  background: "#ffffff",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "16px",
  marginBottom: "20px",
};

const modalTitleStyle = {
  margin: 0,
  color: "#102957",
};

const modalFormStyle = {
  display: "grid",
  gap: "15px",
};

const closeButtonStyle = {
  width: "36px",
  height: "36px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "22px",
  cursor: "pointer",
};

const checkboxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "#334155",
  fontWeight: "700",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "9px",
  marginTop: "22px",
};