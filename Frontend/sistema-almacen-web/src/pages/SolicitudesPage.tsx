import { useState } from "react";
import { Layout } from "../components/Layout";

export function SolicitudesPage() {
  const [materiales, setMateriales] = useState([
    {
      material: "",
      cantidad: "",
    },
  ]);

  const agregarMaterial = () => {
    setMateriales([
      ...materiales,
      {
        material: "",
        cantidad: "",
      },
    ]);
  };

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
              marginBottom: "25px",
              color: "#102957",
            }}
          >
            Nueva Solicitud
          </h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "15px",
              marginBottom: "25px",
            }}
          >
            <select style={inputStyle}>
              <option>
                Seleccionar Proyecto
              </option>
            </select>

            <select style={inputStyle}>
              <option>
                Seleccionar Familia
              </option>
            </select>

            <select style={inputStyle}>
              <option>
                Seleccionar Estación
              </option>
            </select>
          </div>

          <h3
            style={{
              color: "#102957",
              marginBottom: "15px",
            }}
          >
            Materiales Solicitados
          </h3>

          {materiales.map((_, index) => (
            <div
              key={index}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "3fr 1fr",
                gap: "10px",
                marginBottom: "10px",
              }}
            >
              <input
                style={inputStyle}
                placeholder="Material"
              />

              <input
                style={inputStyle}
                placeholder="Cantidad"
                type="number"
              />
            </div>
          ))}

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              onClick={agregarMaterial}
              style={secondaryButton}
            >
              + Agregar Material
            </button>

            <button
              type="button"
              style={primaryButton}
            >
              Enviar Solicitud
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}

const inputStyle = {
  padding: "12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  fontSize: "14px",
  outline: "none",
};

const primaryButton = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  background: "#102957",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
};

const secondaryButton = {
  padding: "12px 20px",
  border: "none",
  borderRadius: "8px",
  background: "#2563eb",
  color: "white",
  cursor: "pointer",
  fontWeight: "600",
};