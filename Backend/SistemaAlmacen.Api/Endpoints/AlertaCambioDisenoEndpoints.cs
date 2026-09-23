using SistemaAlmacen.Api.Data;

namespace SistemaAlmacen.Api.Endpoints;

public static class AlertaCambioDisenoEndpoints
{
    public static RouteGroupBuilder
        MapAlertaCambioDisenoEndpoints(
            this RouteGroupBuilder group)
    {
        group.MapGet(
            "/alertas-diseno",
            async (
                AlertaCambioDisenoRepository repository) =>
            {
                var resultado =
                    await repository
                        .ObtenerAlertasAsync();

                return Results.Ok(resultado);
            })
            .WithName(
                "ObtenerAlertasDiseno")
            .WithSummary(
                "Obtiene alertas de cambio de diseño.");

        return group;
    }
}