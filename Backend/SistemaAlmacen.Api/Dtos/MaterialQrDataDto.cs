namespace SistemaAlmacen.Api.Dtos;

// Valores internos contenidos en el QR.
public sealed class MaterialQrDataDto
{
    public int Version { get; set; }

    public long IdBomDetalle { get; set; }

    public int IdProyecto { get; set; }

    public int IdFamilia { get; set; }

    public int IdArnes { get; set; }

    public int IdEstacion { get; set; }

    public int IdMaterial { get; set; }

    public string NumeroParteMaterial { get; set; } =
        string.Empty;
}
