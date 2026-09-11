namespace SistemaAlmacen.Api.Models;

// Representa un usuario registrado en el sistema.
public sealed class Usuario
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string NombreUsuario { get; set; } = string.Empty;

    // El hash se utiliza internamente y no se envía al frontend.
    public string PasswordHash { get; set; } = string.Empty;

    public int IdRol { get; set; }

    public bool Activo { get; set; }

    public DateTime FechaRegistro { get; set; }
}