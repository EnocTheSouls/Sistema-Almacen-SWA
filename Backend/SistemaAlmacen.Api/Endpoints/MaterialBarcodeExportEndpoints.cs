using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Expone la descarga del Excel
// con los códigos de barras.
public static class MaterialBarcodeExportEndpoints
{
    public static IEndpointRouteBuilder
        MapMaterialBarcodeExportEndpoints(
            this IEndpointRouteBuilder app)
    {
        var grupo =
            app.MapGroup(
                "/api/materiales"
            );

        grupo.MapGet(
            "/exportar-codigos-barras",
            ExportarCodigosBarrasAsync
        );

        return app;
    }

    private static async Task<IResult>
        ExportarCodigosBarrasAsync(
            MaterialBarcodeExportService
                exportService)
    {
        try
        {
            var archivoExcel =
                await exportService
                    .GenerarExcelAsync();

            var fecha =
                DateTime.Now.ToString(
                    "yyyy-MM-dd"
                );

            var nombreArchivo =
                $"CODIGOS_BARRAS_MATERIALES_{fecha}.xlsx";

            return Results.File(
                archivoExcel,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                nombreArchivo
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
                "Error al exportar códigos de barras:"
            );

            Console.Error.WriteLine(
                ex
            );

            return Results.Problem(
                title:
                    "No fue posible exportar los códigos de barras.",
                detail:
                    ex.Message,
                statusCode:
                    StatusCodes
                        .Status500InternalServerError
            );
        }
    }
}