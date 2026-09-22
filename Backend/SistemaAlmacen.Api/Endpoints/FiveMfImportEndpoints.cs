using System.Security.Claims;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas para importar y consultar archivos 5MF.
public static class FiveMfImportEndpoints
{
    public static void MapFiveMfImportEndpoints(
        this WebApplication app)
    {
        var grupo =
            app.MapGroup("/api/5mf")
                .WithTags("5MF")
                .RequireAuthorization(
                    policy =>
                        policy.RequireRole(
                            "Administrador"
                        )
                );

        // Importa el archivo Excel del 5MF.
        grupo.MapPost(
            "/importar",
            async (
                HttpContext context,
                FiveMfImportService importService,
                ImportacionFiveMfRepository repository) =>
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
                            "Debes seleccionar el archivo 5MF."
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
                        await repository
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
                                idImportacion
                            );

                    var estado =
                        resultado.FilasConError > 0
                            ? "Completado con errores"
                            : resultado
                                    .FilasConAdvertencia > 0
                                ? "Completado con advertencias"
                                : "Completado";

                    string mensaje;

                    if (
                        resultado.FilasConError > 0
                    )
                    {
                        mensaje =
                            "El archivo 5MF se procesó, pero algunas filas contienen errores.";
                    }
                    else if (
                        resultado.FilasConAdvertencia > 0
                    )
                    {
                        mensaje =
                            "El archivo 5MF se procesó con advertencias de familias sin coincidencia.";
                    }
                    else
                    {
                        mensaje =
                            "El archivo 5MF se importó correctamente.";
                    }

                    await repository
                        .ActualizarResultadoAsync(
                            idImportacion,
                            resultado.TotalFilas,
                            resultado.FilasCorrectas,
                            resultado
                                .FilasConAdvertencia,
                            resultado.FilasConError,
                            estado,
                            mensaje
                        );

                    return Results.Ok(new
                    {
                        idImportacion,
                        mensaje,
                        resultado
                    });
                }
                catch (Exception ex)
                {
                    if (idImportacion > 0)
                    {
                        await repository
                            .MarcarErrorAsync(
                                idImportacion,
                                ex.Message
                            );
                    }

                    return Results.BadRequest(new
                    {
                        mensaje =
                            $"No se pudo importar el archivo 5MF: {ex.Message}"
                    });
                }
            }
        )
        .WithName("ImportarFiveMf");

        // Obtiene el historial de importaciones 5MF.
        grupo.MapGet(
            "/historial",
            async (
                ImportacionFiveMfRepository repository) =>
            {
                var historial =
                    await repository
                        .ObtenerHistorialAsync();

                return Results.Ok(
                    historial
                );
            }
        )
        .WithName("ObtenerHistorialFiveMf");

        // Obtiene las filas procesadas de una importación.
        grupo.MapGet(
            "/historial/{idImportacion:long}/detalle",
            async (
                long idImportacion,
                ImportacionFiveMfRepository repository) =>
            {
                if (idImportacion <= 0)
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "El identificador de importación no es válido."
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
            "ObtenerDetalleImportacionFiveMf"
        );
    }
}