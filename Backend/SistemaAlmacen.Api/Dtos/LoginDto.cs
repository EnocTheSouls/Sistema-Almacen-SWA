namespace SistemaAlmacen.Api.Dtos;

//Recibe las credenciales para iniciar sesion;

public sealed class LoginDto
{
    public string NombreUsuario{get; set;} = string.Empty;

    public string Password {get; set;} = string.Empty;
    
}