import axios from "axios";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  guardarToken,
  iniciarSesion,
} from "../auth/authService";
import "./LoginPage.css";

// Pantalla de acceso al Sistema Web de Almacen.
export function LoginPage() {
  const navigate = useNavigate();

  // Datos capturados en el formulario.
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [password, setPassword] = useState("");

  // Mensaje mostrado cuando ocurre un error.
  const [mensajeError, setMensajeError] = useState("");

  // Evita enviar el formulario varias veces.
  const [enviando, setEnviando] = useState(false);

  // Procesa el formulario de inicio de sesion.
  async function manejarEnvio(
    evento: FormEvent<HTMLFormElement>,
  ) {
    evento.preventDefault();
    setMensajeError("");
    if (!nombreUsuario.trim()) {
      setMensajeError(
        "Ingresa tu nombre de usuario."
      );
      return;
    }

    if (!password) {
      setMensajeError(
        "Ingresa tu contraseña."
      );
      return;
    }

    try {
      setEnviando(true);
      setMensajeError("");

      // Envía las credenciales al backend.
      const respuesta =
        await iniciarSesion({
          nombreUsuario:
            nombreUsuario.trim(),

          password,
        });

      // Guarda el token JWT recibido.
      guardarToken(
        respuesta.token
      );

      // Envía al usuario al Dashboard.
      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        setMensajeError(
          "El usuario o la contraseña son incorrectos."
        );
      } else if (
        axios.isAxiosError(error) &&
        !error.response
      ) {
        setMensajeError(
          "No fue posible conectar con el servidor. Comunícate con el administrador del sistema."
        );
      } else {
        setMensajeError(
          "Ocurrió un error al iniciar sesión. Inténtalo nuevamente."
        );
      }
    } finally {
      setEnviando(false);
    }
    try {
      setEnviando(true);

      // Envia las credenciales al backend.
      const respuesta = await iniciarSesion({
        nombreUsuario: nombreUsuario.trim(),
        password,
      });

      // Guarda el token JWT recibido.
      guardarToken(respuesta.token);

      // Envia al usuario al dashboard.
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401
      ) {
        setMensajeError(
          "El usuario o la contrasena son incorrectos.",
        );
      } else if (
        axios.isAxiosError(error) &&
        !error.response
      ) {
        setMensajeError(
          "No fue posible conectar con la API. Verifica que el backend este ejecutandose.",
        );
      } else {
        setMensajeError(
          "Ocurrio un error al iniciar sesion.",
        );
      }
    } finally {
      setEnviando(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <header className="login-header">
          <div className="login-logo">
            SWA
          </div>

          <div className="login-eyebrow">
            ALMACEN DX.O
          </div>

          <h1>
            Sistema de Almacen
          </h1>
        </header>

        <form
          className="login-form"
          onSubmit={manejarEnvio}
          noValidate
        >
          <div className="form-group">
            <label htmlFor="nombreUsuario">
              Nombre de usuario
            </label>

            <input
              id="nombreUsuario"
              name="nombreUsuario"
              type="text"
              value={nombreUsuario}
              onChange={(evento) => {
                setNombreUsuario(
                  evento.target.value
                );

                if (mensajeError) {
                  setMensajeError("");
                }
              }}
              autoComplete="username"
              placeholder="Ingresa tu usuario"
              disabled={enviando}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Contraseña
            </label>

            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(evento) => {
                setPassword(
                  evento.target.value
                );

                if (mensajeError) {
                  setMensajeError("");
                }
              }}
              autoComplete="current-password"
              placeholder="Ingresa tu contraseña"
              disabled={enviando}
            />
          </div>

          {mensajeError && (
            <div
              className="login-error"
              role="alert"
              aria-live="polite"
            >
              {mensajeError}
            </div>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={enviando}
          >
            {enviando
              ? "Verificando credenciales..."
              : "Ingresar al sistema"}
          </button>
        </form>

        <footer className="login-footer">
          <span>
            © 2026 Almacén Camargo, S.A. de C.V.
          </span>

          <span>
            Todos los derechos reservados.
          </span>
        </footer>
      </section>
    </main>
  );


}
