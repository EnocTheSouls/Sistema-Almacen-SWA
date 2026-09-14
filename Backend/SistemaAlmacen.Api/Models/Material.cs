namespace SistemaAlmacen.Api.Models;

// Representa un material registrado en el almacén.
public sealed class Material
{
    public int IdMaterial { get; set; }

    public string NumeroParteMaterial { get; set; } =
        string.Empty;

    public string Descripcion { get; set; } =
        string.Empty;

    public string? UnidadMedida { get; set; }

    public string? CodigoBarras { get; set; }

    public string? SerialKits { get; set; }

    public string GenericCode { get; set; } =
        string.Empty;

    // Indica cómo se entrega físicamente el material.
    public string? TipoEmpaque { get; set; }

    // Indica cuántas unidades contiene cada empaque.
    public decimal? StdPack { get; set; }

    public bool Activo { get; set; }
}