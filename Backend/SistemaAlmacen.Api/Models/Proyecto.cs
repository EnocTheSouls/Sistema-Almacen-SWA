namespace SistemaAlmacen.Api.Models;

// Representa un proyecto registrado en el sistema.
public sealed class Proyecto
{
    public int IdProyecto { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public bool Activo { get; set; }
}