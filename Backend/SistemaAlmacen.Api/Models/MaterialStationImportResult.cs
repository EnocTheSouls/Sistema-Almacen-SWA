namespace SistemaAlmacen.Api.Models;

// Resume el resultado de asignar
// estaciones a materiales del BOM.
public sealed class MaterialStationImportResult
{
    public string NombreArchivo { get; set; } =
        string.Empty;

    public int TotalFilas { get; set; }

    public int FilasCorrectas { get; set; }

    public int FilasSinEstacion { get; set; }

    public int FilasConError { get; set; }

    public int AsignacionesRealizadas { get; set; }

    public int AsignacionesActualizadas { get; set; }

    public List<MaterialStationImportError>
        Errores { get; set; } = [];
}

// Describe una fila que no pudo asignarse.
public sealed class MaterialStationImportError
{
    public int NumeroFila { get; set; }

    public string NumeroArnes { get; set; } =
        string.Empty;

    public string NumeroMaterial { get; set; } =
        string.Empty;

    public string Estacion { get; set; } =
        string.Empty;

    public string Mensaje { get; set; } =
        string.Empty;
}