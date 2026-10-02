namespace SistemaAlmacen.Api.Dtos.Mrp;

public class ImportacionMrpResultadoDto
{
    public long IdImportacion { get; set; }

    public string NombreArchivo { get; set; } =
        string.Empty;

    public DateTime FechaInicio { get; set; }

    public DateTime FechaFin { get; set; }

    public int TotalRegistros { get; set; }

    public int RegistrosImportados { get; set; }

    public int RegistrosRechazados { get; set; }

    public string Estado { get; set; } =
        string.Empty;

    public List<string> Errores { get; set; } =
        new();
}