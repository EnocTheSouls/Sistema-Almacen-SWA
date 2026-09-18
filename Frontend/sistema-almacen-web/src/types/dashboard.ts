export interface DashboardSolicitudes {
  pendientes: number;
  asignadas: number;
  enSurtido: number;
  parciales: number;
  faltantes: number;

  // Por ahora esta propiedad representa
  // las solicitudes con estado Surtida.
  completadas: number;

  entregadas: number;
  canceladas: number;
}