namespace SistemaAlmacen.Api.Dtos;

// Recibe la información necesaria para crear una solicitud.
public sealed class CrearSolicitudDto
{
    public int IdProyecto { get; set; }

    public int IdFamilia { get; set; }

    public int IdEstacion { get; set; }

    // Los valores permitidos son ESCANEO y MANUAL.
    public string OrigenSolicitud { get; set; } =
        string.Empty;

    // Lista de materiales escaneados o capturados.
    public List<CrearSolicitudDetalleDto> Materiales { get; set; } =
        new();
}