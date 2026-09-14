namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para registrar una entrada.
public sealed class EntradaInventarioDto
{
    public int IdMaterial { get; set; }

    public int IdUbicacion { get; set; }

    public decimal Cantidad { get; set; }

    public string? Referencia { get; set; }

    public string? Comentarios { get; set; }
}