import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";

export function MaterialListPage() {
  const navigate = useNavigate();

  const materiales = [
    {
      id: 1,
      materialNumber: "100001",
      descripcion: "Tornillo M8",
      ubicacion: "A-01",
      stock: 150,
      estado: "Activo",
    },
    {
      id: 2,
      materialNumber: "100002",
      descripcion: "Tuerca M8",
      ubicacion: "A-01",
      stock: 320,
      estado: "Activo",
    },
  ];

  return (
    <Layout>
      <h1>Materiales</h1>

      <button
        onClick={() => navigate("/materiales/nuevo")}
        style={{
          padding: "10px 16px",
          marginBottom: "20px",
          border: "none",
          borderRadius: "8px",
          backgroundColor: "#1c4e9c",
          color: "white",
          cursor: "pointer",
        }}
      >
        Nuevo Material
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
        }}
      >
        <thead>
          <tr>
            <th>Material</th>
            <th>Descripción</th>
            <th>Ubicación</th>
            <th>Stock</th>
            <th>Estado</th>
          </tr>
        </thead>

        <tbody>
          {materiales.map((material) => (
            <tr key={material.id}>
              <td>{material.materialNumber}</td>
              <td>{material.descripcion}</td>
              <td>{material.ubicacion}</td>
              <td>{material.stock}</td>
              <td>{material.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}