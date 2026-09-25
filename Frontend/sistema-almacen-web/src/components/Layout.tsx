import {
  useEffect,
  useState,
} from "react";

import type {
  ReactNode,
} from "react";

import {
  createPortal,
} from "react-dom";

import {
  Sidebar,
} from "./Sidebar";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({
  children,
}: LayoutProps) {
  // Lee el usuario real desde el token JWT.
  const currentUser =
    obtenerUsuarioActual();

  // Controla la ventana de perfil.
  const [
    mostrarPerfil,
    setMostrarPerfil,
  ] = useState(false);

  // Detecta si la aplicación se muestra en celular.
  const [
    modoMovil,
    setModoMovil,
  ] = useState(
    () =>
      window.matchMedia(
        "(max-width: 768px)"
      ).matches
  );

  // Controla el menú lateral en celular.
  const [
    menuMovilAbierto,
    setMenuMovilAbierto,
  ] = useState(false);

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 768px)"
      );

    const actualizarModoMovil = (
      event: MediaQueryListEvent
    ) => {
      setModoMovil(
        event.matches
      );

      if (!event.matches) {
        setMenuMovilAbierto(false);
      }
    };

    setModoMovil(
      mediaQuery.matches
    );

    mediaQuery.addEventListener(
      "change",
      actualizarModoMovil
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        actualizarModoMovil
      );
    };
  }, []);




  const abrirPerfil = () => {
    setMostrarPerfil(true);
  };

  const cerrarPerfil = () => {
    setMostrarPerfil(false);
  };

  return (
    <div style={layoutStyle}>
      <Sidebar
        modoMovil={modoMovil}
        abiertoMovil={menuMovilAbierto}
        onCerrarMovil={() => {
          setMenuMovilAbierto(false);
        }}
      />

      {modoMovil && menuMovilAbierto && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => {
            setMenuMovilAbierto(false);
          }}
          style={mobileOverlayStyle}
        />
      )}

      <div style={contentContainerStyle}>
        <header
          style={{
            ...headerStyle,
            height:
              modoMovil ? "60px" : "70px",

            padding:
              modoMovil
                ? "0 14px"
                : "0 30px",
            position: "sticky",
            top: 0,
            zIndex: 1000,
          }}
        >
          <div style={headerLeftStyle}>
            {modoMovil && (
              <button
                type="button"
                title="Abrir menú"
                aria-label="Abrir menú"
                aria-expanded={
                  menuMovilAbierto
                }
                onClick={() => {
                  setMenuMovilAbierto(true);
                }}
                style={menuButtonStyle}
              >
                <MenuIcon />
              </button>
            )}

            <div
              style={{
                ...systemNameStyle,
                fontSize:
                  modoMovil
                    ? "17px"
                    : "22px",
              }}
            >
              Sistema Almacén
            </div>
          </div>


          <div style={profileAreaStyle}>
            {!modoMovil && (
              <span style={roleStyle}>
                {currentUser?.role ??
                  "SIN ROL"}
              </span>
            )}


            <button
              type="button"
              onClick={abrirPerfil}
              title="Configurar perfil"
              aria-label="Configurar perfil"
              style={settingsButtonStyle}
            >
              <GearIcon />
            </button>
          </div>
        </header>

        <main
          style={{
            ...mainStyle,
            padding:
              modoMovil
                ? "12px"
                : "30px",
          }}
        >
          {children}
        </main>
      </div>

      {mostrarPerfil &&
        createPortal(
          <div
            style={modalOverlayStyle}
            onMouseDown={cerrarPerfil}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="tituloPerfil"
              style={profileModalStyle}
              onMouseDown={(event) => {
                event.stopPropagation();
              }}
            >
              <div style={modalHeaderStyle}>
                <div>
                  <h2
                    id="tituloPerfil"
                    style={modalTitleStyle}
                  >
                    Mi perfil
                  </h2>

                  <p
                    style={
                      modalDescriptionStyle
                    }
                  >
                    Información de la cuenta
                    actualmente autenticada.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarPerfil}
                  title="Cerrar"
                  aria-label="Cerrar perfil"
                  style={
                    modalCloseButtonStyle
                  }
                >
                  ×
                </button>
              </div>

              <div
                style={
                  profileInformationStyle
                }
              >
                <span
                  style={
                    profileLabelStyle
                  }
                >
                  Nombre de usuario
                </span>

                <strong
                  style={
                    profileValueStyle
                  }
                >
                  {currentUser?.username ??
                    "Usuario"}
                </strong>
              </div>

              <div
                style={
                  profileInformationStyle
                }
              >
                <span
                  style={
                    profileLabelStyle
                  }
                >
                  Nombre visible
                </span>

                <strong
                  style={
                    profileValueStyle
                  }
                >
                  {currentUser?.nombre ??
                    currentUser?.username ??
                    "Usuario"}
                </strong>
              </div>

              <div
                style={
                  profileInformationStyle
                }
              >
                <span
                  style={
                    profileLabelStyle
                  }
                >
                  Rol
                </span>

                <strong
                  style={
                    profileValueStyle
                  }
                >
                  {currentUser?.role ??
                    "SIN ROL"}
                </strong>
              </div>

              <div
                style={
                  profileNoticeStyle
                }
              >
                En el siguiente paso se podrá
                modificar el nombre visible y
                guardar el cambio en MySQL.
              </div>

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  onClick={cerrarPerfil}
                  style={primaryButtonStyle}
                >
                  Cerrar
                </button>
              </div>
            </section>
          </div>,
          document.body
        )}


    </div>
  );
}

