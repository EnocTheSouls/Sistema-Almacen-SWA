namespace SistemaAlmacen.Api.Dtos;

// Contiene los datos seguros que la API devuelve al frontend.
public sealed class UsuarioRespuestaDto
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public string NombreUsuario { get; set; } = string.Empty;

    public int IdRol { get; set; }

    public string NombreRol { get; set; } = string.Empty;

    public bool Activo { get; set; }

    public DateTime FechaRegistro { get; set; }
}