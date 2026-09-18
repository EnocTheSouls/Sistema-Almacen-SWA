import {
  obtenerToken,
} from "./authService";

export interface UsuarioSesion {
  idUsuario: number;
  username: string;
  nombre: string;
  role: string;
}

// Nombres usados por ASP.NET Core dentro del JWT.
const CLAIM_NAME_IDENTIFIER =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";

const CLAIM_NAME =
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";

const CLAIM_ROLE =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

// Obtiene la sesión real desde el token JWT.
export function obtenerUsuarioActual():
  UsuarioSesion | null {
  const token =
    obtenerToken();

  if (!token) {
    return null;
  }

  try {
    const partes =
      token.split(".");

    if (partes.length !== 3) {
      return null;
    }

    const payloadCodificado =
      partes[1]
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    // Agrega el relleno necesario para Base64.
    const padding =
      payloadCodificado.length % 4;

    const payloadCompleto =
      padding === 0
        ? payloadCodificado
        : payloadCodificado.padEnd(
            payloadCodificado.length +
              (4 - padding),
            "="
          );

    const payload =
      JSON.parse(
        window.atob(
          payloadCompleto
        )
      ) as Record<
        string,
        unknown
      >;

    const idUsuarioTexto =
      obtenerTextoClaim(
        payload,
        [
          CLAIM_NAME_IDENTIFIER,
          "nameid",
          "sub",
        ]
      );

    const username =
      obtenerTextoClaim(
        payload,
        [
          "unique_name",
          "username",
          "sub",
        ]
      );

    const nombre =
      obtenerTextoClaim(
        payload,
        [
          CLAIM_NAME,
          "name",
        ]
      );

    const rolOriginal =
      obtenerTextoClaim(
        payload,
        [
          CLAIM_ROLE,
          "role",
        ]
      );

    return {
      idUsuario:
        Number(
          idUsuarioTexto
        ) || 0,

      username:
        username ||
        nombre ||
        "Usuario",

      nombre:
        nombre ||
        username ||
        "Usuario",

      role:
        normalizarRol(
          rolOriginal
        ),
    };
  } catch (error) {
    console.error(
      "No se pudo leer el usuario del token:",
      error
    );

    return null;
  }
}

// Busca el primer claim disponible.
function obtenerTextoClaim(
  payload: Record<
    string,
    unknown
  >,
  posiblesNombres: string[]
): string {
  for (
    const nombreClaim
    of posiblesNombres
  ) {
    const valor =
      payload[nombreClaim];

    if (
      typeof valor === "string" &&
      valor.trim()
    ) {
      return valor.trim();
    }

    if (
      Array.isArray(valor) &&
      typeof valor[0] === "string"
    ) {
      return valor[0].trim();
    }
  }

  return "";
}

// Convierte los nombres del backend
// al formato usado por el frontend.
function normalizarRol(
  rol: string
): string {
  const rolNormalizado =
    rol
      .trim()
      .toUpperCase();

  if (
    rolNormalizado ===
    "ADMINISTRADOR"
  ) {
    return "ADMIN";
  }

  if (
    rolNormalizado ===
    "MATERIALISTA"
  ) {
    return "MATERIALISTA";
  }

  if (
    rolNormalizado ===
    "PRODUCCION" ||
    rolNormalizado ===
    "PRODUCCIÓN"
  ) {
    return "PRODUCCION";
  }

  if (
    rolNormalizado ===
    "SUPERVISOR"
  ) {
    return "SUPERVISOR";
  }

  return rolNormalizado ||
    "SIN ROL";
}