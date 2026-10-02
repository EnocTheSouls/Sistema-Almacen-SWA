namespace SistemaAlmacen.Api.Models.Mrp;

public class RequerimientoMrpImportacion
{
    public string? NumeroRequisicion { get; set; }

    public string NumeroMaterial { get; set; } =
        string.Empty;

    public string? NombreMaterial { get; set; }

    public string? Familia { get; set; }

    public string? Proyecto { get; set; }

    public DateTime FechaEta { get; set; }

    public decimal CantidadRequerida { get; set; }

    public decimal PackSize { get; set; }

    public int BolsasNecesarias { get; set; }
}
