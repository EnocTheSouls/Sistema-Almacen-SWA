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
      setMensajeError("Escribe el nombre de usuario.");
      return;
    }

    if (!password) {
      setMensajeError("Escribe la contrasena.");
      return;
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
          <div className="login-logo">SWA</div>

          <div>
            <p className="login-eyebrow">
              Acceso operativo
            </p>

            <h1>Sistema de Almacen</h1>

            
          </div>
        </header>

        <form
          className="login-form"
          onSubmit={manejarEnvio}
        >
          <div className="form-group">
            <label htmlFor="nombreUsuario">
              Usuario
            </label>

            <input
              id="nombreUsuario"
              name="nombreUsuario"
              type="text"
              value={nombreUsuario}
              onChange={(evento) =>
                setNombreUsuario(evento.target.value)
              }
              autoComplete="username"
              placeholder="Ingresa el nombre de usuario"
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
              onChange={(evento) =>
                setPassword(evento.target.value)
              }
              autoComplete="current-password"
              placeholder="Ingresar contraseña"
              disabled={enviando}
            />
          </div>

          {mensajeError && (
            <div
              className="login-error"
              role="alert"
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
              ? "Iniciando sesion..."
              : "Iniciar sesion"}
          </button>
        </form>

        <footer className="login-footer">
          Gestion de materiales, solicitudes e inventario
        </footer>
      </section>
    </main>
  );
}
