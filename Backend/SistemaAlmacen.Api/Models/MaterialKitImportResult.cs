namespace SistemaAlmacen.Api.Models;

// Resultado de la importación
// de cajas o kits de materiales.
public sealed class MaterialKitImportResult
{
    public string NombreArchivo
    {
        get;
        set;
    } = string.Empty;

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

    public int FilasConError
    {
        get;
        set;
    }

    public int KitsCreados
    {
        get;
        set;
    }

    public int KitsActualizados
    {
        get;
        set;
    }

    public int KitsSinCambios
    {
        get;
        set;
    }

    public List<ErrorImportacionMaterialKit>
        Errores
    {
        get;
        set;
    } = new();
}

public sealed class ErrorImportacionMaterialKit
{
    public string Hoja
    {
        get;
        set;
    } = string.Empty;

    public int NumeroFila
    {
        get;
        set;
    }

    public string Mensaje
    {
        get;
        set;
    } = string.Empty;
}