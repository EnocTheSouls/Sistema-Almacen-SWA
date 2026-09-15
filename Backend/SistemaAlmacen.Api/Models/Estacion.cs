namespace SistemaAlmacen.Api.Models;

// Representa una estación de producción asociada a una familia.
public sealed class Estacion
{
    public int IdEstacion { get; set; }

    public int IdFamilia { get; set; }

    // Nombre de la familia para mostrarlo en consultas.
    public string NombreFamilia { get; set; } =
        string.Empty;

    public int IdProyecto { get; set; }

    // Nombre del proyecto al que pertenece la familia.
    public string NombreProyecto { get; set; } =
        string.Empty;

    public string Nombre { get; set; } =
        string.Empty;

    public bool Activo { get; set; }
}