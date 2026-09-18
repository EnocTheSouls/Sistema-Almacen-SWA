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

// Representa el material devuelto por /api/materiales.
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