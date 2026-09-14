using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de racks.
public static class RackEndpoints
{
    public static void MapRackEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de racks.
        var grupo = app.MapGroup("/api/racks")
            .WithTags("Racks")
            .RequireAuthorization();

        // Obtiene todos los racks.
        grupo.MapGet("/", async (
            RackRepository repository) =>
        {
            var racks =
                await repository.ObtenerTodosAsync();

            return Results.Ok(racks);
        })
        .WithName("ObtenerRacks");

        // Obtiene un rack por su identificador.
        grupo.MapGet("/{idRack:int}", async (
            int idRack,
            RackRepository repository) =>
        {
            var rack =
                await repository.ObtenerPorIdAsync(idRack);

            if (rack is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un rack con el identificador {idRack}."
                });
            }

            return Results.Ok(rack);
        })
        .WithName("ObtenerRackPorId");

        // Crea un rack dentro de una zona activa.
        grupo.MapPost("/", async (
            CrearRackDto dto,
            RackRepository rackRepository,
            ZonaRepository zonaRepository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del rack es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 30)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del rack no puede exceder 30 caracteres."
                });
            }

            // La altura no puede ser cero ni negativa.
            if (dto.AlturaTotal.HasValue &&
                dto.AlturaTotal.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La altura total debe ser mayor que cero."
                });
            }

            // Comprueba que la zona exista.
            var zona =
                await zonaRepository.ObtenerPorIdAsync(
                    dto.IdZona
                );

            if (zona is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe una zona con el identificador {dto.IdZona}."
                });
            }

            // Impide crear racks en zonas inactivas.
            if (!zona.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear racks en una zona inactiva."
                });
            }

            try
            {
                var rackCreado =
                    await rackRepository.CrearAsync(
                        dto.IdZona,
                        dto.Nombre,
                        dto.AlturaTotal
                    );

                if (rackCreado is null)
                {
                    return Results.Problem(
                        title: "No se obtuvo el rack creado",
                        detail:
                            "El registro fue insertado, pero no pudo consultarse.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                return Results.Created(
                    $"/api/racks/{rackCreado.IdRack}",
                    rackCreado
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un rack con ese nombre dentro de la zona."
                });
            }
        })
        .WithName("CrearRack")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );
    }
}