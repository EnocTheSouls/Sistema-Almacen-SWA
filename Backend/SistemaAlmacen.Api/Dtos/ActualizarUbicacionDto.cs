namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar una ubicación.
public sealed class ActualizarUbicacionDto
{
    public int IdRack { get; set; }

    public string Nivel { get; set; } = string.Empty;

    public string Posicion { get; set; } = string.Empty;

    public decimal? CapacidadMaxima { get; set; }

    public bool Activo { get; set; }
}