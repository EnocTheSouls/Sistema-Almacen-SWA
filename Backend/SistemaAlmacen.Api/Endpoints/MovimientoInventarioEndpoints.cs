using SistemaAlmacen.Api.Data;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP para consultar el Kardex.
public static class MovimientoInventarioEndpoints
{
    public static void MapMovimientoInventarioEndpoints(
        this WebApplication app)
    {
        // Todas las consultas requieren autenticación.
        var grupo =
            app.MapGroup("/api/movimientos-inventario")
                .WithTags("Movimientos de Inventario")
                .RequireAuthorization();

        // Obtiene todos los movimientos de inventario.
        grupo.MapGet("/", async (
            MovimientoInventarioRepository movimientoRepository) =>
        {
            var movimientos =
                await movimientoRepository.ObtenerTodosAsync();

            return Results.Ok(movimientos);
        })
        .WithName("ObtenerMovimientosInventario")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));

        // Obtiene los movimientos de un material.
        grupo.MapGet("/material/{idMaterial:int}", async (
            int idMaterial,
            MaterialRepository materialRepository,
            MovimientoInventarioRepository movimientoRepository) =>
        {
            if (idMaterial <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del material no es válido."
                });
            }

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

            var movimientos =
                await movimientoRepository.ObtenerPorMaterialAsync(
                    idMaterial
                );

            return Results.Ok(movimientos);
        })
        .WithName("ObtenerMovimientosPorMaterial")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));

        // Obtiene los movimientos relacionados con una solicitud.
        grupo.MapGet("/solicitud/{idSolicitud:long}", async (
            long idSolicitud,
            SolicitudRepository solicitudRepository,
            MovimientoInventarioRepository movimientoRepository) =>
        {
            if (idSolicitud <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador de la solicitud no es válido."
                });
            }

            // Comprueba que la solicitud exista.
            var solicitud =
                await solicitudRepository.ObtenerPorIdAsync(
                    idSolicitud
                );

            if (solicitud is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una solicitud con el identificador {idSolicitud}."
                });
            }

            var movimientos =
                await movimientoRepository.ObtenerPorSolicitudAsync(
                    idSolicitud
                );

            return Results.Ok(movimientos);
        })
        .WithName("ObtenerMovimientosPorSolicitud")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));

        // Obtiene movimientos usando filtros opcionales.
        grupo.MapGet("/filtro", async (
            int? idMaterial,
            long? idSolicitud,
            string? tipoMovimiento,
            int? idUsuario,
            int? idUbicacion,
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            MovimientoInventarioRepository movimientoRepository) =>
        {
            if (idMaterial.HasValue &&
                idMaterial.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del material no es válido."
                });
            }

            if (idSolicitud.HasValue &&
                idSolicitud.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador de la solicitud no es válido."
                });
            }

            if (idUsuario.HasValue &&
                idUsuario.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del usuario no es válido."
                });
            }

            if (idUbicacion.HasValue &&
                idUbicacion.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador de la ubicación no es válido."
                });
            }

            if (!string.IsNullOrWhiteSpace(tipoMovimiento))
            {
                var tipoLimpio =
                    tipoMovimiento.Trim().ToUpperInvariant();

                var tiposPermitidos =
                    new[]
                    {
                        "ENTRADA",
                        "SALIDA",
                        "TRANSFERENCIA",
                        "AJUSTE",
                        "SURTIDO"
                    };

                if (!tiposPermitidos.Contains(tipoLimpio))
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "El tipo de movimiento debe ser " +
                            "ENTRADA, SALIDA, TRANSFERENCIA, " +
                            "AJUSTE o SURTIDO."
                    });
                }
            }

            if (fechaDesde.HasValue &&
                fechaHasta.HasValue &&
                fechaDesde.Value.Date >
                fechaHasta.Value.Date)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La fecha inicial no puede ser posterior " +
                        "a la fecha final."
                });
            }

            var movimientos =
                await movimientoRepository.ObtenerFiltradosAsync(
                    idMaterial,
                    idSolicitud,
                    tipoMovimiento,
                    idUsuario,
                    idUbicacion,
                    fechaDesde,
                    fechaHasta
                );

            return Results.Ok(movimientos);
        })
        .WithName("ObtenerMovimientosFiltrados")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));
    }
}