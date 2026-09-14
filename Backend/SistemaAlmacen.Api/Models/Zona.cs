namespace SistemaAlmacen.Api.Models;

// Representa una zona física del almacén.
public sealed class Zona
{
    public int IdZona { get; set; }

    public string Codigo { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }
}