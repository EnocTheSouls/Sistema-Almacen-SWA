using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Expone la importación de estaciones
// asignadas a los materiales del BOM.
public static class MaterialStationImportEndpoints
{
    public static IEndpointRouteBuilder
        MapMaterialStationImportEndpoints(
            this IEndpointRouteBuilder app)
    {
        var grupo =
            app.MapGroup(
                "/api/materiales"
            );

        grupo.MapPost(
            "/importar-estaciones",
            ImportarEstacionesAsync
        )
        .DisableAntiforgery();

        return app;
    }

    private static async Task<IResult>
        ImportarEstacionesAsync(
            IFormFile archivo,
            MaterialStationImportService
                importService)
    {
        try
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
                    StringComparison.OrdinalIgnoreCase
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
                        "La asignación de estaciones terminó correctamente.",

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
                "Error al importar estaciones de materiales:"
            );

            Console.Error.WriteLine(
                ex
            );

            return Results.Problem(
                title:
                    "No fue posible importar las estaciones de materiales.",

                detail:
                    ex.Message,

                statusCode:
                    StatusCodes
                        .Status500InternalServerError
            );
        }
    }
}