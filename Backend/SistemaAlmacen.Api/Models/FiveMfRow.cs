namespace SistemaAlmacen.Api.Models;

// Representa una fila de la hoja Data del archivo 5MF.
public sealed class FiveMfRow
{
    public int NumeroFila
    {
        get;
        set;
    }

    public string Familia
    {
        get;
        set;
    } = "";

    public string NumeroArnes
    {
        get;
        set;
    } = "";

    public string NivelDiseno
    {
        get;
        set;
    } = "";

    public string? ClienteFiveMf
    {
        get;
        set;
    } 

    public DateOnly? FechaInicio
    {
        get;
        set;
    }

    public DateOnly? FechaFinal
    {
        get;
        set;
    }

    public string? NumeroRequisicion
    {
        get;
        set;
    }

    public decimal SetsPlaneados
    {
        get;
        set;
    }

    public int? NumeroList
    {
        get;
        set;
    }

    public string? Proyecto
    {
        get;
        set;
    } 
}