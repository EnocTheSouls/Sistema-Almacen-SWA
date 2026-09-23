namespace SistemaAlmacen.Api.Models;

// Resumen utilizado por el Dashboard.
public sealed class ResumenAlertasDiseno
{
    public int Total
    {
        get;
        set;
    }

    public int Proximas
    {
        get;
        set;
    }

    public int Atencion
    {
        get;
        set;
    }

    public int Urgentes
    {
        get;
        set;
    }

    public int Iniciadas
    {
        get;
        set;
    }

    public List<AlertaCambioDiseno> Alertas
    {
        get;
        set;
    } = [];
}