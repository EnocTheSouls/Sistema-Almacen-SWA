export interface CrearSolicitudDetalleRequest {
  idMaterial: number;
  cantidadSolicitada: number;
}

export interface CrearSolicitudRequest {
  idProyecto: number;
  idFamilia: number;
  idEstacion: number;
  origenSolicitud: "MANUAL" | "ESCANEO";
  materiales: CrearSolicitudDetalleRequest[];
}

export interface SolicitudDetalle {
  idDetalle: number;
  idSolicitud: number;
  idMaterial: number;
  numeroParteMaterial: string;
  descripcionMaterial: string;
  unidadMedida: string | null;
  tipoEmpaque: string | null;
  stdPack: number | null;
  cantidadSolicitada: number;
  cantidadSurtida: number;
}

export interface Solicitud {
  idSolicitud: number;
  idEstado: number;
  nombreEstado: string;
  colorEstado: string | null;
  fechaSolicitud: string;

  idProyecto: number | null;
  nombreProyecto: string;

  idFamilia: number | null;
  nombreFamilia: string;

  idEstacion: number | null;
  nombreEstacion: string;

  idUsuarioSolicitud: number;
  nombreUsuarioSolicitud: string;
  origenSolicitud: string;
  materiales: SolicitudDetalle[];
}