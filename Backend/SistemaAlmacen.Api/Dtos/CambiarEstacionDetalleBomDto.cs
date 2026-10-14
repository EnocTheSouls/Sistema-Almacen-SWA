namespace SistemaAlmacen.Api.Dtos;

// Datos enviados para cambiar la estación
// de un detalle BOM específico.
public sealed class CambiarEstacionDetalleBomDto
{
    public int IdEstacion { get; set; }

    public string Motivo { get; set; } =
        string.Empty;
}