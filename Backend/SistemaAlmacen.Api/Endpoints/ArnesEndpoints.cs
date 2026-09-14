using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de arneses.
public static class ArnesEndpoints
{
    public static void MapArnesEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de arneses.
        var grupo = app.MapGroup("/api/arneses")
            .WithTags("Arneses")
            .RequireAuthorization();

        // Obtiene todos los arneses registrados.
        grupo.MapGet("/", async (
            ArnesRepository repository) =>
        {
            var arneses =
                await repository.ObtenerTodosAsync();

            return Results.Ok(arneses);
        })
        .WithName("ObtenerArneses");

        // Obtiene un arnés por su identificador.
        grupo.MapGet("/{idArnes:int}", async (
            int idArnes,
            ArnesRepository repository) =>
        {
            var arnes =
                await repository.ObtenerPorIdAsync(idArnes);

            // Devuelve 404 cuando el arnés no existe.
            if (arnes is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un arnés con el identificador {idArnes}."
                });
            }

            return Results.Ok(arnes);
        })
        .WithName("ObtenerArnesPorId");
        // Crea un arnés asociado a una familia.
        grupo.MapPost("/", async (
            CrearArnesDto dto,
            ArnesRepository arnesRepository,
            FamiliaRepository familiaRepository,
            ProyectoRepository proyectoRepository) =>
        {
            // Valida el número de parte.
            if (string.IsNullOrWhiteSpace(dto.NumeroParteArnes))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte del arnés es obligatorio."
                });
            }

            if (dto.NumeroParteArnes.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte no puede exceder 100 caracteres."
                });
            }

            // Valida el nivel de diseño.
            if (string.IsNullOrWhiteSpace(dto.NivelDiseno))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nivel de diseño es obligatorio."
                });
            }

            if (dto.NivelDiseno.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nivel de diseño no puede exceder 50 caracteres."
                });
            }

            // Valida la descripción opcional.
            if (dto.Descripcion?.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción no puede exceder 255 caracteres."
                });
            }

            // Comprueba que la familia exista.
            var familia =
                await familiaRepository.ObtenerPorIdAsync(
                    dto.IdFamilia
                );

            if (familia is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {dto.IdFamilia}."
                });
            }

            // Impide crear arneses en familias inactivas.
            if (!familia.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear arneses en una familia inactiva."
                });
            }

            // Comprueba que el proyecto relacionado esté activo.
            var proyecto =
                await proyectoRepository.ObtenerPorIdAsync(
                    familia.IdProyecto
                );

            if (proyecto is null || !proyecto.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La familia pertenece a un proyecto inexistente o inactivo."
                });
            }

            try
            {
                var arnesCreado =
                    await arnesRepository.CrearAsync(
                        dto.IdFamilia,
                        dto.NumeroParteArnes,
                        dto.Descripcion,
                        dto.NivelDiseno,
                        dto.FechaVigencia
                    );

                if (arnesCreado is null)
                {
                    return Results.Problem(
                        title: "No se obtuvo el arnés creado",
                        detail:
                            "El registro fue insertado, pero no pudo consultarse.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                return Results.Created(
                    $"/api/arneses/{arnesCreado.IdArnes}",
                    arnesCreado
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita números de parte duplicados.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un arnés con ese número de parte."
                });
            }
        })
        .WithName("CrearArnes")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );

        // Actualiza los datos de un arnés existente.
        grupo.MapPut("/{idArnes:int}", async (
            int idArnes,
            ActualizarArnesDto dto,
            ArnesRepository arnesRepository,
            FamiliaRepository familiaRepository,
            ProyectoRepository proyectoRepository) =>
        {
            // Valida que el número de parte tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.NumeroParteArnes))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte del arnés es obligatorio."
                });
            }

            if (dto.NumeroParteArnes.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte no puede exceder 100 caracteres."
                });
            }

            // Valida que el nivel de diseño tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.NivelDiseno))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nivel de diseño es obligatorio."
                });
            }

            if (dto.NivelDiseno.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nivel de diseño no puede exceder 50 caracteres."
                });
            }

            // Valida la descripción opcional.
            if (dto.Descripcion?.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción no puede exceder 255 caracteres."
                });
            }

            // Comprueba que el arnés exista.
            var arnesExistente =
                await arnesRepository.ObtenerPorIdAsync(idArnes);

            if (arnesExistente is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un arnés con el identificador {idArnes}."
                });
            }

            // Comprueba que la familia seleccionada exista.
            var familia =
                await familiaRepository.ObtenerPorIdAsync(
                    dto.IdFamilia
                );

            if (familia is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe una familia con el identificador {dto.IdFamilia}."
                });
            }

            // Impide asignar el arnés a una familia inactiva.
            if (!familia.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se puede asignar el arnés a una familia inactiva."
                });
            }

            // Comprueba que el proyecto relacionado esté activo.
            var proyecto =
                await proyectoRepository.ObtenerPorIdAsync(
                    familia.IdProyecto
                );

            if (proyecto is null || !proyecto.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La familia pertenece a un proyecto inexistente o inactivo."
                });
            }

            try
            {
                var actualizado =
                    await arnesRepository.ActualizarAsync(
                        idArnes,
                        dto.IdFamilia,
                        dto.NumeroParteArnes,
                        dto.Descripcion,
                        dto.NivelDiseno,
                        dto.FechaVigencia,
                        dto.Activo
                    );

                if (!actualizado)
                {
                    return Results.Problem(
                        title: "No se actualizó el arnés",
                        detail:
                            "MySQL no modificó el registro del arnés.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                // Devuelve el arnés actualizado con sus relaciones.
                var arnesActualizado =
                    await arnesRepository.ObtenerPorIdAsync(idArnes);

                return Results.Ok(arnesActualizado);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita utilizar un número de parte duplicado.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe otro arnés con ese número de parte."
                });
            }
        })
        .WithName("ActualizarArnes")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );

    }
}