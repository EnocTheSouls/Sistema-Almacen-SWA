using MySqlConnector;
using System.Security.Claims;
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


        // Busca inventario mediante Material Number o código de barras.
        grupo.MapGet("/escanear/{codigo}", async (
            string codigo,
            MaterialRepository materialRepository,
            InventarioRepository inventarioRepository) =>
        {
            // Valida el código recibido desde el lector.
            if (string.IsNullOrWhiteSpace(codigo))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El código escaneado es obligatorio."
                });
            }

            if (codigo.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El código escaneado no puede exceder 100 caracteres."
                });
            }

            // Busca por Material Number o Barcode.
            var material =
                await materialRepository.ObtenerPorCodigoAsync(
                    codigo
                );

            if (material is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un material relacionado con el código {codigo.Trim()}."
                });
            }

            if (!material.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El material escaneado está inactivo."
                });
            }

            // Un material puede estar distribuido en varias ubicaciones.
            var ubicaciones =
                await inventarioRepository.ObtenerPorMaterialAsync(
                    material.IdMaterial
                );

            var qtyTotalDisponible =
                ubicaciones.Sum(
                    inventario => inventario.Disponible
                );

            return Results.Ok(new
            {
                idMaterial =
                    material.IdMaterial,

                materialNumber =
                    material.NumeroParteMaterial,

                materialName =
                    material.Descripcion,

                unidadMedida =
                    material.UnidadMedida,

                barcode =
                    material.CodigoBarras,

                tipoEmpaque =
                    material.TipoEmpaque,

                stdPack =
                    material.StdPack,

                qtyTotalDisponible,

                ubicaciones =
                    ubicaciones.Select(
                        inventario => new
                        {
                            inventario.IdInventario,
                            inventario.IdUbicacion,

                            location =
                                inventario.RutaUbicacion,

                            qty =
                                inventario.Disponible,

                            qtyReserved =
                                inventario.Reservado,

                            qtyUnavailable =
                                inventario.NoDisponible
                        }
                    )
            });
        })
        .WithName("EscanearMaterialInventario")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));


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


        // Registra una entrada de material en una ubicación.
        grupo.MapPost("/entrada", async (
            EntradaInventarioDto dto,
            ClaimsPrincipal principal,
            MaterialRepository materialRepository,
            UbicacionRepository ubicacionRepository,
            RackRepository rackRepository,
            ZonaRepository zonaRepository,
            InventarioRepository inventarioRepository) =>
        {
            // Valida que la cantidad sea mayor que cero.
            if (dto.Cantidad <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La cantidad de entrada debe ser mayor que cero."
                });
            }

            // Valida la longitud de la referencia opcional.
            if (dto.Referencia?.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La referencia no puede exceder 100 caracteres."
                });
            }

            // Valida la longitud de los comentarios opcionales.
            if (dto.Comentarios?.Trim().Length > 200)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "Los comentarios no pueden exceder 200 caracteres."
                });
            }

            // Obtiene el usuario directamente desde el token JWT.
            var idUsuarioTexto =
                principal.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                idUsuarioTexto,
                out var idUsuario))
            {
                return Results.Unauthorized();
            }

            // Comprueba que el material exista.
            var material =
                await materialRepository.ObtenerPorIdAsync(
                    dto.IdMaterial
                );

            if (material is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un material con el identificador {dto.IdMaterial}."
                });
            }

            // Impide entradas para materiales inactivos.
            if (!material.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden registrar entradas para un material inactivo."
                });
            }

            // Comprueba que la ubicación exista.
            var ubicacion =
                await ubicacionRepository.ObtenerPorIdAsync(
                    dto.IdUbicacion
                );

            if (ubicacion is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una ubicación con el identificador {dto.IdUbicacion}."
                });
            }

            // Impide entradas en ubicaciones inactivas.
            if (!ubicacion.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden registrar entradas en una ubicación inactiva."
                });
            }

            // Comprueba que el rack esté activo.
            var rack =
                await rackRepository.ObtenerPorIdAsync(
                    ubicacion.IdRack
                );

            if (rack is null || !rack.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La ubicación pertenece a un rack inexistente o inactivo."
                });
            }

            // Comprueba que la zona esté activa.
            var zona =
                await zonaRepository.ObtenerPorIdAsync(
                    ubicacion.IdZona
                );

            if (zona is null || !zona.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La ubicación pertenece a una zona inexistente o inactiva."
                });
            }

            // Registra el inventario y el movimiento en una transacción.
            var inventario =
                await inventarioRepository.RegistrarEntradaAsync(
                    dto.IdMaterial,
                    dto.IdUbicacion,
                    dto.Cantidad,
                    idUsuario,
                    dto.Referencia,
                    dto.Comentarios
                );

            if (inventario is null)
            {
                return Results.Problem(
                    title: "No se registró la entrada",
                    detail:
                        "La entrada fue procesada, pero no pudo consultarse.",
                    statusCode:
                        StatusCodes.Status500InternalServerError
                );
            }

            return Results.Ok(new
            {
                mensaje =
                    "La entrada de inventario se registró correctamente.",
                inventario
            });
        })
        .WithName("RegistrarEntradaInventario")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"

            )
        );
        // Registra una salida de material desde una ubicación.
        grupo.MapPost("/salida", async (
            SalidaInventarioDto dto,
            ClaimsPrincipal principal,
            MaterialRepository materialRepository,
            UbicacionRepository ubicacionRepository,
            InventarioRepository inventarioRepository) =>
        {
            if (dto.Cantidad <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La cantidad de salida debe ser mayor que cero."
                });
            }

            var idUsuarioTexto =
                principal.FindFirstValue(
                    ClaimTypes.NameIdentifier
                );

            if (!int.TryParse(
                idUsuarioTexto,
                out var idUsuario))
            {
                return Results.Unauthorized();
            }

            var material =
                await materialRepository.ObtenerPorIdAsync(
                    dto.IdMaterial
                );

            if (material is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un material con el identificador {dto.IdMaterial}."
                });
            }

            var ubicacion =
                await ubicacionRepository.ObtenerPorIdAsync(
                    dto.IdUbicacion
                );

            if (ubicacion is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una ubicación con el identificador {dto.IdUbicacion}."
                });
            }

            var inventarioActual =
                await inventarioRepository
                    .ObtenerPorMaterialYUbicacionAsync(
                        dto.IdMaterial,
                        dto.IdUbicacion
                    );

            if (inventarioActual is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        "No existe inventario para ese material en la ubicación indicada."
                });
            }

            if (inventarioActual.Disponible <
                dto.Cantidad)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No existe inventario disponible suficiente."
                });
            }

            var inventario =
                await inventarioRepository
                    .RegistrarSalidaAsync(
                        dto.IdMaterial,
                        dto.IdUbicacion,
                        dto.Cantidad,
                        idUsuario,
                        dto.Referencia,
                        dto.Comentarios
                    );

            if (inventario is null)
            {
                return Results.Problem(
                    title:
                        "No se registró la salida",
                    detail:
                        "La salida fue procesada, pero no pudo consultarse.",
                    statusCode:
                        StatusCodes.Status500InternalServerError
                );
            }

            return Results.Ok(new
            {
                mensaje =
                    "La salida de inventario se registró correctamente.",
                inventario
            });
        })
        .WithName("RegistrarSalidaInventario")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            )
        );

    }
}