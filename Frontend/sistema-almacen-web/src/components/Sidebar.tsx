import {
  useState,
} from "react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  cerrarSesion,
} from "../auth/authService";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

const SIDEBAR_FIXED_KEY =
  "sidebar_fijado";

export function Sidebar() {
  const navigate =
    useNavigate();

  const location =
    useLocation();


  // Lee el usuario real desde el JWT.
  const currentUser =
    obtenerUsuarioActual();


  const esAdministrador =
    currentUser?.role === "ADMIN";


  // Recupera la preferencia guardada en el navegador.
  const [
    fijado,
    setFijado,
  ] = useState(() => {
    return (
      localStorage.getItem(
        SIDEBAR_FIXED_KEY
      ) === "true"
    );
  });

  // Indica si el puntero está sobre el menú.
  const [
    punteroDentro,
    setPunteroDentro,
  ] = useState(false);

  // El menú se contrae si no está fijado
  // y el puntero se encuentra fuera.
  const collapsed =
    !fijado &&
    !punteroDentro;

  // Comprueba si una ruta está seleccionada.
  const rutaActiva = (
    path: string
  ) => {
    if (path === "/dashboard") {
      return (
        location.pathname === path
      );
    }

    return location.pathname.startsWith(
      path
    );
  };

  // Estilo para las opciones del menú.
  const linkStyle = (
    path: string
  ) => ({
    display: "block",
    width: "100%",
    boxSizing:
      "border-box" as const,
    padding: "12px 16px",

    borderLeft: rutaActiva(path)
      ? "5px solid #60a5fa"
      : "5px solid transparent",

    borderRadius: "8px",

    background: rutaActiva(path)
      ? "rgba(255, 255, 255, 0.13)"
      : "transparent",

    color: "#ffffff",
    fontSize: "15px",

    fontWeight: rutaActiva(path)
      ? "700"
      : "500",

    textDecoration: "none",

    whiteSpace:
      "nowrap" as const,

    transition:
      "background-color 180ms ease, border-color 180ms ease",
  });

  // Fija o libera el menú.
  const cambiarFijado = () => {
    const nuevoEstado =
      !fijado;

    setFijado(
      nuevoEstado
    );

    localStorage.setItem(
      SIDEBAR_FIXED_KEY,
      String(nuevoEstado)
    );
  };

  // Elimina el token y regresa al login.
  const manejarCierreSesion = () => {
    cerrarSesion();

    navigate(
      "/login"
    );
  };

  return (
    <aside
      onMouseEnter={() => {
        setPunteroDentro(
          true
        );
      }}
      onMouseLeave={() => {
        setPunteroDentro(
          false
        );
      }}
      style={{
        width: collapsed
          ? "42px"
          : "260px",

        position: "sticky",
        top: 0,
        height: "100vh",
        maxHeight: "100vh",
        alignSelf: "flex-start",
        flexShrink: 0,
        display: "flex",

        flexDirection:
          "column",

        overflow: "hidden",

        boxSizing:
          "border-box",

        background:
          "linear-gradient(180deg, #102957 0%, #0b2148 100%)",

        color: "#ffffff",

        boxShadow:
          "4px 0 15px rgba(15, 41, 87, 0.18)",

        transition:
          "width 280ms ease",

        zIndex: 20,
      }}
    >
      {collapsed ? (
        <div
          title="Acerca el puntero para abrir el menú"
          style={{
            width: "42px",
            height: "100vh",
            display: "flex",

            alignItems:
              "center",

            justifyContent:
              "center",

            cursor: "pointer",
          }}
        >
          <span
            style={{
              color: "#dbeafe",
              fontSize: "12px",
              fontWeight: "800",

              letterSpacing:
                "4px",

              writingMode:
                "vertical-rl",

              textOrientation:
                "mixed",

              transform:
                "rotate(180deg)",

              userSelect: "none",
            }}
          >
            MENÚ
          </span>
        </div>
      ) : (
        <>
          <div
            style={{
              width: "260px",

              padding:
                "20px 18px 0",

              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                position:
                  "relative",

                minHeight: "30px",
              }}
            >
              <div
                style={{
                  color: "#9fb4d4",
                  fontSize: "14px",
                  fontWeight: "800",

                  letterSpacing:
                    "3px",

                  lineHeight: "30px",

                  textAlign:
                    "center",
                }}
              >
                MENÚ
              </div>

              <button
                type="button"
                onClick={
                  cambiarFijado
                }
                title={
                  fijado
                    ? "Liberar menú"
                    : "Fijar menú abierto"
                }
                aria-label={
                  fijado
                    ? "Liberar menú"
                    : "Fijar menú abierto"
                }
                style={{
                  position:
                    "absolute",

                  top: "2px",
                  right: "0",

                  width: "26px",
                  height: "26px",

                  display: "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "center",

                  padding: 0,

                  border:
                    "1px solid rgba(255, 255, 255, 0.2)",

                  borderRadius:
                    "6px",

                  background: fijado
                    ? "#2563eb"
                    : "rgba(255, 255, 255, 0.08)",

                  color:
                    "#ffffff",

                  cursor:
                    "pointer",

                  transition:
                    "background-color 180ms ease",
                }}
              >
                <PinIcon
                  fijado={fijado}
                />
              </button>
            </div>

            <div
              style={{
                width: "45px",
                height: "3px",

                margin:
                  "12px auto 0",

                borderRadius:
                  "999px",

                background:
                  "#60a5fa",
              }}
            />
          </div>

          <nav
            style={{
              width: "260px",

              display: "flex",

              flexDirection:
                "column",

              gap: "7px",

              padding:
                "10px 18px 20px",

              boxSizing:
                "border-box",
            }}
          >
            <span
              style={
                sectionStyle
              }
            >
              GENERAL
            </span>

            <Link
              to="/dashboard"
              style={linkStyle(
                "/dashboard"
              )}
            >
              Dashboard
            </Link>

            {esAdministrador && (
              <>
                <Link
                  to="/usuarios"
                  style={linkStyle(
                    "/usuarios"
                  )}
                >
                  Usuarios
                </Link>

                <Link
                  to="/proyectos"
                  style={linkStyle(
                    "/proyectos"
                  )}
                >
                  Proyectos
                </Link>
              </>
            )}

            <Link
              to="/materiales"
              style={linkStyle(
                "/materiales"
              )}
            >
              Materiales
            </Link>

            <Link
              to="/solicitudes"
              style={linkStyle(
                "/solicitudes"
              )}
            >
              Solicitudes
            </Link>

            <Link
              to="/inventario"
              style={linkStyle(
                "/inventario"
              )}
            >
              Inventario
            </Link>

            {esAdministrador && (
              <Link
                to="/kardex"
                style={linkStyle(
                  "/kardex"
                )}
              >
                Bitácora
              </Link>
            )}

          </nav>

          <div
            style={{
              width: "260px",

              marginTop:
                "auto",

              padding: "18px",

              boxSizing:
                "border-box",
            }}
          >
            <div
              style={{
                paddingTop:
                  "18px",

                borderTop:
                  "1px solid rgba(255, 255, 255, 0.14)",
              }}
            >
              <div
                style={{
                  marginBottom:
                    "14px",

                  textAlign:
                    "center",
                }}
              >
                <div
                  style={{
                    overflow:
                      "hidden",

                    color:
                      "#ffffff",

                    fontSize:
                      "15px",

                    fontWeight:
                      "700",

                    textOverflow:
                      "ellipsis",

                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {currentUser?.username ?? "Usuario"}
                </div>

                <div
                  style={{
                    marginTop:
                      "4px",

                    color:
                      "#9fb4d4",

                    fontSize:
                      "12px",

                    fontWeight:
                      "700",

                    letterSpacing:
                      "1px",
                  }}
                >
                  {currentUser?.role ?? "SIN ROL"}

                </div>

              </div>

              <button
                type="button"
                onClick={
                  manejarCierreSesion
                }
                style={{
                  width: "100%",
                  minHeight: "43px",

                  padding:
                    "10px 14px",

                  border:
                    "1px solid rgba(255, 255, 255, 0.12)",

                  borderRadius:
                    "9px",

                  background:
                    "#c62828",

                  color:
                    "#ffffff",

                  fontSize:
                    "14px",

                  fontWeight:
                    "700",

                  cursor:
                    "pointer",
                }}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}

interface PinIconProps {
  fijado: boolean;
}

// Icono pequeño de pin sin librerías externas.
function PinIcon({
  fijado,
}: PinIconProps) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform: fijado
          ? "rotate(0deg)"
          : "rotate(-35deg)",

        transition:
          "transform 180ms ease",
      }}
    >
      <path
        d="M9 3h6l-1 5 3 3v2h-4v7l-1 2-1-2v-7H7v-2l3-3-1-5Z"
        fill="currentColor"
      />
    </svg>
  );
}

const sectionStyle = {
  display: "block",
  marginTop: "18px",
  marginBottom: "5px",
  color: "#9fb4d4",
  fontSize: "12px",
  fontWeight: "800",
  letterSpacing: "2px",
  textAlign: "center" as const,
};