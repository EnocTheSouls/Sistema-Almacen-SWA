export interface MaterialEstacion {
  idBomDetalle: number;

  idProyecto: number;
  proyecto: string;

  idFamilia: number;
  familia: string;

  idArnes: number;
  numeroArnes: string;
  disenoArnes: string;

  idEstacion: number | null;
  estacion: string;

  idMaterial: number;
  numeroParteMaterial: string;
  descripcion: string;

  genericCode: string;

  unidadMedida: string | null;
  tipoEmpaque: string | null;
  stdPack: number | null;

  codigoBarras: string;
  contenidoQr: string;
}