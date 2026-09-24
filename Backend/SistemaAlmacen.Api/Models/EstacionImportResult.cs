namespace SistemaAlmacen.Api.Models;

// Resultado general de la importación de estaciones.
public sealed class EstacionImportResult
{
    public string NombreArchivo { get; set; } =
        string.Empty;

    public int TotalFilas { get; set; }

    public int FilasCorrectas { get; set; }

    public int FilasConError { get; set; }

    public int FilasConAdvertencia { get; set; }

    public int EstacionesCreadas { get; set; }

    public int EstacionesExistentes { get; set; }

    public int AsignacionesRealizadas { get; set; }

    public List<ErrorImportacionEstacion>
        Errores { get; set; } = [];

    public List<AdvertenciaImportacionEstacion>
        Advertencias { get; set; } = [];
}

// Error detectado en una fila.
public sealed class ErrorImportacionEstacion
{
    public int NumeroFila { get; set; }

    public string Mensaje { get; set; } =
        string.Empty;
}

// Advertencia detectada en una fila.
public sealed class AdvertenciaImportacionEstacion
{
    public int NumeroFila { get; set; }

    public string Mensaje { get; set; } =
        string.Empty;
}