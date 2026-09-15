namespace SistemaAlmacen.Api.Models;

// Representa el encabezado de una solicitud de materiales.
public sealed class Solicitud
{
    public long IdSolicitud { get; set; }

    public int IdEstado { get; set; }

    public string NombreEstado { get; set; } =
        string.Empty;

    public string? ColorEstado { get; set; }

    public DateTime FechaSolicitud { get; set; }

    public int IdProyecto { get; set; }

    public string NombreProyecto { get; set; } =
        string.Empty;

    public int IdFamilia { get; set; }

    public string NombreFamilia { get; set; } =
        string.Empty;

    public int IdEstacion { get; set; }

    public string NombreEstacion { get; set; } =
        string.Empty;

    public int IdUsuarioSolicitud { get; set; }

    public string NombreUsuarioSolicitud { get; set; } =
        string.Empty;

    // Indica si se originó por escaneo o captura manual.
    public string OrigenSolicitud { get; set; } =
        string.Empty;

    // Contiene la lista de materiales solicitados.
    public List<SolicitudDetalle> Materiales { get; set; } =
        new();

    // Suma la cantidad solicitada de todos los materiales.
    public decimal CantidadTotalSolicitada =>
        Materiales.Sum(
            detalle => detalle.CantidadSolicitada
        );

    // Suma la cantidad surtida de todos los materiales.
    public decimal CantidadTotalSurtida =>
        Materiales.Sum(
            detalle => detalle.CantidadSurtida
        );
}