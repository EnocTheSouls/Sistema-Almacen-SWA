namespace SistemaAlmacen.Api.Models;

// Representa un movimiento registrado en el Kardex.
public sealed class MovimientoInventario
{
    public long IdMovimiento { get; set; }

    public long? IdSolicitud { get; set; }

    public int? IdArnes { get; set; }

    public DateTime FechaHora { get; set; }

    public int IdMaterial { get; set; }

    // Material Number visible para el usuario.
    public string NumeroParteMaterial { get; set; } =
        string.Empty;

    // Material Name visible para el usuario.
    public string DescripcionMaterial { get; set; } =
        string.Empty;

    public string? UnidadMedida { get; set; }

    // Cantidad registrada en el movimiento.
    public decimal Cantidad { get; set; }

    public string TipoMovimiento { get; set; } =
        string.Empty;

    public int? IdUbicacionOrigen { get; set; }

    public string? UbicacionOrigen { get; set; }

    public int? IdUbicacionDestino { get; set; }

    public string? UbicacionDestino { get; set; }

    public int IdUsuario { get; set; }

    public string NombreUsuario { get; set; } =
        string.Empty;

    public string? Referencia { get; set; }

    public string? Comentarios { get; set; }
}