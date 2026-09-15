import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { estaAutenticado } from "./auth/authService";
import { LoginPage } from "./pages/LoginPage";

function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/dashboard"
        element={
          estaAutenticado() ? (
            <main
              style={{
                minHeight: "100vh",
                padding: "40px",
                background: "#f1f5f9",
              }}
            >
              <h1>Dashboard de Almacén</h1>

              <p>
                El inicio de sesión funcionó correctamente.
              </p>
            </main>
          ) : (
            <Navigate
              to="/login"
              replace
            />
          )
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to={
              estaAutenticado()
                ? "/dashboard"
                : "/login"
            }
            replace
          />
        }
      />

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />
    </Routes>
  );
}

export default App;