namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos necesarios para crear un arnés.
public sealed class CrearArnesDto
{
    public int IdFamilia { get; set; }

    public string NumeroParteArnes { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string NivelDiseno { get; set; } = string.Empty;

    public DateOnly? FechaVigencia { get; set; }
}