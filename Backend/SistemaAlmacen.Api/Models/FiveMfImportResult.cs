namespace SistemaAlmacen.Api.Models;

// Contiene el resultado general de una importación 5MF.
public sealed class FiveMfImportResult
{
    public string NombreArchivo
    {
        get;
        set;
    } = "";

    public int TotalFilas
    {
        get;
        set;
    }

    public int FilasCorrectas
    {
        get;
        set;
    }

    public int FilasConAdvertencia
    {
        get;
        set;
    }

    public int FilasConError
    {
        get;
        set;
    }

    public int FamiliasEncontradas
    {
        get;
        set;
    }

    public int FamiliasSinCoincidencia
    {
        get;
        set;
    }

    public int ArnesesCreados
    {
        get;
        set;
    }

    public int ArnesesExistentes
    {
        get;
        set;
    }

    public int PlanesSemanalesGuardados
    {
        get;
        set;
    }

    public List<FiveMfImportError> Errores
    {
        get;
        set;
    } = [];

    public List<FiveMfImportWarning> Advertencias
    {
        get;
        set;
    } = [];
}

// Representa un error encontrado en una fila del 5MF.
public sealed class FiveMfImportError
{
    public int NumeroFila
    {
        get;
        set;
    }

    public string? Familia
    {
        get;
        set;
    }

    public string? NumeroArnes
    {
        get;
        set;
    }

    public string? NivelDiseno
    {
        get;
        set;
    }

    public string Mensaje
    {
        get;
        set;
    } = "";
}

// Representa una advertencia encontrada en una fila del 5MF.
public sealed class FiveMfImportWarning
{
    public int NumeroFila
    {
        get;
        set;
    }

    public string? Familia
    {
        get;
        set;
    }

    public string? NumeroArnes
    {
        get;
        set;
    }

    public string? NivelDiseno
    {
        get;
        set;
    }

    public string Mensaje
    {
        get;
        set;
    } = "";
}