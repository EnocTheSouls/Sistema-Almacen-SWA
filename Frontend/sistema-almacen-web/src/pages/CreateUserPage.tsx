import { Layout } from "../components/Layout";

export function CreateUserPage() {
  return (
    <Layout>
      <h1>Nuevo Usuario</h1>

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
          placeholder="Nombre completo"
        />

        <input
          type="text"
          placeholder="Usuario"
        />

        <input
          type="email"
          placeholder="Correo"
        />

        <input
          type="password"
          placeholder="Contraseña"
        />

        <select>
          <option>Administrador</option>
          <option>Supervisor</option>
          <option>Operador</option>
        </select>

        <button type="submit">
          Guardar Usuario
        </button>
      </form>
    </Layout>
  );
}