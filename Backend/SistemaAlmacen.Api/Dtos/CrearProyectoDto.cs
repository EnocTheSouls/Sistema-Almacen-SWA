namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear un proyecto.
public sealed class CrearProyectoDto
{
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }
}