namespace SistemaAlmacen.Api.Models;

// Representa un material incluido en una solicitud.
public sealed class SolicitudDetalle
{
    public long IdDetalle { get; set; }

    public long IdSolicitud { get; set; }

    public int IdMaterial { get; set; }

    // Número de parte que verá el usuario.
    public string NumeroParteMaterial { get; set; } =
        string.Empty;

    // Nombre o descripción del material.
    public string DescripcionMaterial { get; set; } =
        string.Empty;

    public string? UnidadMedida { get; set; }

    public string? TipoEmpaque { get; set; }

    public decimal? StdPack { get; set; }

    // Cantidad requerida por la línea.
    public decimal CantidadSolicitada { get; set; }

    // Cantidad entregada por almacén.
    public decimal CantidadSurtida { get; set; }

    // Cantidad que todavía falta por entregar.
    public decimal CantidadPendiente =>
        CantidadSolicitada - CantidadSurtida;
}