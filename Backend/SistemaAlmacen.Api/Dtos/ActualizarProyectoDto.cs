namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar un proyecto.
public sealed class ActualizarProyectoDto
{
    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }
}
