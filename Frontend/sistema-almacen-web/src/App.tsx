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
            <RutaAdministrativa>
              <DashboardPage />
            </RutaAdministrativa>
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute>
            <RutaAdministrativa>
              <UserListPage />
            </RutaAdministrativa>
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios/nuevo"
        element={
          <ProtectedRoute>
            <RutaAdministrativa>
              <CreateUserPage />
            </RutaAdministrativa>
          </ProtectedRoute>
        }
      />

      <Route
        path="/proyectos"
        element={
          <ProtectedRoute>
            <RutaAdministrativa>
              <EstructuraPage />
            </RutaAdministrativa>
          </ProtectedRoute>
        }
      />

      <Route
        path="/materiales"
        element={
          <ProtectedRoute>
            <RutaMateriales>
              <MaterialesPage />
            </RutaMateriales>
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
            <RutaInventario>
              <InventarioPage />
            </RutaInventario>
          </ProtectedRoute>
        }
      />

      <Route
        path="/kardex"
        element={
          <ProtectedRoute>
            <RutaAdministrativa>
              <BitacoraPage />
            </RutaAdministrativa>
          </ProtectedRoute>
        }
      />

      <Route
        path="/"
        element={
          <RutaInicial />
        }
      />
      <Route
        path="*"
        element={
          <RutaInicial />
        }
      />
    </Routes>
  );
}
interface RutaAdministrativaProps {
  children: ReactNode;
}

interface RutaMaterialesProps {
  children: ReactNode;
}

interface RutaInventarioProps {
  children: ReactNode;
}


// Permite visualizar los módulos administrativos
// a Administrador y Supervisor.
function RutaAdministrativa({
  children,
}: RutaAdministrativaProps) {
  const usuario =
    obtenerUsuarioActual();

  const rolActual =
    normalizarRol(
      usuario?.role
    );

  const puedeVerModulosAdministrativos =
    rolActual === "ADMIN" ||
    rolActual === "ADMINISTRADOR" ||
    rolActual === "SUPERVISOR";

  if (!puedeVerModulosAdministrativos) {
    return (
      <Navigate
        to="/solicitudes"
        replace
      />
    );
  }

  return children;
}

// Impide que Producción acceda
// al catálogo de materiales.
function RutaMateriales({
  children,
}: RutaMaterialesProps) {
  const usuario =
    obtenerUsuarioActual();

  const rolActual =
    normalizarRol(
      usuario?.role
    );

  if (rolActual === "PRODUCCION") {
    return (
      <Navigate
        to="/solicitudes"
        replace
      />
    );
  }

  return children;
}


// Permite Inventario a Administrador,
// Supervisor y Surtidor.
function RutaInventario({
  children,
}: RutaInventarioProps) {
  const usuario =
    obtenerUsuarioActual();

  const rolActual =
    normalizarRol(
      usuario?.role
    );

  const tieneAccesoInventario =
    rolActual === "ADMIN" ||
    rolActual === "ADMINISTRADOR" ||
    rolActual === "SUPERVISOR" ||
    rolActual === "SURTIDOR";

  if (!tieneAccesoInventario) {
    return (
      <Navigate
        to="/solicitudes"
        replace
      />
    );
  }

  return children;
}
// Envía a cada usuario a su página principal.
function RutaInicial() {
  const usuario =
    obtenerUsuarioActual();

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  const rolActual =
    normalizarRol(
      usuario.role
    );

  const vaAlDashboard =
    rolActual === "ADMIN" ||
    rolActual === "ADMINISTRADOR" ||
    rolActual === "SUPERVISOR";

  return (
    <Navigate
      to={
        vaAlDashboard
          ? "/dashboard"
          : "/solicitudes"
      }
      replace
    />
  );
}



// Normaliza el nombre del rol para hacer
// comparaciones sin diferencias de acentos.
function normalizarRol(
  rol: string | null | undefined
) {
  return (
    rol
      ?.trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(
        /[\u0300-\u036f]/g,
        ""
      ) ?? ""
  );
}

