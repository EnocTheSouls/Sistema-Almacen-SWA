namespace SistemaAlmacen.Api.Dtos;

// Resultado del cambio de estación
// realizado sobre un detalle BOM.
public sealed class CambioEstacionDetalleBomDto
{
    public long IdBomDetalle { get; set; }

    public int IdMaterial { get; set; }

    public string NumeroMaterial { get; set; } =
        string.Empty;

    public int? IdEstacionAnterior { get; set; }

    public string EstacionAnterior { get; set; } =
        string.Empty;

    public int IdEstacionNueva { get; set; }

    public string EstacionNueva { get; set; } =
        string.Empty;

    public bool RequiereReemplazarQr { get; set; }

    public string ContenidoQr { get; set; } =
        string.Empty;
}