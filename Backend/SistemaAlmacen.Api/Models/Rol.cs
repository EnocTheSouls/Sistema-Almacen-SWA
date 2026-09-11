namespace SistemaAlmacen.Api.Models;

public sealed class Rol
{
    public int IdRol { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
}