namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar una familia.
public sealed class ActualizarFamiliaDto
{
    public int IdProyecto { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }
}