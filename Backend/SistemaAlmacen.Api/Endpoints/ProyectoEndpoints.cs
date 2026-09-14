using SistemaAlmacen.Api.Data;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de proyectos.
public static class ProyectoEndpoints
{
    public static void MapProyectoEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de proyectos.
        var grupo = app.MapGroup("/api/proyectos")
            .WithTags("Proyectos")
            .RequireAuthorization();

        // Obtiene todos los proyectos.
        grupo.MapGet("/", async (
            ProyectoRepository repository) =>
        {
            var proyectos =
                await repository.ObtenerTodosAsync();

            return Results.Ok(proyectos);
        })
        .WithName("ObtenerProyectos");

        // Obtiene un proyecto por su identificador.
        grupo.MapGet("/{idProyecto:int}", async (
            int idProyecto,
            ProyectoRepository repository) =>
        {
            var proyecto =
                await repository.ObtenerPorIdAsync(idProyecto);

            // Devuelve 404 cuando el proyecto no existe.
            if (proyecto is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {idProyecto}."
                });
            }

            return Results.Ok(proyecto);
        })
        .WithName("ObtenerProyectoPorId");
    }
}