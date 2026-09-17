import { Layout } from "../components/Layout";

export function CreateMaterialPage() {
  return (
    <Layout>
      <h1>Nuevo Material</h1>

      <form
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          maxWidth: "500px",
          marginTop: "20px",
        }}
      >
        <input
          type="text"
          placeholder="Material Number"
        />

        <input
          type="text"
          placeholder="Descripción"
        />

        <input
          type="text"
          placeholder="Ubicación"
        />

        <input
          type="number"
          placeholder="Stock Inicial"
        />

        <input
          type="number"
          placeholder="Stock Mínimo"
        />

        <input
          type="text"
          placeholder="Código de Barras"
        />

        <button type="submit">
          Guardar Material
        </button>
      </form>
    </Layout>
  );
}
