namespace SistemaAlmacen.Api.Models;

public sealed class AlertaCambioDiseno
{
    public string Proyecto { get; set; } = string.Empty;

    public string Familia { get; set; } = string.Empty;

    public string ArnesActual { get; set; } = string.Empty;

    public string DisenoActual { get; set; } = string.Empty;

    public string ArnesSiguiente { get; set; } = string.Empty;

    public string DisenoSiguiente { get; set; } = string.Empty;

    public DateOnly UltimaFechaActual { get; set; }

    public DateOnly FechaCambio { get; set; }

    public int DiasRestantes { get; set; }

    public string NivelAlerta { get; set; } = string.Empty;
}