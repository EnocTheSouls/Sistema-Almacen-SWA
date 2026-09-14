namespace SistemaAlmacen.Api.Models;

// Representa una posición física dentro de un rack.
public sealed class Ubicacion
{
    public int IdUbicacion { get; set; }

    public int IdRack { get; set; }

    // Facilita mostrar la ruta física completa.
    public int IdZona { get; set; }

    public string CodigoZona { get; set; } = string.Empty;

    public string NombreZona { get; set; } = string.Empty;

    public string NombreRack { get; set; } = string.Empty;

    public string Nivel { get; set; } = string.Empty;

    public string Posicion { get; set; } = string.Empty;

    public decimal? CapacidadMaxima { get; set; }

    public bool Activo { get; set; }
}