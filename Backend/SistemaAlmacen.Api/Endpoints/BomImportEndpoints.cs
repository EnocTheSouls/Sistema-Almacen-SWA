using System.Security.Claims;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas de importación e historial del BOM.
public static class BomImportEndpoints
{
    public static void MapBomImportEndpoints(
        this WebApplication app)
    {
        var grupo =
            app.MapGroup("/api/bom")
                .WithTags("BOM")
                .RequireAuthorization(
                    policy =>
                        policy.RequireRole(
                            "Administrador"
                        )
                );



        // Importa automáticamente un archivo Excel BOM.
        grupo.MapPost(
            "/importar",
            async (
                HttpContext context,
                BomImportService importService,
                ImportacionBomRepository
                    importacionRepository) =>
            {
                if (
                    !context.Request
                        .HasFormContentType
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "La solicitud debe enviarse como multipart/form-data."
                    });
                }

                var formulario =
                    await context.Request
                        .ReadFormAsync();

                var archivo =
                    formulario.Files
                        .GetFile("archivo");

                if (
                    archivo is null ||
                    archivo.Length == 0
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "Debes seleccionar un archivo Excel."
                    });
                }

                var extension =
                    Path.GetExtension(
                        archivo.FileName
                    );

                if (
                    !extension.Equals(
                        ".xlsx",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "Solo se permiten archivos con extensión .xlsx."
                    });
                }

                var idUsuarioTexto =
                    context.User.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    );

                if (
                    !int.TryParse(
                        idUsuarioTexto,
                        out var idUsuario
                    ) ||
                    idUsuario <= 0
                )
                {
                    return Results.Unauthorized();
                }

                long idImportacion = 0;

                try
                {
                    idImportacion =
                        await importacionRepository
                            .CrearAsync(
                                archivo.FileName,
                                idUsuario
                            );

                    await using var contenido =
                        archivo.OpenReadStream();

                    var resultado =
                        await importService
                            .ImportarAsync(
                                contenido,
                                archivo.FileName,
                                idImportacion,
                                idUsuario
                            );

                    await importacionRepository
                        .GuardarDetallesAsync(
                            idImportacion,
                            resultado.Errores,
                            resultado.Advertencias
                        );

                    var estado =
                        resultado.FilasConError > 0
                            ? "Completado con errores"
                            : resultado
                                    .FilasConAdvertencia > 0
                                ? "Completado con advertencias"
                                : "Completado";

                    var mensajeResultado =
                        resultado.FilasConError > 0
                            ? "Algunas filas no pudieron importarse."
                            : resultado
                                    .FilasConAdvertencia > 0
                                ? "La importación finalizó con advertencias."
                                : "Importación finalizada correctamente.";

                    await importacionRepository
                        .ActualizarResultadoAsync(
                            idImportacion,
                            resultado.TotalFilas,
                            resultado.FilasCorrectas,
                            resultado.FilasConAdvertencia,
                            resultado.FilasConError,
                            estado,
                            mensajeResultado
                        );

                    return Results.Ok(new
                    {
                        idImportacion,
                        resultado
                    });
                }
                catch (Exception ex)
                {
                    if (idImportacion > 0)
                    {
                        await importacionRepository
                            .MarcarErrorAsync(
                                idImportacion,
                                ex.Message
                            );

                        await importacionRepository
                            .GuardarDetalleAsync(
                                idImportacion,
                                0,
                                "Error",
                                null,
                                null,
                                ex.Message
                            );
                    }

                    return Results.BadRequest(new
                    {
                        mensaje =
                            $"No se pudo importar el BOM: {ex.Message}"
                    });
                }
            }
        )
        .WithName("ImportarBom");



        // Obtiene el historial general de importaciones.
        grupo.MapGet(
            "/historial",
            async (
                ImportacionBomRepository repository) =>
            {
                var historial =
                    await repository
                        .ObtenerHistorialAsync();

                return Results.Ok(
                    historial
                );
            }
        )
        .WithName("ObtenerHistorialBom");

        // Obtiene los errores y advertencias
        // de una importación específica.
        grupo.MapGet(
            "/historial/{idImportacion:long}/detalle",
            async (
                long idImportacion,
                ImportacionBomRepository repository) =>
            {
                if (idImportacion <= 0)
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "El identificador de la importación no es válido."
                    });
                }

                var detalles =
                    await repository
                        .ObtenerDetalleAsync(
                            idImportacion
                        );

                return Results.Ok(
                    detalles
                );
            }
        )
        .WithName(
            "ObtenerDetalleImportacionBom"
        );
    }
}