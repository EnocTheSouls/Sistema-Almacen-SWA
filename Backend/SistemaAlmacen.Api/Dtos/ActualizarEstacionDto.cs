namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar una estación.
public sealed class ActualizarEstacionDto
{
    public int IdFamilia { get; set; }

    public string Nombre { get; set; } =
        string.Empty;

    public bool Activo { get; set; }
}