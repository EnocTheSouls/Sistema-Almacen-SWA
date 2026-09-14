namespace SistemaAlmacen.Api.Models;

// Representa un arnés asociado a una familia.
public sealed class Arnes
{
    public int IdArnes { get; set; }

    public int IdFamilia { get; set; }

    // Facilita mostrar la familia en el frontend.
    public string NombreFamilia { get; set; } = string.Empty;

    // Facilita mostrar el proyecto relacionado.
    public int IdProyecto { get; set; }

    public string NombreProyecto { get; set; } = string.Empty;

    public string NumeroParteArnes { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string NivelDiseno { get; set; } = string.Empty;

    public DateOnly? FechaVigencia { get; set; }

    public bool Activo { get; set; }
}