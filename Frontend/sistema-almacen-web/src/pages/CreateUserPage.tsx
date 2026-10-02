import {
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import axios from "axios";

import {
  useNavigate,
} from "react-router-dom";

import {
  Layout,
} from "../components/Layout";

import {
  crearUsuario,
} from "../services/usuarioService";


export function CreateUserPage() {
  const navigate =
    useNavigate();

  const [
    nombre,
    setNombre,
  ] = useState("");

  const [
    nombreUsuario,
    setNombreUsuario,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    idRol,
    setIdRol,
  ] = useState(4);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const manejarEnvio = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (enviando) {
      return;
    }

    setError("");
    setMensajeExito("");

    const nombreLimpio =
      nombre.trim();

    const usuarioLimpio =
      nombreUsuario.trim();

    if (!nombreLimpio) {
      setError(
        "Ingresa el nombre completo."
      );
      return;
    }

    if (!usuarioLimpio) {
      setError(
        "Ingresa el nombre de usuario."
      );
      return;
    }

    if (!password) {
      setError(
        "Ingresa una contraseña."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe contener al menos 8 caracteres."
      );
      return;
    }

    if (idRol <= 0) {
      setError(
        "Selecciona un rol."
      );
      return;
    }

    try {
      setEnviando(true);

      await crearUsuario({
        nombre:
          nombreLimpio,

        nombreUsuario:
          usuarioLimpio,

        password,

        idRol,
      });

      setMensajeExito(
        `El usuario ${usuarioLimpio} se creó correctamente.`
      );

      setNombre("");
      setNombreUsuario("");
      setPassword("");
      setIdRol(4);

      window.setTimeout(() => {
        navigate(
          "/usuarios",
          {
            replace: true,
          }
        );
      }, 900);
    } catch (errorCreacion) {
      console.error(
        "Error al crear usuario:",
        errorCreacion
      );

      setError(
        obtenerMensajeError(
          errorCreacion
        )
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section style={cardStyle}>
          <header style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Nuevo usuario
              </h1>

              <p style={descriptionStyle}>
                Registra una cuenta y asigna
                sus permisos de acceso.
              </p>
            </div>
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

          <form
            onSubmit={
              manejarEnvio
            }
            style={formStyle}
            noValidate
          >
            <div style={formGroupStyle}>
              <label
                htmlFor="nombre"
                style={labelStyle}
              >
                Nombre completo *
              </label>

              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(event) => {
                  setNombre(
                    event.target.value
                  );

                  setError("");
                }}
                placeholder="Ej. Usuario de Producción"
                disabled={enviando}
                maxLength={150}
                autoFocus
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="nombreUsuario"
                style={labelStyle}
              >
                Nombre de usuario *
              </label>

              <input
                id="nombreUsuario"
                type="text"
                value={nombreUsuario}
                onChange={(event) => {
                  setNombreUsuario(
                    event.target.value
                  );

                  setError("");
                }}
                placeholder="Ej. PROD"
                disabled={enviando}
                maxLength={50}
                autoComplete="off"
                style={inputStyle}
              />
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="password"
                style={labelStyle}
              >
                Contraseña *
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value
                  );

                  setError("");
                }}
                placeholder="Mínimo 8 caracteres"
                disabled={enviando}
                minLength={8}
                autoComplete="new-password"
                style={inputStyle}
              />

              <small style={helpStyle}>
                La contraseña será protegida por
                el servidor antes de guardarse.
              </small>
            </div>

            <div style={formGroupStyle}>
              <label
                htmlFor="idRol"
                style={labelStyle}
              >
                Rol *
              </label>

              <select
                id="idRol"
                value={idRol}
                onChange={(event) => {
                  setIdRol(
                    Number(
                      event.target.value
                    )
                  );

                  setError("");
                }}
                disabled={enviando}
                style={inputStyle}
              >
                <option value={1}>
                  Administrador
                </option>

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

            <div style={actionsStyle}>
              <button
                type="button"
                onClick={() => {
                  navigate(
                    "/usuarios"
                  );
                }}
                disabled={enviando}
                style={secondaryButtonStyle}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={enviando}
                style={{
                  ...primaryButtonStyle,

                  opacity:
                    enviando
                      ? 0.65
                      : 1,

                  cursor:
                    enviando
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {enviando
                  ? "Guardando..."
                  : "Guardar usuario"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </Layout>
  );
}

function obtenerMensajeError(
  error: unknown
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

    if (
      error.response?.status === 401
    ) {
      return "La sesión no es válida. Vuelve a iniciar sesión.";
    }

    if (
      error.response?.status === 403
    ) {
      return "Solo un administrador puede crear usuarios.";
    }

    if (!error.response) {
      return "No fue posible conectar con el servidor.";
    }
  }

  return "No se pudo crear el usuario.";
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "760px",
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

const formStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "18px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const labelStyle = {
  color: "#17335f",
  fontSize: "14px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  padding: "9px 12px",

  boxSizing:
    "border-box" as const,

  border:
    "1px solid #cbd5e1",

  borderRadius:
    "8px",

  background:
    "#ffffff",

  color:
    "#102957",

  fontSize:
    "14px",

  outline:
    "none",
};

const helpStyle = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: 1.4,
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "8px",
};

const primaryButtonStyle = {
  minHeight: "44px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#102957",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: "44px",
  padding: "10px 18px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
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
