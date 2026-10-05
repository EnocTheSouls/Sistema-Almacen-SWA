namespace SistemaAlmacen.Api.Dtos.Mrp;

// Datos enviados al frontend para mostrar
// el plan semanal de surtido.
public sealed class RequerimientoMrpDto
{
    public long IdRequerimiento {
        get;
        set;
    }

    public long IdImportacion {
        get;
        set;
    }

    public string? NumeroRequisicion {
        get;
        set;
    }

    public string NumeroMaterial {
        get;
        set;
    } = string.Empty;

    public int? IdMaterial {
        get;
        set;
    }

    public string? NombreMaterial {
        get;
        set;
    }

    public string? TipoMaterial {
        get;
        set;
    }

    public string? Familia {
        get;
        set;
    }

    public string? Proyecto {
        get;
        set;
    }

    public DateTime FechaEta {
        get;
        set;
    }

    public decimal CantidadRequerida {
        get;
        set;
    }

    public decimal PackSize {
        get;
        set;
    }

    public int BolsasNecesarias {
        get;
        set;
    }

    public string TipoCoincidencia {
        get;
        set;
    } = string.Empty;

    public bool RequiereRevision {
        get;
        set;
    }
}