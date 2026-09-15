using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del catálogo de estaciones.
public static class EstacionEndpoints
{
    public static void MapEstacionEndpoints(
        this WebApplication app)
    {
        // Todas las rutas requieren autenticación.
        var grupo = app.MapGroup("/api/estaciones")
            .WithTags("Estaciones")
            .RequireAuthorization();

        // Obtiene todas las estaciones.
        grupo.MapGet("/", async (
            EstacionRepository estacionRepository) =>
        {
            var estaciones =
                await estacionRepository.ObtenerTodasAsync();

            return Results.Ok(estaciones);
        })
        .WithName("ObtenerEstaciones");

        // Obtiene una estación por su identificador.
        grupo.MapGet("/{idEstacion:int}", async (
            int idEstacion,
            EstacionRepository estacionRepository) =>
        {
            var estacion =
                await estacionRepository.ObtenerPorIdAsync(
                    idEstacion
                );

            if (estacion is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una estación con el identificador {idEstacion}."
                });
            }

            return Results.Ok(estacion);
        })
        .WithName("ObtenerEstacionPorId");

        // Obtiene las estaciones asociadas a una familia.
        grupo.MapGet("/familia/{idFamilia:int}", async (
            int idFamilia,
            FamiliaRepository familiaRepository,
            EstacionRepository estacionRepository) =>
        {
            // Comprueba que la familia exista.
            var familia =
                await familiaRepository.ObtenerPorIdAsync(
                    idFamilia
                );

            if (familia is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {idFamilia}."
                });
            }

            var estaciones =
                await estacionRepository.ObtenerPorFamiliaAsync(
                    idFamilia
                );

            return Results.Ok(estaciones);
        })
        .WithName("ObtenerEstacionesPorFamilia");

        // Crea una estación nueva.
        grupo.MapPost("/", async (
            CrearEstacionDto dto,
            FamiliaRepository familiaRepository,
            EstacionRepository estacionRepository) =>
        {
            // Valida el identificador de la familia.
            if (dto.IdFamilia <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La familia de la estación es obligatoria."
                });
            }

            // Valida el nombre obligatorio.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de la estación es obligatorio."
                });
            }

            if (dto.Nombre.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de la estación no puede exceder 100 caracteres."
                });
            }

            // Comprueba que la familia exista.
            var familia =
                await familiaRepository.ObtenerPorIdAsync(
                    dto.IdFamilia
                );

            if (familia is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {dto.IdFamilia}."
                });
            }

            // Impide crear estaciones en una familia inactiva.
            if (!familia.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se puede crear una estación en una familia inactiva."
                });
            }

            try
            {
                var estacionCreada =
                    await estacionRepository.CrearAsync(
                        dto.IdFamilia,
                        dto.Nombre
                    );

                if (estacionCreada is null)
                {
                    return Results.Problem(
                        title:
                            "No se obtuvo la estación creada",
                        detail:
                            "El registro fue insertado, pero no pudo consultarse.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                return Results.Created(
                    $"/api/estaciones/{estacionCreada.IdEstacion}",
                    estacionCreada
                );
            }
            catch (MySqlException ex)
                when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe una estación con ese nombre dentro de la familia."
                });
            }
        })
        .WithName("CrearEstacion")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador"));

        // Actualiza una estación existente.
        grupo.MapPut("/{idEstacion:int}", async (
            int idEstacion,
            ActualizarEstacionDto dto,
            FamiliaRepository familiaRepository,
            EstacionRepository estacionRepository) =>
        {
            // Comprueba que la estación exista.
            var estacionExistente =
                await estacionRepository.ObtenerPorIdAsync(
                    idEstacion
                );

            if (estacionExistente is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una estación con el identificador {idEstacion}."
                });
            }

            if (dto.IdFamilia <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La familia de la estación es obligatoria."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de la estación es obligatorio."
                });
            }

            if (dto.Nombre.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de la estación no puede exceder 100 caracteres."
                });
            }

            // Comprueba que la nueva familia exista.
            var familia =
                await familiaRepository.ObtenerPorIdAsync(
                    dto.IdFamilia
                );

            if (familia is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {dto.IdFamilia}."
                });
            }

            try
            {
                var estacionActualizada =
                    await estacionRepository.ActualizarAsync(
                        idEstacion,
                        dto.IdFamilia,
                        dto.Nombre,
                        dto.Activo
                    );

                if (estacionActualizada is null)
                {
                    return Results.NotFound(new
                    {
                        mensaje =
                            $"No existe una estación con el identificador {idEstacion}."
                    });
                }

                return Results.Ok(estacionActualizada);
            }
            catch (MySqlException ex)
                when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe una estación con ese nombre dentro de la familia."
                });
            }
        })
        .WithName("ActualizarEstacion")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador"));

        // Activa o desactiva una estación.
        grupo.MapPatch(
            "/{idEstacion:int}/estado",
            async (
                int idEstacion,
                bool activo,
                EstacionRepository estacionRepository) =>
        {
            var actualizado =
                await estacionRepository.CambiarEstadoAsync(
                    idEstacion,
                    activo
                );

            if (!actualizado)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una estación con el identificador {idEstacion}."
                });
            }

            return Results.NoContent();
        })
        .WithName("CambiarEstadoEstacion")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador"));
    }
}