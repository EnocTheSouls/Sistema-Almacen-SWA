namespace SistemaAlmacen.Api.Models;

// Representa el resultado de intentar surtir un material.
public sealed class ResultadoSurtidoSolicitud
{
    public bool Exitoso { get; set; }

    public string Codigo { get; set; } =
        string.Empty;

    public string Mensaje { get; set; } =
        string.Empty;

    public Solicitud? Solicitud { get; set; }
}