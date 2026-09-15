namespace SistemaAlmacen.Api.Dtos;

// Recibe un material que será agregado a una solicitud.
public sealed class CrearSolicitudDetalleDto
{
    public int IdMaterial { get; set; }

    public decimal CantidadSolicitada { get; set; }
}
