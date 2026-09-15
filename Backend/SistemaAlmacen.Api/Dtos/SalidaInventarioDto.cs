namespace SistemaAlmacen.Api.Dtos;

// Datos necesarios para registrar una salida.
public sealed class SalidaInventarioDto
{
    public int IdMaterial { get; set; }

    public int IdUbicacion { get; set; }

    public decimal Cantidad { get; set; }

    public string? Referencia { get; set; }

    public string? Comentarios { get; set; }
}