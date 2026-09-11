using Microsoft.AspNetCore.SignalR;

namespace SistemaAlmacen.Api.Dtos;

// Contiene los datos internos necesarios para la validacion de acceso

public sealed class UsuarioLoginDto
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;

    //Se utiliza unicamente para varificar la contraseña
    public string PasswordHash { get; set; } = string.Empty;
    public int IdRol { get; set; }
    public string NombreRol { get; set; } = string.Empty;

    public bool Activo { get; set; }

}