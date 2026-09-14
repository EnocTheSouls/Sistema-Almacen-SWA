using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de zonas.
public static class ZonaEndpoints
{
    public static void MapZonaEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de zonas.
        var grupo = app.MapGroup("/api/zonas")
            .WithTags("Zonas")
            .RequireAuthorization();

        // Obtiene todas las zonas.
        grupo.MapGet("/", async (
            ZonaRepository repository) =>
        {
            var zonas =
                await repository.ObtenerTodasAsync();

            return Results.Ok(zonas);
        })
        .WithName("ObtenerZonas");

        // Obtiene una zona por su identificador.
        grupo.MapGet("/{idZona:int}", async (
            int idZona,
            ZonaRepository repository) =>
        {
            var zona =
                await repository.ObtenerPorIdAsync(idZona);

            // Devuelve 404 cuando la zona no existe.
            if (zona is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una zona con el identificador {idZona}."
                });
            }

            return Results.Ok(zona);
        })
        .WithName("ObtenerZonaPorId");

        // Crea una zona nueva.
grupo.MapPost("/", async (
    CrearZonaDto dto,
    ZonaRepository repository) =>
{
    // Valida que el código tenga contenido.
    if (string.IsNullOrWhiteSpace(dto.Codigo))
    {
        return Results.BadRequest(new
        {
            mensaje = "El código de la zona es obligatorio."
        });
    }

    // Valida que el nombre tenga contenido.
    if (string.IsNullOrWhiteSpace(dto.Nombre))
    {
        return Results.BadRequest(new
        {
            mensaje = "El nombre de la zona es obligatorio."
        });
    }

    // Valida las longitudes definidas en MySQL.
    if (dto.Codigo.Trim().Length > 10)
    {
        return Results.BadRequest(new
        {
            mensaje =
                "El código de la zona no puede exceder 10 caracteres."
        });
    }

    if (dto.Nombre.Trim().Length > 50)
    {
        return Results.BadRequest(new
        {
            mensaje =
                "El nombre de la zona no puede exceder 50 caracteres."
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
        var zonaCreada =
            await repository.CrearAsync(
                dto.Codigo,
                dto.Nombre,
                dto.Descripcion
            );

        return Results.Created(
            $"/api/zonas/{zonaCreada.IdZona}",
            zonaCreada
        );
    }
    catch (MySqlException ex) when (ex.Number == 1062)
    {
        // Evita códigos de zona duplicados.
        return Results.Conflict(new
        {
            mensaje =
                "Ya existe una zona con ese código."
        });
    }
})
.WithName("CrearZona")
.RequireAuthorization(policy =>
    policy.RequireRole("Administrador")
);
    }
}