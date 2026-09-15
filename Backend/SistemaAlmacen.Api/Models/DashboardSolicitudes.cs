namespace SistemaAlmacen.Api.Models;

// Representa el resumen de solicitudes para el dashboard de almacén.
public sealed class DashboardSolicitudes
{
    public int Pendientes { get; set; }

    public int Asignadas { get; set; }

    public int EnSurtido { get; set; }

    public int Parciales { get; set; }

    public int Faltantes { get; set; }

    public int Completadas { get; set; }

    public int Entregadas { get; set; }

    public int Canceladas { get; set; }

    // Solicitudes que todavía requieren atención operativa.
    public int TotalAbiertas =>
        Pendientes +
        Asignadas +
        EnSurtido +
        Parciales +
        Faltantes;

    // Total histórico de solicitudes registradas.
    public int TotalSolicitudes =>
        Pendientes +
        Asignadas +
        EnSurtido +
        Parciales +
        Faltantes +
        Completadas +
        Entregadas +
        Canceladas;
}