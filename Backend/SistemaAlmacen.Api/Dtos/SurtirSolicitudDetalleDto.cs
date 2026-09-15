namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para surtir un material solicitado.
public sealed class SurtirSolicitudDetalleDto
{
    // Detalle específico de la solicitud que será surtido.
    public long IdDetalle { get; set; }

    // Ubicación física desde donde se retirará el material.
    public int IdUbicacion { get; set; }

    // Cantidad que el materialista está surtiendo.
    public decimal Cantidad { get; set; }

    // Referencia operativa opcional.
    public string? Referencia { get; set; }

    // Observaciones opcionales del materialista.
    public string? Comentarios { get; set; }
}