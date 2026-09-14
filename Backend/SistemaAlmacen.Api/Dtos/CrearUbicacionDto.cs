namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear una ubicación.
public sealed class CrearUbicacionDto
{
    public int IdRack { get; set; }

    public string Nivel { get; set; } = string.Empty;

    public string Posicion { get; set; } = string.Empty;

    public decimal? CapacidadMaxima { get; set; }
}