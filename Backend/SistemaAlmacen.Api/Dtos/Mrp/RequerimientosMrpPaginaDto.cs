namespace SistemaAlmacen.Api.Dtos.Mrp;

public class RequerimientosMrpPaginaDto
{
    public List<RequerimientoMrpDto> Registros
    {
        get;
        set;
    } = new();

    public int TotalRegistros { get; set; }

    public int Pagina { get; set; }

    public int TamanoPagina { get; set; }

    public int TotalPaginas { get; set; }
}