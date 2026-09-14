namespace SistemaAlmacen.Api.Models;

// Representa la existencia de un material en una ubicación.
public sealed class Inventario
{
    public long IdInventario { get; set; }

    public int IdMaterial { get; set; }

    public string NumeroParteMaterial { get; set; } =
        string.Empty;

    public string DescripcionMaterial { get; set; } =
        string.Empty;

    public string? UnidadMedida { get; set; }

    public string? TipoEmpaque { get; set; }

    public decimal? StdPack { get; set; }

    public int IdUbicacion { get; set; }

    public string CodigoZona { get; set; } =
        string.Empty;

    public string NombreRack { get; set; } =
        string.Empty;

    public string Nivel { get; set; } =
        string.Empty;

    public string Posicion { get; set; } =
        string.Empty;

    // Cantidad que puede utilizarse para surtir.
    public decimal Disponible { get; set; }

    // Cantidad apartada para solicitudes.
    public decimal Reservado { get; set; }

    // Cantidad dañada, bloqueada o pendiente de revisión.
    public decimal NoDisponible { get; set; }

    public DateTime UltimaActualizacion { get; set; }

    // Calcula la cantidad física total registrada.
    public decimal CantidadTotal =>
        Disponible + Reservado + NoDisponible;

    // Construye una ruta legible para el frontend.
    public string RutaUbicacion =>
        $"{CodigoZona} / {NombreRack} / " +
        $"{Nivel} / {Posicion}";
}
