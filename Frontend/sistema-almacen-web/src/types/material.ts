export interface Material {
  id: number;
  materialNumber: string;
  descripcion: string;
  ubicacion: string;
  stock: number;
  stockMinimo: number;
  codigoBarras: string;
  activo: boolean;
}