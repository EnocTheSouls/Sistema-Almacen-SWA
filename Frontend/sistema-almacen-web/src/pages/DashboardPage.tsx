import { Layout } from "../components/Layout";
import { useEffect, useState } from "react";
import { obtenerDashboard } from "../services/dashboardService";
import type { DashboardSolicitudes } from "../types/dashboard";
import { currentUser } from "../auth/userSession";

export function DashboardPage() {
  const [dashboard, setDashboard] =
    useState<DashboardSolicitudes | null>(
      null
    );

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const respuesta =
          await obtenerDashboard();

        setDashboard(respuesta);
      } catch (error) {
        console.error(error);
      }
    };

    cargarDashboard();
  }, []);

  return (
    <Layout>
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "30px",
            boxShadow:
              "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          <h1
            style={{
              marginTop: 0,
              color: "#102957",
            }}
          >
            Bienvenido, {currentUser.username}
          </h1>



          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            <div style={cardStyle}>
              <h3>Pendientes</h3>
              <h2>
                {dashboard?.pendientes ??
                  0}
              </h2>
            </div>

            <div style={cardStyle}>
              <h3>Asignadas</h3>
              <h2>
                {dashboard?.asignadas ??
                  0}
              </h2>
            </div>

            <div style={cardStyle}>
              <h3>En Surtido</h3>
              <h2>
                {dashboard?.enSurtido ??
                  0}
              </h2>
            </div>

            <div style={cardStyle}>
              <h3>Completadas</h3>
              <h2>
                {dashboard?.completadas ??
                  0}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const cardStyle = {
  background: "#f8fafc",
  padding: "20px",
  borderRadius: "12px",
  textAlign: "center" as const,
  border: "1px solid #e5e7eb",
};