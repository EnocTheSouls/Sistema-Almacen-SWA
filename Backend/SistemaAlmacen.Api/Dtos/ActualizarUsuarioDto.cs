namespace SistemaAlmacen.Api.Dtos;

//Recibe los datos permitidos para actualizar un usuario

public sealed class
ActualizarUsuarioDto
{
    public string Nombre { get; set; } = string.Empty;

    public string NombreUsuario { get; set; } = string.Empty;

    public int IdRol { get; set; }

    public bool Activo { get; set; }
}