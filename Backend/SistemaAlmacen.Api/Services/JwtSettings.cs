namespace SistemaAlmacen.Api.Services;

// Contiene la configuración necesaria para generar tokens JWT.
public sealed class JwtSettings
{
    public string Key { get; set; } = string.Empty;

    public string Issuer { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public int DuracionMinutos { get; set; }
}