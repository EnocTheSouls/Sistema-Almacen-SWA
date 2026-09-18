using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;
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
        // Crea un proyecto nuevo.
        grupo.MapPost("/", async (
            CrearProyectoDto dto,
            ProyectoRepository repository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre del proyecto es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del proyecto no puede exceder 50 caracteres."
                });
            }

            if (dto.Descripcion?.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción no puede exceder 255 caracteres."
                });
            }

            try
            {
                var proyectoCreado =
                    await repository.CrearAsync(
                        dto.Nombre,
                        dto.Descripcion
                    );

                return Results.Created(
                    $"/api/proyectos/{proyectoCreado.IdProyecto}",
                    proyectoCreado
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita proyectos con nombres duplicados.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un proyecto con ese nombre."
                });
            }
        })
        .WithName("CrearProyecto")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );



        // Actualiza los datos de un proyecto existente.
        grupo.MapPut("/{idProyecto:int}", async (
            int idProyecto,
            ActualizarProyectoDto dto,
            ProyectoRepository repository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre del proyecto es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del proyecto no puede exceder 50 caracteres."
                });
            }

            if (dto.Descripcion?.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción no puede exceder 255 caracteres."
                });
            }

            // Comprueba que el proyecto exista.
            var proyectoExistente =
                await repository.ObtenerPorIdAsync(idProyecto);

            if (proyectoExistente is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {idProyecto}."
                });
            }

            try
            {
                var actualizado =
                    await repository.ActualizarAsync(
                        idProyecto,
                        dto.Nombre,
                        dto.Descripcion,
                        dto.Activo
                    );

                if (!actualizado)
                {
                    return Results.Problem(
                        title: "No se actualizó el proyecto",
                        detail:
                            "MySQL no modificó el registro del proyecto.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                // Devuelve el proyecto con los datos actualizados.
                var proyectoActualizado =
                    await repository.ObtenerPorIdAsync(idProyecto);

                return Results.Ok(proyectoActualizado);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita utilizar el nombre de otro proyecto.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe otro proyecto con ese nombre."
                });
            }
        })
        .WithName("ActualizarProyecto")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );


        // Elimina un proyecto únicamente cuando no tiene relaciones.
        grupo.MapDelete("/{idProyecto:int}", async (
            int idProyecto,
            ProyectoRepository repository) =>
        {
            // Valida el identificador recibido.
            if (idProyecto <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del proyecto no es válido."
                });
            }

            // Comprueba que el proyecto exista.
            var proyecto =
                await repository.ObtenerPorIdAsync(
                    idProyecto
                );

            if (proyecto is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {idProyecto}."
                });
            }

            // Solamente los racks asignados bloquean
            // la eliminación física del proyecto.
            var tieneRacksAsignados =
                await repository.TieneRacksAsignadosAsync(
                    idProyecto
                );

            if (tieneRacksAsignados)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "No se puede eliminar el proyecto porque tiene uno o más racks asignados."
                });
            }

            try
            {
                var eliminado =
                    await repository.EliminarAsync(
                        idProyecto
                    );

                if (!eliminado)
                {
                    return Results.Problem(
                        title:
                            "No se eliminó el proyecto",
                        detail:
                            "MySQL no eliminó el registro solicitado.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                // La eliminación fue exitosa y no requiere contenido.
                return Results.NoContent();
            }
            catch (MySqlException ex)
                when (ex.Number == 1451)
            {
                // Protección adicional si se crea una relación
                // entre la validación y la eliminación.
                return Results.Conflict(new
                {
                    mensaje =
                        "No se puede eliminar el proyecto porque ya tiene información relacionada."
                });
            }
        })
        .WithName("EliminarProyecto")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );
    }
}