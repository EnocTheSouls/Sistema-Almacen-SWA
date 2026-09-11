namespace SistemaAlmacen.Api.Dtos;

// Devuelve el token y los datos seguros del usuario autenticado.
public sealed class LoginRespuestaDto
{
    public string Token { get; set; } = string.Empty;

    public DateTime ExpiraEn { get; set; }

    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string NombreUsuario { get; set; } = string.Empty;

    public int IdRol { get; set; }

    public string NombreRol { get; set; } = string.Empty;
}