namespace SistemaAlmacen.Api.Models.Mrp;

// Representa un renglón válido leído
// del archivo semanal MRP.
public sealed class RequerimientoMrpImportacion
{
    public string? NumeroRequisicion {
        get;
        set;
    }

    public string NumeroMaterial {
        get;
        set;
    } = string.Empty;

    // Material relacionado con el catálogo interno.
    public int? IdMaterial {
        get;
        set;
    }

    public string? NombreMaterial {
        get;
        set;
    }

    // Clasificación C, P, S o W del catálogo.
    public string? TipoMaterial {
        get;
        set;
    }

    // Valor original recibido en el Excel.
    public string? Familia {
        get;
        set;
    }

    // Familia oficial relacionada en MySQL.
    public int? IdFamilia {
        get;
        set;
    }

    // Valor original recibido en el Excel.
    public string? Proyecto {
        get;
        set;
    }

    // Proyecto oficial relacionado en MySQL.
    public int? IdProyecto {
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

    // Indica cómo se encontró la relación.
    public string TipoCoincidencia {
        get;
        set;
    } = "SIN_COINCIDENCIA";

    // Permanece activo cuando falta alguna relación.
    public bool RequiereRevision {
        get;
        set;
    } = true;
}