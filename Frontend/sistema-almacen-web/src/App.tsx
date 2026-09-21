import type {
  ReactNode,
} from "react";

import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  obtenerUsuarioActual,
} from "./auth/userSession";

import {
  ProtectedRoute,
} from "./components/ProtectedRoute";

import {
  LoginPage,
} from "./pages/LoginPage";

import {
  SessionExpiredPage,
} from "./pages/SessionExpiredPage";

import {
  DashboardPage,
} from "./pages/DashboardPage";

import {
  UserListPage,
} from "./pages/UserListPage";

import {
  CreateUserPage,
} from "./pages/CreateUserPage";

import {
  EstructuraPage,
} from "./pages/EstructuraPage";

import {
  MaterialesPage,
} from "./pages/MaterialesPage";

import {
  SolicitudesPage,
} from "./pages/SolicitudesPage";

import {
  InventarioPage,
} from "./pages/InventarioPage";

import {
  BitacoraPage,
} from "./pages/BitacoraPage";

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginPage />
        }
      />

      <Route
        path="/sesion-expirada"
        element={
          <SessionExpiredPage />
        }
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
            <RutaAdministrador>
              <UserListPage />
            </RutaAdministrador>
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios/nuevo"
        element={
          <ProtectedRoute>
            <RutaAdministrador>
              <CreateUserPage />
            </RutaAdministrador>
          </ProtectedRoute>
        }
      />

      <Route
        path="/proyectos"
        element={
          <ProtectedRoute>
            <RutaAdministrador>
              <EstructuraPage />
            </RutaAdministrador>
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
            <RutaAdministrador>
              <BitacoraPage />
            </RutaAdministrador>
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
            to="/dashboard"
            replace
          />
        }
      />
    </Routes>
  );
}

interface RutaAdministradorProps {
  children: ReactNode;
}

// Lee el JWT cada vez que se renderiza una ruta administrativa.
function RutaAdministrador({
  children,
}: RutaAdministradorProps) {
  const usuario =
    obtenerUsuarioActual();

  const esAdministrador =
    usuario?.role === "ADMIN";

  if (!esAdministrador) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}