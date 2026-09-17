import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { obtenerToken } from "../auth/authService";

interface ProtectedRouteProps {
  children: ReactNode;
}

interface JwtPayload {
  exp?: number;
}

// Protege las páginas privadas y detecta JWT vencidos.
export function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const token = obtenerToken();

  // Si nunca inició sesión, regresa al Login.
  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  try {
    const partes = token.split(".");

    // Un JWT válido contiene tres partes.
    if (partes.length !== 3) {
      localStorage.removeItem("swa_token");

      return (
        <Navigate
          to="/sesion-expirada"
          replace
        />
      );
    }

    let payloadBase64 = partes[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    // Completa el padding necesario para atob.
    while (
      payloadBase64.length % 4 !== 0
    ) {
      payloadBase64 += "=";
    }

    const payload = JSON.parse(
      window.atob(payloadBase64)
    ) as JwtPayload;

    if (!payload.exp) {
      localStorage.removeItem("swa_token");

      return (
        <Navigate
          to="/sesion-expirada"
          replace
        />
      );
    }

    const fechaExpiracion =
      payload.exp * 1000;

    if (fechaExpiracion <= Date.now()) {
      localStorage.removeItem("swa_token");

      return (
        <Navigate
          to="/sesion-expirada"
          replace
        />
      );
    }

    return <>{children}</>;
  } catch (error) {
    console.error(
      "El JWT guardado no es válido:",
      error
    );

    localStorage.removeItem("swa_token");

    return (
      <Navigate
        to="/sesion-expirada"
        replace
      />
    );
  }
}