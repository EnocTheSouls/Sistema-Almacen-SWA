namespace SistemaAlmacen.Api.Models;

//Representa una familia asociada a un proyecto.

public sealed  class Familia
{
    public int IdFamilia {get; set;}

    public int IdProyecto {get; set;}

    public string NombreProyecto {get; set;} = string.Empty;

     public string Nombre {get; set;} = string.Empty;
     
     public string? Descripcion {get; set;}

     public bool Activo {get; set;}

}