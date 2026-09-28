namespace SistemaAlmacen.Api.Dtos;

// Contenido recibido desde el escáner.
public sealed class ValidarMaterialQrDto
{
    public string ContenidoQr { get; set; } =
        string.Empty;
}