// Icono para abrir el menú móvil.
function MenuIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}



// Icono de configuración del perfil.
function GearIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="2"
      />

      <path
        d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.55v.1h-3v-.1a1.7 1.7 0 0 0-1.03-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.04 15a1.7 1.7 0 0 0-1.55-1.03H5.4v-3h.09A1.7 1.7 0 0 0 7.04 9.94a1.7 1.7 0 0 0-.34-1.87l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.87.34A1.7 1.7 0 0 0 11.72 4.74v-.09h3v.09a1.7 1.7 0 0 0 1.03 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.87 1.7 1.7 0 0 0 1.55 1.03h.09v3h-.09A1.7 1.7 0 0 0 19.4 15Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const layoutStyle = {
  width: "100%",
  minHeight: "100vh",
  display: "flex",
  overflowX: "hidden" as const,
};

const contentContainerStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column" as const,
  minWidth: 0,
  minHeight: "100vh",
  width: "100%",
  overflowX: "hidden" as const,
};

const headerStyle = {
  height: "70px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 30px",
  borderBottom:
    "1px solid #e5e7eb",
  background: "#ffffff",
};

const systemNameStyle = {
  color: "#102957",
  fontSize: "22px",
  fontWeight: "700",
};

const profileAreaStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const roleStyle = {
  color: "#102957",
  fontSize: "14px",
  fontWeight: "700",
  letterSpacing: "0.5px",
};

const settingsButtonStyle = {
  width: "38px",
  height: "38px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#102957",
  cursor: "pointer",
};

const mainStyle = {
  flex: 1,
  padding: "30px",
  background: "#f1f5f9",
};

const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "rgba(15, 23, 42, 0.62)",
};

const profileModalStyle = {
  width: "100%",
  maxWidth: "470px",
  padding: "27px",
  boxSizing: "border-box" as const,
  borderRadius: "16px",
  background: "#ffffff",
  color: "#102957",
  boxShadow:
    "0 25px 70px rgba(15, 23, 42, 0.35)",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "18px",
  marginBottom: "22px",
};

const modalTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "24px",
};

const modalDescriptionStyle = {
  margin: "6px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const modalCloseButtonStyle = {
  width: "37px",
  height: "37px",
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "24px",
  cursor: "pointer",
};

const profileInformationStyle = {
  marginBottom: "14px",
  padding: "14px",
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
  background: "#f8fafc",
};

const profileLabelStyle = {
  display: "block",
  marginBottom: "5px",
  color: "#64748b",
  fontSize: "12px",
  fontWeight: "700",
};

const profileValueStyle = {
  color: "#102957",
  fontSize: "15px",
};

const profileNoticeStyle = {
  marginTop: "18px",
  padding: "12px 14px",
  borderRadius: "9px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "13px",
  lineHeight: 1.5,
};

const modalActionsStyle = {
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
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const headerLeftStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const menuButtonStyle = {
  width: "40px",
  height: "40px",
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#102957",
  cursor: "pointer",
};

const mobileOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 2990,
  padding: 0,
  border: "none",
  background:
    "rgba(15, 23, 42, 0.58)",
  cursor: "pointer",
};
``