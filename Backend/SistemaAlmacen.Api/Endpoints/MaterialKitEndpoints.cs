using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP
// para importar y consultar kits.
public static class MaterialKitEndpoints
{
    public static void MapMaterialKitEndpoints(
        this WebApplication app)
    {
        var grupo =
            app.MapGroup(
                "/api/material-kits"
            )
            .WithTags(
                "Material Kits"
            )
            .RequireAuthorization();

        // Importa el reporte PICSFR010.
        grupo.MapPost(
            "/importar",
            async (
                IFormFile archivo,
                MaterialKitImportService
                    importService) =>
            {
                if (
                    archivo is null ||
                    archivo.Length == 0
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "Selecciona un archivo Excel."
                        }
                    );
                }

                var extension =
                    Path.GetExtension(
                        archivo.FileName
                    );

                if (
                    !extension.Equals(
                        ".xlsx",
                        StringComparison
                            .OrdinalIgnoreCase
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El archivo debe tener extensión .xlsx."
                        }
                    );
                }

                try
                {
                    await using var stream =
                        archivo.OpenReadStream();

                    var resultado =
                        await importService
                            .ImportarAsync(
                                stream,
                                archivo.FileName
                            );

                    return Results.Ok(
                        new
                        {
                            mensaje =
                                "La lista de kits fue procesada.",

                            resultado
                        }
                    );
                }
                catch (
                    InvalidOperationException ex
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                ex.Message
                        }
                    );
                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine(
                        "Error al importar kits:"
                    );

                    Console.Error.WriteLine(
                        ex
                    );

                    return Results.Problem(
                        title:
                            "No se pudo importar la lista de kits",

                        detail:
                            "Ocurrió un error al procesar el archivo Excel.",

                        statusCode:
                            StatusCodes
                                .Status500InternalServerError
                    );
                }
            }
        )
        .WithName(
            "ImportarMaterialKits"
        )
        .DisableAntiforgery()
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );
    }
}