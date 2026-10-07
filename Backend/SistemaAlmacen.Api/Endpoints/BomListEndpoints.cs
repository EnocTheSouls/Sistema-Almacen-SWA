using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Permite revisar y descargar archivos
// BOM List generados desde MySQL.
public static class BomListEndpoints
{
    public static void MapBomListEndpoints(
        this WebApplication app)
    {
        var grupo =
            app.MapGroup(
                "/api/bom-list"
            )
            .WithTags(
                "BOM List"
            )
            .RequireAuthorization();

        // Revisa el contenido y las advertencias
        // antes de descargar el archivo.
        grupo.MapGet(
            "/{proyecto}/revisar",
            async (
                string proyecto,
                BomListExportService service) =>
            {
                var proyectoNormalizado =
                    NormalizarProyecto(
                        proyecto
                    );

                if (
                    proyectoNormalizado is null
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El proyecto debe ser RIV, WS o DT."
                        }
                    );
                }

                var resultado =
                    await service
                        .GenerarPorProyectoAsync(
                            proyectoNormalizado
                        );

                return Results.Ok(
                    new
                    {
                        proyecto =
                            proyectoNormalizado,

                        totalExportados =
                            resultado
                                .TotalExportados,

                        totalDuplicados =
                            resultado
                                .TotalDuplicados,

                        totalAdvertencias =
                            resultado
                                .Advertencias
                                .Count,

                        advertencias =
                            resultado
                                .Advertencias
                    }
                );
            }
        )
        .WithName(
            "RevisarBomList"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador",
                    "Supervisor",
                    "Materialista"
                )
        );

        // Descarga el archivo después
        // de realizar su revisión.
        grupo.MapGet(
            "/{proyecto}",
            async (
                string proyecto,
                HttpContext httpContext,
                BomListExportService service) =>
            {
                var proyectoNormalizado =
                    NormalizarProyecto(
                        proyecto
                    );

                if (
                    proyectoNormalizado is null
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El proyecto debe ser RIV, WS o DT."
                        }
                    );
                }

                var resultado =
                    await service
                        .GenerarPorProyectoAsync(
                            proyectoNormalizado
                        );

                var nombreArchivo =
                    $"BOM_LIST_" +
                    $"{proyectoNormalizado}.csv";

                // Permite leer los conteos
                // desde el frontend.
                httpContext.Response.Headers[
                    "X-Total-Exportados"
                ] = resultado
                    .TotalExportados
                    .ToString();

                httpContext.Response.Headers[
                    "X-Total-Duplicados"
                ] = resultado
                    .TotalDuplicados
                    .ToString();

                httpContext.Response.Headers[
                    "X-Total-Advertencias"
                ] = resultado
                    .Advertencias
                    .Count
                    .ToString();

                return Results.File(
                    resultado.Contenido,
                    "text/csv; charset=utf-8",
                    nombreArchivo
                );
            }
        )
        .WithName(
            "DescargarBomList"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador",
                    "Supervisor",
                    "Materialista"
                )
        );
    }

    // Normaliza las claves permitidas
    // para consultar BOM List.
    private static string?
        NormalizarProyecto(
            string? proyecto)
    {
        var valor =
            proyecto
                ?.Trim()
                .ToUpperInvariant();

        return valor switch
        {
            "RIV" =>
                "RIV",

            "RIVIAN" =>
                "RIV",

            "WS" =>
                "WS",

            "DT" =>
                "DT",

            _ =>
                null
        };
    }
}