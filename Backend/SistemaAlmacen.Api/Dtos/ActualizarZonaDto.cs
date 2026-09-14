namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar una zona.
public sealed class ActualizarZonaDto
{
    public string Codigo { get; set; } = string.Empty;

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }
}