namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar un rack.
public sealed class ActualizarRackDto
{
    public int IdZona { get; set; }

    public string Nombre { get; set; } = string.Empty;

    public int? AlturaTotal { get; set; }

    public bool Activo { get; set; }
}
