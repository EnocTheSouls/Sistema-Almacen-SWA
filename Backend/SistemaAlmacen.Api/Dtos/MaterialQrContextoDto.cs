namespace SistemaAlmacen.Api.Dtos;

// Contexto completo obtenido al validar
// una etiqueta QR de material.
public sealed class MaterialQrContextoDto
{
    public long IdBomDetalle { get; set; }

    public int IdProyecto { get; set; }

    public string Proyecto { get; set; } =
        string.Empty;

    public int IdFamilia { get; set; }

    public string Familia { get; set; } =
        string.Empty;

    public int IdArnes { get; set; }

    public string NumeroArnes { get; set; } =
        string.Empty;

    public string DisenoArnes { get; set; } =
        string.Empty;

    public int IdEstacion { get; set; }

    public string Estacion { get; set; } =
        string.Empty;

    public int IdMaterial { get; set; }

    public string NumeroParteMaterial { get; set; } =
        string.Empty;

    public string Descripcion { get; set; } =
        string.Empty;

    public string GenericCode { get; set; } =
        string.Empty;

    public string? UnidadMedida { get; set; }

    public string? TipoEmpaque { get; set; }

    public decimal? StdPack { get; set; }
}