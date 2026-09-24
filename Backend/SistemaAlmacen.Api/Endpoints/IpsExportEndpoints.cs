using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Expone la descarga de listas para IPS.
public static class IpsExportEndpoints
{
    public static IEndpointRouteBuilder
        MapIpsExportEndpoints(
            this IEndpointRouteBuilder app)
    {
        var grupo =
            app.MapGroup(
                "/api/ips"
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
            IpsExportService exportService)
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
                $"LISTAS_IPS_{fecha}.zip";

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
                    "No se encontró la plantilla IPS.",
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
        "ERROR AL GENERAR LISTAS IPS:"
    );

    Console.WriteLine(
        ex.ToString()
    );

    return Results.Problem(
        title:
            "No fue posible generar las listas IPS.",
        detail:
            ex.Message,
        statusCode:
            StatusCodes
                .Status500InternalServerError
    );
}
    }
}