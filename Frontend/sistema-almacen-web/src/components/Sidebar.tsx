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

interface SidebarProps {
  modoMovil?: boolean;
  abiertoMovil?: boolean;
  onCerrarMovil?: () => void;
}

export function Sidebar({
  modoMovil = false,
  abiertoMovil = false,
  onCerrarMovil,
}: SidebarProps) {
  const navigate =
    useNavigate();

  const location =
    useLocation();
  // Lee el usuario autenticado desde el JWT.
  const currentUser =
    obtenerUsuarioActual();


  const rolActual =
    currentUser?.role
      ?.trim()
      .toUpperCase() ?? "";
  const esAdministrador =
    rolActual === "ADMIN" ||
    rolActual === "ADMINISTRADOR";

  const esSupervisor =
    rolActual === "SUPERVISOR";

  // Solo controla qué módulos son visibles.
  const puedeVerModulosAdministrativos =
    esAdministrador ||
    esSupervisor;

  const esProduccion =
    rolActual === "PRODUCCION";

  const esSurtidor =
    rolActual === "SURTIDOR";


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
    modoMovil
      ? false
      : !fijado &&
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

  const linkStyle = (
    path: string
  ) => {
    const activa =
      rutaActiva(path);

    return {
      position:
        "relative" as const,

      display: "flex",
      alignItems: "center",

      width: "100%",
      minHeight: "43px",

      boxSizing:
        "border-box" as const,

      padding: "10px 13px",

      border:
        activa
          ? "1px solid rgba(147, 197, 253, 0.24)"
          : "1px solid transparent",

      borderRadius: "9px",

      background:
        activa
          ? "linear-gradient(90deg, rgba(37, 99, 235, 0.34) 0%, rgba(96, 165, 250, 0.12) 100%)"
          : "transparent",

      boxShadow:
        activa
          ? "inset 3px 0 0 #60a5fa"
          : "none",

      color:
        activa
          ? "#ffffff"
          : "#dbeafe",

      fontSize: "14px",

      fontWeight:
        activa
          ? "800"
          : "600",

      textDecoration: "none",

      whiteSpace:
        "nowrap" as const,

      transition:
        "background 180ms ease, border-color 180ms ease, color 180ms ease, transform 180ms ease",
    };
  };





  // Cierra el menú móvil al seleccionar una opción.
  const cerrarMenuMovil = () => {
    if (modoMovil) {
      onCerrarMovil?.();
    }
  };

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

  const manejarCierreSesion = () => {
    cerrarSesion();

    onCerrarMovil?.();

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
        width: modoMovil
          ? "280px"
          : collapsed
            ? "42px"
            : "260px",

        position:
          modoMovil
            ? "fixed"
            : "relative",

        top:
          modoMovil
            ? 0
            : undefined,

        left:
          modoMovil
            ? 0
            : undefined,

        height:
          modoMovil
            ? "100dvh"
            : "auto",

        maxHeight:
          modoMovil
            ? "100dvh"
            : "none",

        minHeight:
          modoMovil
            ? "100dvh"
            : "100%",

        alignSelf:
          modoMovil
            ? undefined
            : "stretch",


        transform:
          modoMovil &&
            !abiertoMovil
            ? "translateX(-100%)"
            : "translateX(0)",

        flexShrink: 0,
        display: "flex",

        flexDirection:
          "column",

        overflowX: "hidden",

        overflowY:
          modoMovil
            ? "auto"
            : "visible",

        boxSizing:
          "border-box",

        background:
          "linear-gradient(180deg, #102957 0%, #0b2148 58%, #081a39 100%)",

        color: "#ffffff",

        boxShadow:
          "8px 0 30px rgba(15, 23, 42, 0.16)",


        transition:
          modoMovil
            ? "transform 240ms ease"
            : "width 280ms ease",

        zIndex:
          modoMovil
            ? 3000
            : 20,
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
              width:
                modoMovil
                  ? "280px"
                  : "260px",

              flexShrink: 0,
              padding: "18px 16px 14px",
              boxSizing: "border-box",

              borderBottom:
                "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  minWidth: 0,
                  flex: "1 1 auto",
                }}
              >
                <strong
                  style={{
                    display: "center",
                    overflow: "hidden",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "800",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",

                  }}
                >
                  MENU
                </strong>


              </div>

              {!modoMovil && (
                <button
                  type="button"
                  onClick={cambiarFijado}
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
                    width: "30px",
                    height: "30px",
                    flexShrink: 0,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    padding: 0,

                    border:
                      "1px solid rgba(255, 255, 255, 0.14)",
                    borderRadius: "8px",

                    background: fijado
                      ? "#2563eb"
                      : "rgba(255, 255, 255, 0.07)",

                    color: "#ffffff",
                    cursor: "pointer",

                    boxShadow: fijado
                      ? "0 4px 10px rgba(37, 99, 235, 0.28)"
                      : "none",

                    transition:
                      "background-color 180ms ease, transform 180ms ease",
                  }}
                >
                  <PinIcon fijado={fijado} />
                </button>
              )}
            </div>
          </div>

          <nav
            style={{
              width:
                modoMovil
                  ? "280px"
                  : "225px",

              flex: "1 1 auto",
              minHeight: 0,

              display: "flex",
              flexDirection: "column",
              gap: "7px",

              padding: "10px 18px 24px",

              boxSizing: "border-box",

              overflow: "visible",
            }}
          >


            <span
              style={
                sectionStyle
              }
            >
              NAVEGACION
            </span>
            {puedeVerModulosAdministrativos && (
              <Link
                to="/dashboard"
                onClick={cerrarMenuMovil}
                style={linkStyle(
                  "/dashboard"
                )}
              >
                Inicio
              </Link>
            )}
            {esAdministrador && (
              <Link
                to="/usuarios"
                onClick={cerrarMenuMovil}
                style={linkStyle(
                  "/usuarios"
                )}
              >
                Usuarios
              </Link>
            )}

            {puedeVerModulosAdministrativos && (
              <Link
                to="/proyectos"
                onClick={cerrarMenuMovil}
                style={linkStyle(
                  "/proyectos"
                )}
              >
                Proyectos
              </Link>
            )}

            <Link
              to="/solicitudes"
              onClick={cerrarMenuMovil}
              style={linkStyle(
                "/solicitudes"
              )}
            >
              Requisiciones
            </Link>

            {!esProduccion && (
              <Link
                to="/materiales"
                onClick={cerrarMenuMovil}
                style={linkStyle(
                  "/materiales"
                )}
              >
                Materiales
              </Link>
            )}

            {(
              puedeVerModulosAdministrativos ||
              esSurtidor
            ) && (
                <Link
                  to="/inventario"
                  onClick={cerrarMenuMovil}
                  style={linkStyle(
                    "/inventario"
                  )}
                >
                  Plan MRP
                </Link>
              )}
            {puedeVerModulosAdministrativos && (
              <Link
                to="/kardex"
                onClick={cerrarMenuMovil}
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
              width:
                modoMovil
                  ? "280px"
                  : "260px",

              // Forma parte del contenido del menú.
              marginTop: "auto",

              flex: "0 0 auto",
              flexShrink: 0,

              position: "relative",



              padding: "14px 18px 18px",

              boxSizing: "border-box",

              background:
                "linear-gradient(180deg, #0b2148 0%, #081a3a 100%)",

              boxShadow:
                "0 -8px 18px rgba(7, 20, 45, 0.22)",

              zIndex: 5,
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
                  minHeight: "44px",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  padding: "10px 14px",

                  border:
                    "1px solid rgba(255, 255, 255, 0.18)",

                  borderRadius: "9px",

                  background:
                    "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",

                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "700",

                  cursor: "pointer",

                  boxShadow:
                    "0 5px 12px rgba(127, 29, 29, 0.28)",

                  boxSizing: "border-box",

                  transition:
                    "transform 160ms ease, background-color 160ms ease",
                }}

              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )
      }
    </aside >
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
  display: "flex",
  alignItems: "center",
  gap: "8px",

  marginTop: "8px",
  marginBottom: "6px",
  padding: "0 10px",

  color: "#7fa2cf",
  fontSize: "10px",
  fontWeight: "800",

  letterSpacing: "1.8px",
  textTransform: "uppercase" as const,
};