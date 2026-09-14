namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear una zona.
public sealed class CrearZonaDto
{
    public string Codigo { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }
}