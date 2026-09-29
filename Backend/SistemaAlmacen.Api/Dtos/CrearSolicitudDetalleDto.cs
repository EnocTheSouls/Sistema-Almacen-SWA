namespace SistemaAlmacen.Api.Dtos;

// Recibe un material que será agregado a una solicitud.
public sealed class CrearSolicitudDetalleDto
{
    public int IdMaterial { get; set; }

    // Contexto exacto obtenido desde el QR.
    public long? IdBomDetalle { get; set; }

    public int? IdArnes { get; set; }

    public int? IdEstacion { get; set; }

    // Indica si el material utiliza cantidad y bolsas.
    public bool RequiereCantidad { get; set; } = true;

    // Cantidad de bolsas completas seleccionadas.
    public int? CantidadBolsas { get; set; }

    // Standard Pack utilizado al crear la solicitud.
    public decimal? StdPackHistorico { get; set; }

    // Cantidad calculada en piezas.
    // Será 0 cuando el material no tenga Standard Pack.
    public decimal CantidadSolicitada { get; set; }
}