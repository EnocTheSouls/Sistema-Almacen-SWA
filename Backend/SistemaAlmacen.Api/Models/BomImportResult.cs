namespace SistemaAlmacen.Api.Models;

// Resultado de la lectura e importación del Excel.
public sealed class BomImportResult
{
    public string NombreArchivo { get; set; } =
        string.Empty;

    public int TotalFilas { get; set; }

    public int FilasCorrectas { get; set; }

    public int FilasConAdvertencia { get; set; }

    public int FilasConError { get; set; }

    public List<ErrorImportacionBom> Errores { get; set; } =
        [];

    public List<AdvertenciaImportacionBom> Advertencias
    {
        get;
        set;
    } = [];
}

// Fila que no pudo procesarse.
public sealed class ErrorImportacionBom
{
    public int NumeroFila { get; set; }

    public string Mensaje { get; set; } =
        string.Empty;
}

// Fila procesada con información incompleta.
public sealed class AdvertenciaImportacionBom
{
    public int NumeroFila { get; set; }

    public string Mensaje { get; set; } =
        string.Empty;
}