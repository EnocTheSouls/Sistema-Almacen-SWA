using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Expone la descarga de listas para PICS.
public static class PicsExportEndpoints
{
    public static IEndpointRouteBuilder
        MapPicsExportEndpoints(
            this IEndpointRouteBuilder app)
    {
        var grupo =
            app.MapGroup(
                "/api/pics"
            );

        grupo.MapGet(
            "/exportar-listas",
            ExportarListasAsync
        );

        return app;
    }

    // Genera un ZIP con un Excel por proyecto.
    private static async Task<IResult>
        ExportarListasAsync(
            PicsExportService exportService)
    {
        try
        {
            var archivoZip =
                await exportService
                    .GenerarListasAsync();

            var fecha =
                DateTime.Now.ToString(
                    "yyyy-MM-dd"
                );

            var nombreArchivo =
                $"LISTAS_PICS_{fecha}.zip";

            return Results.File(
                archivoZip,
                "application/zip",
                nombreArchivo
            );
        }
        catch (FileNotFoundException ex)
        {
            return Results.Problem(
                title:
                    "No se encontró la plantilla PICS.",
                detail:
                    ex.Message,
                statusCode:
                    StatusCodes
                        .Status500InternalServerError
            );
        }
        catch (InvalidOperationException ex)
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
    Console.WriteLine(
        "ERROR AL GENERAR LISTAS PICS:"
    );

    Console.WriteLine(
        ex.ToString()
    );

    return Results.Problem(
        title:
            "No fue posible generar las listas PICS.",
        detail:
            ex.Message,
        statusCode:
            StatusCodes
                .Status500InternalServerError
    );
}
    }
}