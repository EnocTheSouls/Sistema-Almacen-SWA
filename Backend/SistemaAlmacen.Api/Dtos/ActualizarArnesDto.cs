namespace SistemaAlmacen.Api.Dtos;

// Recibe los datos permitidos para actualizar un arnés.
public sealed class ActualizarArnesDto
{
    public int IdFamilia { get; set; }

    public string NumeroParteArnes { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    public string NivelDiseno { get; set; } = string.Empty;

    public DateOnly? FechaVigencia { get; set; }

    public bool Activo { get; set; }
}