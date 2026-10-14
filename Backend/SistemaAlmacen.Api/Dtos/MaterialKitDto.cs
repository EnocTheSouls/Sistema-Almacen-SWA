namespace SistemaAlmacen.Api.Dtos;

// Información de una caja o kit importado.
public sealed class MaterialKitDto
{
    public long IdMaterialKit
    {
        get;
        set;
    }

    public int IdMaterial
    {
        get;
        set;
    }

    public string NumeroParteMaterial
    {
        get;
        set;
    } = string.Empty;

    public string SerialCaja
    {
        get;
        set;
    } = string.Empty;

    public string? NumeroAsn
    {
        get;
        set;
    }

    public string? NumeroCamion
    {
        get;
        set;
    }

    public string? NumeroPallet
    {
        get;
        set;
    }

    public string? Localidad
    {
        get;
        set;
    }

    public string? Rack
    {
        get;
        set;
    }

    public decimal CantidadInicial
    {
        get;
        set;
    }

    public decimal CantidadDisponible
    {
        get;
        set;
    }

    public string? EstadoOrigen
    {
        get;
        set;
    }

    public string? ShipFrom
    {
        get;
        set;
    }

    public string EstadoKit
    {
        get;
        set;
    } = string.Empty;

    public bool Activo
    {
        get;
        set;
    }
}