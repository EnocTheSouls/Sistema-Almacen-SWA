// Modelo utilizado por otras áreas antiguas del sistema.
export interface Material {
  id: number;
  idMaterial: number;
  materialNumber: string;
  descripcion: string;
  ubicacion: string;
  stock: number;
  stockMinimo: number;
  codigoBarras: string;
  activo: boolean;
}

// Material devuelto por /api/materiales.
export interface MaterialCatalogo {
  idMaterial: number;
  numeroParteMaterial: string;
  descripcion: string;
  unidadMedida: string | null;
  codigoBarras: string | null;
  serialKits: string | null;
  genericCode: string;
  tipoEmpaque: string | null;
  stdPack: number | null;
  activo: boolean;
}

// Datos enviados para registrar un material.
export interface CrearMaterialRequest {
  numeroParteMaterial: string;
  descripcion: string;
  unidadMedida: string | null;
  codigoBarras: string | null;
  serialKits: string | null;
  genericCode: string;
  tipoEmpaque: string | null;
  stdPack: number | null;
}

// Datos enviados para actualizar un material.
export interface ActualizarMaterialRequest
  extends CrearMaterialRequest {
  activo: boolean;
}