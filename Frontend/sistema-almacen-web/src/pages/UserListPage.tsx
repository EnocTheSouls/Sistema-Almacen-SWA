import { useNavigate } from "react-router-dom";
import { Layout } from "../components/Layout";

export function UserListPage() {
  const navigate = useNavigate();

  const usuarios = [
    {
      id: 1,
      usuario: "acamargo",
      nombre: "Almacen Camargo",
      rol: "Administrador",
      estado: "Activo",
    },
    {
      id: 2,
      usuario: "jrojas",
      nombre: "Juan Rojas",
      rol: "Supervisor",
      estado: "Activo",
    },
  ];

  return (
    <Layout>
      <h1
        style={{
          color: "#102957",
          marginBottom: "20px",
        }}
      >
        Administración de Usuarios
      </h1>

      <button
        onClick={() => navigate("/usuarios/nuevo")}
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
        Nuevo Usuario
      </button>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "white",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#e2e8f0",
            }}
          >
            <th
              style={{
                padding: "12px",
                border: "1px solid #cbd5e1",
              }}
            >
              Usuario
            </th>

            <th
              style={{
                padding: "12px",
                border: "1px solid #cbd5e1",
              }}
            >
              Nombre
            </th>

            <th
              style={{
                padding: "12px",
                border: "1px solid #cbd5e1",
              }}
            >
              Rol
            </th>

            <th
              style={{
                padding: "12px",
                border: "1px solid #cbd5e1",
              }}
            >
              Estado
            </th>
          </tr>
        </thead>

        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id}>
              <td
                style={{
                  padding: "12px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {usuario.usuario}
              </td>

              <td
                style={{
                  padding: "12px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {usuario.nombre}
              </td>

              <td
                style={{
                  padding: "12px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {usuario.rol}
              </td>

              <td
                style={{
                  padding: "12px",
                  border: "1px solid #cbd5e1",
                }}
              >
                {usuario.estado}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Layout>
  );
}