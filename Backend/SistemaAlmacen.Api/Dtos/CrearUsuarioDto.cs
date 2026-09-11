namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear un usuario.
public sealed class CrearUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;

    public string NombreUsuario { get; set; } = string.Empty;

    // La contraseña se convierte en hash antes de guardarse.
    public string Password { get; set; } = string.Empty;

    public int IdRol { get; set; }
}