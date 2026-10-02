namespace SistemaAlmacen.Api.Dtos.Mrp;

public class RequerimientoMrpFiltroDto
{
    public string? Busqueda { get; set; }

    public string? Proyecto { get; set; }

    public string? Familia { get; set; }

    public DateTime? FechaDesde { get; set; }

    public DateTime? FechaHasta { get; set; }

    public int Pagina { get; set; } = 1;

    public int TamanoPagina { get; set; } = 50;
}