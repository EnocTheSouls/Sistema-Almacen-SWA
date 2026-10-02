namespace SistemaAlmacen.Api.Dtos.Mrp;

public class FiltrosMrpDto
{
    public List<string> Proyectos { get; set; } =
        new();

    public List<string> Familias { get; set; } =
        new();

    public DateTime? FechaMinima { get; set; }

    public DateTime? FechaMaxima { get; set; }
}