namespace SistemaAlmacen.Api.Models;

// Representa un rack perteneciente a una zona.
public sealed class Rack
{
    public int IdRack { get; set; }

    public int IdZona { get; set; }

    // Facilita mostrar la zona en el frontend.
    public string CodigoZona { get; set; } = string.Empty;

    public string NombreZona { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public int? AlturaTotal { get; set; }

    public bool Activo { get; set; }
}