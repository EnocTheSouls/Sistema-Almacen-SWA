namespace SistemaAlmacen.Api.Models;

// Representa la relación exacta utilizada
// para generar y validar una etiqueta QR.
public sealed class MaterialBarcodeRelationRow
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

    public int? IdEstacion { get; set; }

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

    public string CodigoBarras { get; set; } =
        string.Empty;

    // Contenido que se codificará en el QR.
    public string ContenidoQr =>
        $"SWA|V=1|BD={IdBomDetalle}" +
        $"|P={IdProyecto}" +
        $"|F={IdFamilia}" +
        $"|A={IdArnes}" +
        $"|E={IdEstacion ?? 0}" +
        $"|M={IdMaterial}" +
        $"|NP={NumeroParteMaterial}";
}