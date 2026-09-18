import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  obtenerUsuarioActual,
} from "./auth/userSession";



import { ProtectedRoute } from "./components/ProtectedRoute";

import { LoginPage } from "./pages/LoginPage";
import { SessionExpiredPage } from "./pages/SessionExpiredPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UserListPage } from "./pages/UserListPage";
import { CreateUserPage } from "./pages/CreateUserPage";
import { EstructuraPage } from "./pages/EstructuraPage";
import { MaterialesPage } from "./pages/MaterialesPage";
import { SolicitudesPage } from "./pages/SolicitudesPage";
import { InventarioPage } from "./pages/InventarioPage";
import { BitacoraPage } from "./pages/BitacoraPage";

function App() {
  const currentUser =
    obtenerUsuarioActual();

  const esAdministrador =
    currentUser?.role === "ADMIN";

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />

      <Route
        path="/sesion-expirada"
        element={<SessionExpiredPage />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            {esAdministrador ? (
              <UserListPage />
            ) : (
              <Navigate
                to="/dashboard"
                replace
              />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios/nuevo"
        element={
          <ProtectedRoute>
            {esAdministrador ? (
              <CreateUserPage />
            ) : (
              <Navigate
                to="/dashboard"
                replace
              />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/proyectos"
        element={
          <ProtectedRoute>
            {esAdministrador ? (
              <EstructuraPage />
            ) : (
              <Navigate
                to="/dashboard"
                replace
              />
            )}
          </ProtectedRoute>
        }
      />

      <Route
        path="/materiales"
        element={
          <ProtectedRoute>
            <MaterialesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/solicitudes"
        element={
          <ProtectedRoute>
            <SolicitudesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventario"
        element={
          <ProtectedRoute>
            <InventarioPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/kardex"
        element={
          <ProtectedRoute>
            <BitacoraPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
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
