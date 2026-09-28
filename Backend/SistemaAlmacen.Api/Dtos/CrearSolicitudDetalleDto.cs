namespace SistemaAlmacen.Api.Dtos;

// Recibe un material que será agregado a una solicitud.
public sealed class CrearSolicitudDetalleDto
{
    public int IdMaterial { get; set; }

    public decimal CantidadSolicitada { get; set; }

    // Contexto exacto obtenido desde el QR.
    public long? IdBomDetalle { get; set; }

    public int? IdArnes { get; set; }

    public int? IdEstacion { get; set; }
}