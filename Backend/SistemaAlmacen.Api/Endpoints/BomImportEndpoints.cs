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

        // Importa un archivo Excel con información BOM.
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

                if (
                    !int.TryParse(
                        formulario["idFamilia"],
                        out var idFamilia
                    ) ||
                    idFamilia <= 0
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "Debes seleccionar una familia válida."
                    });
                }

                var nivelDiseno =
                    formulario["nivelDiseno"]
                        .ToString()
                        .Trim();

                if (
                    string.IsNullOrWhiteSpace(
                        nivelDiseno
                    )
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "El nivel de diseño es obligatorio."
                    });
                }

                var version =
                    formulario["version"]
                        .ToString()
                        .Trim();

                if (
                    string.IsNullOrWhiteSpace(
                        version
                    )
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "La versión del BOM es obligatoria."
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
                                idFamilia,
                                nivelDiseno,
                                version,
                                idImportacion,
                                idUsuario
                            );

                    // Guarda permanentemente
                    // los errores y advertencias.
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

                    string mensajeResultado;

                    if (resultado.FilasConError > 0)
                    {
                        mensajeResultado =
                            "Algunas filas no pudieron importarse.";
                    }
                    else if (
                        resultado.FilasConAdvertencia > 0
                    )
                    {
                        mensajeResultado =
                            "La importación finalizó con advertencias.";
                    }
                    else
                    {
                        mensajeResultado =
                            "Importación finalizada correctamente.";
                    }

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

                        // Guarda también el error general.
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