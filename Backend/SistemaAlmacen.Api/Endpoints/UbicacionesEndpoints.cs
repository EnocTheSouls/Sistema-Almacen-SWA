using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de ubicaciones.
public static class UbicacionEndpoints
{
    public static void MapUbicacionEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de ubicaciones.
        var grupo = app.MapGroup("/api/ubicaciones")
            .WithTags("Ubicaciones")
            .RequireAuthorization();

        // Obtiene todas las ubicaciones.
        grupo.MapGet("/", async (
            UbicacionRepository repository) =>
        {
            var ubicaciones =
                await repository.ObtenerTodasAsync();

            return Results.Ok(ubicaciones);
        })
        .WithName("ObtenerUbicaciones");

        // Obtiene una ubicación por su identificador.
        grupo.MapGet("/{idUbicacion:int}", async (
            int idUbicacion,
            UbicacionRepository repository) =>
        {
            var ubicacion =
                await repository.ObtenerPorIdAsync(
                    idUbicacion
                );

            if (ubicacion is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una ubicación con el identificador {idUbicacion}."
                });
            }

            return Results.Ok(ubicacion);
        })
        .WithName("ObtenerUbicacionPorId");

        // Crea una ubicación dentro de un rack activo.
        grupo.MapPost("/", async (
            CrearUbicacionDto dto,
            UbicacionRepository ubicacionRepository,
            RackRepository rackRepository,
            ZonaRepository zonaRepository) =>
        {
            // Valida el nivel.
            if (string.IsNullOrWhiteSpace(dto.Nivel))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nivel de la ubicación es obligatorio."
                });
            }

            // La tabla permite un solo carácter.
            if (dto.Nivel.Trim().Length != 1)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nivel debe contener exactamente un carácter."
                });
            }

            // Valida la posición.
            if (string.IsNullOrWhiteSpace(dto.Posicion))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La posición es obligatoria."
                });
            }

            if (dto.Posicion.Trim().Length > 10)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La posición no puede exceder 10 caracteres."
                });
            }

            // Valida la capacidad opcional.
            if (dto.CapacidadMaxima.HasValue &&
                dto.CapacidadMaxima.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La capacidad máxima debe ser mayor que cero."
                });
            }

            // Comprueba que el rack exista.
            var rack =
                await rackRepository.ObtenerPorIdAsync(
                    dto.IdRack
                );

            if (rack is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe un rack con el identificador {dto.IdRack}."
                });
            }

            // Impide crear ubicaciones en racks inactivos.
            if (!rack.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear ubicaciones en un rack inactivo."
                });
            }

            // Comprueba que la zona del rack siga activa.
            var zona =
                await zonaRepository.ObtenerPorIdAsync(
                    rack.IdZona
                );

            if (zona is null || !zona.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El rack pertenece a una zona inexistente o inactiva."
                });
            }

            // La altura es el número máximo de niveles permitidos.
            if (rack.AlturaTotal.HasValue)
            {
                var numeroNivel =
                    char.ToUpperInvariant(
                        dto.Nivel.Trim()[0]
                    ) - 'A' + 1;

                if (numeroNivel < 1 ||
                    numeroNivel > rack.AlturaTotal.Value)
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            $"El nivel debe estar entre A y " +
                            $"{(char)('A' + rack.AlturaTotal.Value - 1)}."
                    });
                }
            }

            try
            {
                var ubicacionCreada =
                    await ubicacionRepository.CrearAsync(
                        dto.IdRack,
                        dto.Nivel,
                        dto.Posicion,
                        dto.CapacidadMaxima
                    );

                if (ubicacionCreada is null)
                {
                    return Results.Problem(
                        title:
                            "No se obtuvo la ubicación creada",
                        detail:
                            "El registro fue insertado, pero no pudo consultarse.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                return Results.Created(
                    $"/api/ubicaciones/{ubicacionCreada.IdUbicacion}",
                    ubicacionCreada
                );
            }
            catch (MySqlException ex)
                when (ex.Number == 1062)
            {
                // Evita duplicar nivel y posición en el rack.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe esa ubicación dentro del rack."
                });
            }
        })
        .WithName("CrearUbicacion")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );
    }
}