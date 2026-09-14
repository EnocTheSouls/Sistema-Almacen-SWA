namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear un rack.
public sealed class CrearRackDto
{
    public int IdZona { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public int? AlturaTotal { get; set; }
}