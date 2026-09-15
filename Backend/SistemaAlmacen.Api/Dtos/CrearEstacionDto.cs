namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear una estación.
public sealed class CrearEstacionDto
{
    public int IdFamilia { get; set; }

    public string Nombre { get; set; } =
        string.Empty;
}