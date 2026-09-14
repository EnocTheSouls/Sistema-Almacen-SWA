namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear una familia.
public sealed class CrearFamiliaDto
{
    public int IdProyecto { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }
}