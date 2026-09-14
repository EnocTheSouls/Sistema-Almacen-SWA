namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear un material.
public sealed class CrearMaterialDto
{
    public string NumeroParteMaterial { get; set; } =
        string.Empty;

    public string Descripcion { get; set; } =
        string.Empty;

    public string? UnidadMedida { get; set; }

    public string? CodigoBarras { get; set; }

    public string? SerialKits { get; set; }

    public string GenericCode { get; set; } =
        string.Empty;

    // Indica si el material se entrega en bolsa, caja o rollo.
    public string? TipoEmpaque { get; set; }

    // Indica la cantidad contenida en cada empaque.
    public decimal? StdPack { get; set; }
}