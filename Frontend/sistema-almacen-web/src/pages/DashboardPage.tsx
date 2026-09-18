import {
  useEffect,
  useState,
} from "react";

import { Layout } from "../components/Layout";

import {
  obtenerDashboard,
} from "../services/dashboardService";

import type {
  DashboardSolicitudes,
} from "../types/dashboard";

import {
  currentUser,
} from "../auth/userSession";

export function DashboardPage() {
  const [
    dashboard,
    setDashboard,
  ] = useState<DashboardSolicitudes | null>(
    null
  );

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState("");

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        setCargando(true);
        setErrorCarga("");

        const respuesta =
          await obtenerDashboard();

        setDashboard(respuesta);
      } catch (error) {
        console.error(
          "Error al cargar el dashboard:",
          error
        );

        setErrorCarga(
          "No se pudieron cargar los indicadores."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

  // Agrupa los estados que representan una
  // solicitud actualmente en proceso.
  const solicitudesEnProceso =
    (dashboard?.enSurtido ?? 0) +
    (dashboard?.parciales ?? 0) +
    (dashboard?.faltantes ?? 0);

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section style={cardContainerStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Bienvenido,{" "}
                {currentUser.username}
              </h1>

              <p style={descriptionStyle}>
                Resumen general de las solicitudes
                de material.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                window.location.reload()
              }
              disabled={cargando}
              style={{
                ...refreshButtonStyle,
                opacity: cargando
                  ? 0.65
                  : 1,
              }}
            >
              {cargando
                ? "Actualizando..."
                : "Actualizar"}
            </button>
          </div>

          {errorCarga && (
            <div style={errorStyle}>
              {errorCarga}
            </div>
          )}

          {cargando ? (
            <div style={loadingStyle}>
              Cargando indicadores...
            </div>
          ) : (
            <div style={kpiGridStyle}>
              <KpiCard
                titulo="Pendientes"
                cantidad={
                  dashboard?.pendientes ?? 0
                }
                color="#92400e"
                fondo="#fef3c7"
                descripcion="Solicitudes esperando atención"
              />

              <KpiCard
                titulo="En proceso"
                cantidad={
                  solicitudesEnProceso
                }
                color="#1d4ed8"
                fondo="#dbeafe"
                descripcion="En surtido, parciales o faltantes"
              />

              <KpiCard
                titulo="Surtidas"
                cantidad={
                  dashboard?.completadas ?? 0
                }
                color="#166534"
                fondo="#dcfce7"
                descripcion="Material preparado por almacén"
              />
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}

interface KpiCardProps {
  titulo: string;
  cantidad: number;
  color: string;
  fondo: string;
  descripcion: string;
}

function KpiCard({
  titulo,
  cantidad,
  color,
  fondo,
  descripcion,
}: KpiCardProps) {
  return (
    <article
      style={{
        ...kpiCardStyle,
        background: fondo,
      }}
    >
      <h3
        style={{
          ...kpiTitleStyle,
          color,
        }}
      >
        {titulo}
      </h3>

      <strong
        style={{
          ...kpiNumberStyle,
          color,
        }}
      >
        {cantidad}
      </strong>

      <span
        style={{
          ...kpiDescriptionStyle,
          color,
        }}
      >
        {descripcion}
      </span>
    </article>
  );
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
};

const cardContainerStyle = {
  padding: "30px",
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "26px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "30px",
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const refreshButtonStyle = {
  minHeight: "42px",
  padding: "10px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const kpiGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(210px, 1fr))",
  gap: "18px",
};

const kpiCardStyle = {
  minHeight: "150px",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  padding: "22px",
  boxSizing: "border-box" as const,
  borderRadius: "12px",
  border: "1px solid rgba(148, 163, 184, 0.25)",
  textAlign: "center" as const,
};

const kpiTitleStyle = {
  margin: "0 0 10px",
  fontSize: "17px",
  fontWeight: "750",
};

const kpiNumberStyle = {
  display: "block",
  marginBottom: "9px",
  fontSize: "34px",
  lineHeight: 1,
};

const kpiDescriptionStyle = {
  maxWidth: "210px",
  fontSize: "12px",
  lineHeight: 1.4,
  opacity: 0.85,
};

const loadingStyle = {
  padding: "45px",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const errorStyle = {
  marginBottom: "20px",
  padding: "14px 16px",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "14px",
};
