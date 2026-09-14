using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;


namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP para consultar el inventario.
public static class InventarioEndpoints
{
    public static void MapInventarioEndpoints(
        this WebApplication app)
    {
        // Todas las consultas requieren autenticación.
        var grupo = app.MapGroup("/api/inventario")
            .WithTags("Inventario")
            .RequireAuthorization();

        // Obtiene todo el inventario.
        grupo.MapGet("/", async (
            InventarioRepository inventarioRepository) =>
        {
            var inventario =
                await inventarioRepository.ObtenerTodoAsync();

            return Results.Ok(inventario);
        })
        .WithName("ObtenerInventario");

        // Obtiene un inventario por su identificador.
        grupo.MapGet("/{idInventario:long}", async (
            long idInventario,
            InventarioRepository inventarioRepository) =>
        {
            var inventario =
                await inventarioRepository.ObtenerPorIdAsync(
                    idInventario
                );

            if (inventario is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un inventario con el identificador {idInventario}."
                });
            }

            return Results.Ok(inventario);
        })
        .WithName("ObtenerInventarioPorId");

        // Obtiene el inventario de un material.
        grupo.MapGet("/material/{idMaterial:int}", async (
            int idMaterial,
            MaterialRepository materialRepository,
            InventarioRepository inventarioRepository) =>
        {
            // Comprueba que el material exista.
            var material =
                await materialRepository.ObtenerPorIdAsync(
                    idMaterial
                );

            if (material is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un material con el identificador {idMaterial}."
                });
            }

            var inventario =
                await inventarioRepository.ObtenerPorMaterialAsync(
                    idMaterial
                );

            return Results.Ok(inventario);
        })
        .WithName("ObtenerInventarioPorMaterial");

        // Obtiene los materiales de una ubicación.
        grupo.MapGet("/ubicacion/{idUbicacion:int}", async (
            int idUbicacion,
            UbicacionRepository ubicacionRepository,
            InventarioRepository inventarioRepository) =>
        {
            // Comprueba que la ubicación exista.
            var ubicacion =
                await ubicacionRepository.ObtenerPorIdAsync(
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

            var inventario =
                await inventarioRepository.ObtenerPorUbicacionAsync(
                    idUbicacion
                );

            return Results.Ok(inventario);
        })
        .WithName("ObtenerInventarioPorUbicacion");

        // Obtiene un material en una ubicación específica.
        grupo.MapGet(
            "/material/{idMaterial:int}/ubicacion/{idUbicacion:int}",
            async (
                int idMaterial,
                int idUbicacion,
                InventarioRepository inventarioRepository) =>
            {
                var inventario =
                    await inventarioRepository
                        .ObtenerPorMaterialYUbicacionAsync(
                            idMaterial,
                            idUbicacion
                        );

                if (inventario is null)
                {
                    return Results.NotFound(new
                    {
                        mensaje =
                            "El material no tiene inventario registrado " +
                            "en la ubicación indicada."
                    });
                }

                return Results.Ok(inventario);
            }
        )
        .WithName(
            "ObtenerInventarioPorMaterialYUbicacion"
        );
    }
}