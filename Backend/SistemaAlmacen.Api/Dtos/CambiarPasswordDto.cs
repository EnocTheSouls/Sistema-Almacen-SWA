namespace SistemaAlmacen.Api.Dtos;

//Recibe las contraseñas para actualizar el acceso 
public sealed class  CambiarPasswordDto
{
    public string PasswordActual{get; set;} = string.Empty;

    public string PasswordNueva{get; set;} = string.Empty;
    
}
