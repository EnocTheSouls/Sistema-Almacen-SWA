using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;


namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de familias.
public static class FamiliaEndpoints
{
    public static void MapFamiliaEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de familias.
        var grupo = app.MapGroup("/api/familias")
            .WithTags("Familias")
            .RequireAuthorization();

        // Obtiene todas las familias.
        grupo.MapGet("/", async (
            FamiliaRepository repository) =>
        {
            var familias =
                await repository.ObtenerTodasAsync();

            return Results.Ok(familias);
        })
        .WithName("ObtenerFamilias");

        // Obtiene una familia por su identificador.
        grupo.MapGet("/{idFamilia:int}", async (
            int idFamilia,
            FamiliaRepository repository) =>
        {
            var familia =
                await repository.ObtenerPorIdAsync(idFamilia);

            // Devuelve 404 cuando la familia no existe.
            if (familia is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {idFamilia}."
                });
            }

            return Results.Ok(familia);
        })
        .WithName("ObtenerFamiliaPorId");

        // Crea una familia asociada a un proyecto.
        grupo.MapPost("/", async (
            CrearFamiliaDto dto,
            FamiliaRepository familiaRepository,
            ProyectoRepository proyectoRepository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre de la familia es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de la familia no puede exceder 100 caracteres."
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

            // Comprueba que el proyecto seleccionado exista.
            var proyecto =
                await proyectoRepository.ObtenerPorIdAsync(
                    dto.IdProyecto
                );

            if (proyecto is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {dto.IdProyecto}."
                });
            }

            // Impide crear familias dentro de proyectos inactivos.
            if (!proyecto.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear familias en un proyecto inactivo."
                });
            }

            try
            {
                var familiaCreada =
                    await familiaRepository.CrearAsync(
                        dto.IdProyecto,
                        dto.Nombre,
                        dto.Descripcion
                    );

                return Results.Created(
                    $"/api/familias/{familiaCreada!.IdFamilia}",
                    familiaCreada
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita familias duplicadas dentro del proyecto.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe una familia con ese nombre en el proyecto."
                });
            }
        })
        .WithName("CrearFamilia")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );

        // Actualiza los datos de una familia existente.
        grupo.MapPut("/{idFamilia:int}", async (
            int idFamilia,
            ActualizarFamiliaDto dto,
            FamiliaRepository familiaRepository,
            ProyectoRepository proyectoRepository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre de la familia es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de la familia no puede exceder 100 caracteres."
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

            // Comprueba que la familia exista.
            var familiaExistente =
                await familiaRepository.ObtenerPorIdAsync(idFamilia);

            if (familiaExistente is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {idFamilia}."
                });
            }

            // Comprueba que el proyecto seleccionado exista.
            var proyecto =
                await proyectoRepository.ObtenerPorIdAsync(
                    dto.IdProyecto
                );

            if (proyecto is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {dto.IdProyecto}."
                });
            }

            // Impide asignar la familia a un proyecto inactivo.
            if (!proyecto.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se puede asignar la familia a un proyecto inactivo."
                });
            }

            try
            {
                var actualizada =
                    await familiaRepository.ActualizarAsync(
                        idFamilia,
                        dto.IdProyecto,
                        dto.Nombre,
                        dto.Descripcion,
                        dto.Activo
                    );

                if (!actualizada)
                {
                    return Results.Problem(
                        title: "No se actualizó la familia",
                        detail:
                            "MySQL no modificó el registro de la familia.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                // Devuelve la familia con sus datos actualizados.
                var familiaActualizada =
                    await familiaRepository.ObtenerPorIdAsync(
                        idFamilia
                    );

                return Results.Ok(familiaActualizada);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita nombres duplicados dentro del proyecto.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe otra familia con ese nombre en el proyecto."
                });
            }
        })
        .WithName("ActualizarFamilia")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );
    }
}