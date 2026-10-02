using MySqlConnector;
using System.Security.Claims;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de solicitudes.
public static class SolicitudEndpoints
{
    public static void MapSolicitudEndpoints(
        this WebApplication app)
    {
        // Todas las rutas requieren autenticación.
        var grupo = app.MapGroup("/api/solicitudes")
            .WithTags("Solicitudes")
            .RequireAuthorization();

        // Obtiene todas las solicitudes.
        grupo.MapGet("/", async (
            SolicitudRepository solicitudRepository) =>
        {
            var solicitudes =
                await solicitudRepository.ObtenerTodasAsync();

            return Results.Ok(solicitudes);
        })
        .WithName("ObtenerSolicitudes");

        // Obtiene las solicitudes pendientes.
        grupo.MapGet("/pendientes", async (
            SolicitudRepository solicitudRepository) =>
        {
            var solicitudes =
                await solicitudRepository
                    .ObtenerPendientesAsync();

            return Results.Ok(solicitudes);
        })
        .WithName("ObtenerSolicitudesPendientes");

        // Obtiene únicamente las solicitudes creadas por el usuario autenticado.
        grupo.MapGet("/mias", async (
            ClaimsPrincipal principal,
            SolicitudRepository solicitudRepository) =>
        {
            // Obtiene el identificador del usuario desde el token JWT.
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

            var solicitudes =
                await solicitudRepository.ObtenerPorUsuarioAsync(
                    idUsuario
                );

            return Results.Ok(solicitudes);
        })
        .WithName("ObtenerMisSolicitudes")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Produccion"
            ));



        // Obtiene los contadores del dashboard de almacén..
        grupo.MapGet("/dashboard", async (
            SolicitudRepository solicitudRepository) =>
        {
            var dashboard =
                await solicitudRepository.ObtenerDashboardAsync();

            return Results.Ok(dashboard);
        })
        .WithName("ObtenerDashboardSolicitudes")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));



        // Obtiene solicitudes filtradas por estado.
        grupo.MapGet("/estado/{idEstado:int}", async (
            int idEstado,
            SolicitudRepository solicitudRepository) =>
        {
            // Valida el catálogo actual de estados.
            if (idEstado < 1 || idEstado > 8)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del estado no es válido."
                });
            }

            var solicitudes =
                await solicitudRepository.ObtenerPorEstadoAsync(
                    idEstado
                );

            return Results.Ok(solicitudes);
        })
        .WithName("ObtenerSolicitudesPorEstado")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));

        // Obtiene solicitudes usando filtros opcionales combinables.
        grupo.MapGet("/filtro", async (
            int? idEstado,
            int? idProyecto,
            int? idFamilia,
            int? idEstacion,
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            SolicitudRepository solicitudRepository) =>
        {
            // Valida el estado cuando fue enviado.
            if (idEstado.HasValue &&
                (idEstado.Value < 1 ||
                 idEstado.Value > 8))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del estado no es válido."
                });
            }

            // Valida el proyecto cuando fue enviado.
            if (idProyecto.HasValue &&
                idProyecto.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del proyecto no es válido."
                });
            }

            // Valida la familia cuando fue enviada.
            if (idFamilia.HasValue &&
                idFamilia.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador de la familia no es válido."
                });
            }

            // Valida la estación cuando fue enviada.
            if (idEstacion.HasValue &&
                idEstacion.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador de la estación no es válido."
                });
            }

            // La fecha inicial no puede ser posterior a la fecha final.
            if (fechaDesde.HasValue &&
                fechaHasta.HasValue &&
                fechaDesde.Value.Date >
                fechaHasta.Value.Date)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La fecha inicial no puede ser posterior a la fecha final."
                });
            }

            var solicitudes =
                await solicitudRepository.ObtenerFiltradasAsync(
                    idEstado,
                    idProyecto,
                    idFamilia,
                    idEstacion,
                    fechaDesde,
                    fechaHasta
                );

            return Results.Ok(solicitudes);
        })
        .WithName("ObtenerSolicitudesFiltradas")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));


        // Obtiene una solicitud por su identificador.
        grupo.MapGet("/{idSolicitud:long}", async (
            long idSolicitud,
            SolicitudRepository solicitudRepository) =>
        {
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

            return Results.Ok(solicitud);
        })
        .WithName("ObtenerSolicitudPorId");

        // Crea una solicitud con uno o varios materiales.
        grupo.MapPost("/", async (
            CrearSolicitudDto dto,
            ClaimsPrincipal principal,
            ProyectoRepository proyectoRepository,
            FamiliaRepository familiaRepository,
            EstacionRepository estacionRepository,
            MaterialRepository materialRepository,
            SolicitudRepository solicitudRepository) =>
        {
            // Obtiene el usuario desde el token JWT.
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

            // Valida el proyecto.
            if (dto.IdProyecto <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El proyecto es obligatorio."
                });
            }

            var proyecto =
                await proyectoRepository.ObtenerPorIdAsync(
                    dto.IdProyecto
                );

            if (proyecto is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {dto.IdProyecto}."
                });
            }

            if (!proyecto.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear solicitudes para un proyecto inactivo."
                });
            }

            // Valida la familia.
            if (dto.IdFamilia <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La familia es obligatoria."
                });
            }

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

            if (!familia.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear solicitudes para una familia inactiva."
                });
            }

            // La familia debe pertenecer al proyecto.
            if (familia.IdProyecto != dto.IdProyecto)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La familia seleccionada no pertenece al proyecto indicado."
                });
            }

            // Valida la estación.
            if (dto.IdEstacion <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La estación es obligatoria."
                });
            }

            var estacion =
                await estacionRepository.ObtenerPorIdAsync(
                    dto.IdEstacion
                );

            if (estacion is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una estación con el identificador {dto.IdEstacion}."
                });
            }

            if (!estacion.Activo)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "No se pueden crear solicitudes para una estación inactiva."
                });
            }

            // La estación debe pertenecer a la familia.
            if (estacion.IdFamilia != dto.IdFamilia)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La estación seleccionada no pertenece a la familia indicada."
                });
            }

            // Valida el origen de la solicitud.
            if (string.IsNullOrWhiteSpace(
                dto.OrigenSolicitud))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El origen de la solicitud es obligatorio."
                });
            }

            var origenSolicitud =
                dto.OrigenSolicitud
                    .Trim()
                    .ToUpperInvariant();

            if (origenSolicitud != "ESCANEO" &&
                origenSolicitud != "MANUAL")
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El origen de la solicitud debe ser ESCANEO o MANUAL."
                });
            }

            // La solicitud debe incluir materiales.
            if (dto.Materiales is null ||
                dto.Materiales.Count == 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La solicitud debe incluir al menos un material."
                });
            }

            // Solo considera duplicado el mismo material
            // dentro del mismo contexto BOM y estación.
            var materialesDuplicados =
                dto.Materiales
                    .GroupBy(detalle => new
                    {
                        detalle.IdMaterial,
                        detalle.IdBomDetalle,
                        detalle.IdEstacion
                    })
                    .Where(
                        grupoMaterial =>
                            grupoMaterial.Count() > 1
                    )
                    .Select(grupoMaterial => new
                    {
                        grupoMaterial.Key.IdMaterial,
                        grupoMaterial.Key.IdBomDetalle,
                        grupoMaterial.Key.IdEstacion
                    })
                    .ToList();



            if (materialesDuplicados.Count > 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La solicitud no puede contener materiales duplicados.",
                    materialesDuplicados
                });
            }

            // Valida individualmente los materiales.
            foreach (var detalle in dto.Materiales)
            {
                if (detalle.IdMaterial <= 0)
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "Todos los materiales deben tener un identificador válido."
                    });
                }
                if (detalle.RequiereCantidad)
                {
                    if (
                        !detalle.CantidadBolsas.HasValue ||
                        detalle.CantidadBolsas.Value <= 0
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"Debes seleccionar al menos una bolsa para el material {detalle.IdMaterial}."
                        });
                    }

                    if (
                        !detalle.StdPackHistorico.HasValue ||
                        detalle.StdPackHistorico.Value <= 0
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"El material {detalle.IdMaterial} no tiene un Standard Pack válido."
                        });
                    }

                    var cantidadCalculada =
                        detalle.CantidadBolsas.Value *
                        detalle.StdPackHistorico.Value;

                    if (
                        detalle.CantidadSolicitada !=
                        cantidadCalculada
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"La cantidad del material {detalle.IdMaterial} no coincide con las bolsas seleccionadas."
                        });
                    }

                    if (
                        detalle.CantidadSolicitada <= 0 ||
                        detalle.CantidadSolicitada !=
                            decimal.Truncate(
                                detalle.CantidadSolicitada
                            )
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"La cantidad calculada del material {detalle.IdMaterial} debe ser un número entero mayor que cero."
                        });
                    }
                }
                else
                {
                    if (
                        detalle.CantidadSolicitada != 0 ||
                        detalle.CantidadBolsas.HasValue ||
                        detalle.StdPackHistorico.HasValue
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"El material {detalle.IdMaterial} no utiliza cantidad ni bolsas."
                        });
                    }
                }








                // Los materiales escaneados deben incluir
                // el contexto completo obtenido del QR.
                if (origenSolicitud == "ESCANEO")
                {
                    if (
                        !detalle.IdBomDetalle.HasValue ||
                        detalle.IdBomDetalle.Value <= 0
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"El material {detalle.IdMaterial} no contiene un detalle BOM válido."
                        });
                    }

                    if (
                        !detalle.IdArnes.HasValue ||
                        detalle.IdArnes.Value <= 0
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"El material {detalle.IdMaterial} no contiene un arnés válido."
                        });
                    }

                    if (
                        !detalle.IdEstacion.HasValue ||
                        detalle.IdEstacion.Value <= 0
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"El material {detalle.IdMaterial} no contiene una estación válida."
                        });
                    }
                }
                else
                {
                    // La captura manual puede no tener
                    // contexto BOM, arnés o estación.
                    // Si contiene alguno, deben venir todos.
                    var tieneAlgunContexto =
                        detalle.IdBomDetalle.HasValue ||
                        detalle.IdArnes.HasValue ||
                        detalle.IdEstacion.HasValue;

                    var tieneContextoCompleto =
                        detalle.IdBomDetalle.HasValue &&
                        detalle.IdArnes.HasValue &&
                        detalle.IdEstacion.HasValue;

                    if (
                        tieneAlgunContexto &&
                        !tieneContextoCompleto
                    )
                    {
                        return Results.BadRequest(new
                        {
                            mensaje =
                                $"El contexto del material {detalle.IdMaterial} está incompleto."
                        });
                    }
                }


                var material =
                    await materialRepository.ObtenerPorIdAsync(
                        detalle.IdMaterial
                    );

                if (material is null)
                {
                    return Results.NotFound(new
                    {
                        mensaje =
                            $"No existe un material con el identificador {detalle.IdMaterial}."
                    });
                }

                if (!material.Activo)
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            $"El material {material.NumeroParteMaterial} está inactivo."
                    });
                }
            }

            try
            {
                var solicitudCreada =
                    await solicitudRepository.CrearAsync(
                        dto.IdProyecto,
                        dto.IdFamilia,
                        dto.IdEstacion,
                        idUsuario,
                        origenSolicitud,
                        dto.Materiales
                    );

                if (solicitudCreada is null)
                {
                    return Results.Problem(
                        title:
                            "No se obtuvo la solicitud creada",
                        detail:
                            "La solicitud fue registrada, pero no pudo consultarse.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                return Results.Created(
                    $"/api/solicitudes/{solicitudCreada.IdSolicitud}",
                    solicitudCreada
                );
            }
            catch (MySqlException ex)
                when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "La solicitud contiene un material duplicado."
                });
            }
            catch (MySqlException ex)
                when (ex.Number == 3819)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La solicitud no cumple las restricciones de la base de datos."
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.BadRequest(new
                {
                    mensaje = ex.Message
                });
            }

        })
        .WithName("CrearSolicitud")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista",
                "Produccion"
            ));
        // Cambia el estado operativo de una solicitud.
        grupo.MapPatch(
            "/{idSolicitud:long}/estado",
            async (
                long idSolicitud,
                CambiarEstadoSolicitudDto dto,
                SolicitudRepository solicitudRepository) =>
        {
            // Comprueba que la solicitud exista.
            var solicitudActual =
                await solicitudRepository.ObtenerPorIdAsync(
                    idSolicitud
                );

            if (solicitudActual is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe una solicitud con el identificador {idSolicitud}."
                });
            }

            // Valida que el estado esté dentro del catálogo.
            if (dto.IdEstado < 1 || dto.IdEstado > 8)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El estado indicado no es válido."
                });
            }

            // Impide actualizar al mismo estado actual.
            if (solicitudActual.IdEstado == dto.IdEstado)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"La solicitud ya se encuentra en estado {solicitudActual.NombreEstado}."
                });
            }

            // Impide cancelar una solicitud
            // que ya tenga algún material surtido.
            if (dto.IdEstado == 8)
            {
                var tieneCantidadSurtida =
                    solicitudActual.Materiales.Any(
                        material =>
                            material.CantidadSurtida > 0
                    );

                if (tieneCantidadSurtida)
                {
                    return Results.Conflict(new
                    {
                        codigo =
                            "SOLICITUD_CON_SURTIDO",

                        mensaje =
                            "No se puede cancelar la solicitud porque uno o más materiales ya tienen cantidad surtida."
                    });
                }
            }

            // Los estados de surtido se determinan automáticamente
            // Los estados de surtido se calculan según
            // las cantidades realmente surtidas.
            // Los estados de surtido se determinan automáticamente
            // mediante las cantidades realmente surtidas.
            var transicionesPermitidas =
                new Dictionary<int, int[]>
                {
                    // Pendiente puede cancelarse manualmente.
                    [1] = new[] { 8 },

                    // Estados reservados o automáticos.
                    [2] = Array.Empty<int>(),
                    [3] = Array.Empty<int>(),
                    [4] = Array.Empty<int>(),
                    [5] = Array.Empty<int>(),

                    // Surtida es el estado final del piloto.
                    [6] = Array.Empty<int>(),

                    // Entregada queda reservada para una versión futura.
                    [7] = Array.Empty<int>(),

                    // Cancelada es final.
                    [8] = Array.Empty<int>()
                };

            var transicionValida =
                transicionesPermitidas.TryGetValue(
                    solicitudActual.IdEstado,
                    out var estadosPermitidos
                ) &&
                estadosPermitidos.Contains(
                    dto.IdEstado
                );

            if (!transicionValida)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No se permite cambiar la solicitud de " +
                        $"{solicitudActual.NombreEstado} al estado indicado."
                });
            }

            try
            {
                var solicitudActualizada =
                    await solicitudRepository.CambiarEstadoAsync(
                        idSolicitud,
                        dto.IdEstado
                    );

                if (solicitudActualizada is null)
                {
                    return Results.NotFound(new
                    {
                        mensaje =
                            $"No existe una solicitud con el identificador {idSolicitud}."
                    });
                }

                return Results.Ok(new
                {
                    mensaje =
                        "El estado de la solicitud se actualizó correctamente.",
                    solicitud = solicitudActualizada
                });
            }
            catch (MySqlException ex)
                when (ex.Number == 1452)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El estado solicitado no existe en la base de datos."
                });
            }
            catch (InvalidOperationException ex)
            {
                return Results.Conflict(new
                {
                    codigo =
                        "SOLICITUD_CON_SURTIDO",

                    mensaje =
                        ex.Message
                });
            }
        })
        .WithName("CambiarEstadoSolicitud")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista",              
                "Produccion"

                
            ));

        // Surte un material específico de una solicitud.
        grupo.MapPost(
            "/{idSolicitud:long}/surtir",
            async (
                long idSolicitud,
                SurtirSolicitudDetalleDto dto,
                SolicitudRepository solicitudRepository) =>
        {
            // Valida el identificador del detalle.
            if (dto.IdDetalle <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El detalle de la solicitud es obligatorio."
                });
            }


            // Valida que la cantidad surtida sea entera y mayor que cero.
            if (
                dto.Cantidad <= 0 ||
                dto.Cantidad !=
                decimal.Truncate(dto.Cantidad)
            )
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La cantidad a surtir debe ser un número entero mayor que cero."
                });
            }

            // Valida la referencia opcional.
            if (dto.Referencia?.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La referencia no puede exceder 100 caracteres."
                });
            }

            // Valida los comentarios opcionales.
            if (dto.Comentarios?.Trim().Length > 200)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "Los comentarios no pueden exceder 200 caracteres."
                });
            }


            var resultado =
        await solicitudRepository
            .SurtirDetalleAsync(
                idSolicitud,
                dto.IdDetalle,
                dto.Cantidad
            );
            // Devuelve 404 cuando no existe la solicitud.
            if (resultado.Codigo ==
                "SOLICITUD_NO_EXISTE")
            {
                return Results.NotFound(new
                {
                    codigo = resultado.Codigo,
                    mensaje = resultado.Mensaje
                });
            }

            // Devuelve 404 cuando el detalle no corresponde.
            if (resultado.Codigo ==
                "DETALLE_NO_EXISTE")
            {
                return Results.NotFound(new
                {
                    codigo = resultado.Codigo,
                    mensaje = resultado.Mensaje
                });
            }

            // Devuelve 409 cuando el estado no permite surtir.
            if (resultado.Codigo ==
                "ESTADO_NO_PERMITIDO")
            {
                return Results.Conflict(new
                {
                    codigo = resultado.Codigo,
                    mensaje = resultado.Mensaje
                });
            }

            // Devuelve 400 cuando la cantidad es inválida.
            if (resultado.Codigo ==
                "CANTIDAD_INVALIDA")
            {
                return Results.BadRequest(new
                {
                    codigo = resultado.Codigo,
                    mensaje = resultado.Mensaje
                });
            }

            // Evita surtir más de la cantidad pendiente.
            if (resultado.Codigo ==
                "CANTIDAD_EXCEDE_PENDIENTE")
            {
                return Results.BadRequest(new
                {
                    codigo = resultado.Codigo,
                    mensaje = resultado.Mensaje
                });
            }

            if (!resultado.Exitoso)
            {
                return Results.Problem(
                    title:
                        "No se completó el surtido",
                    detail:
                        resultado.Mensaje,
                    statusCode:
                        StatusCodes.Status500InternalServerError
                );
            }

            return Results.Ok(new
            {
                codigo = resultado.Codigo,
                mensaje = resultado.Mensaje,
                solicitud = resultado.Solicitud
            });
        })
        .WithName("SurtirDetalleSolicitud")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));
        // Elimina un material individual no surtido.
        grupo.MapDelete(
            "/{idSolicitud:long}/materiales/{idDetalle:long}",
            async (
                long idSolicitud,
                long idDetalle,
                SolicitudRepository solicitudRepository) =>
            {
                if (
                    idSolicitud <= 0 ||
                    idDetalle <= 0
                )
                {
                    return Results.BadRequest(new
                    {
                        mensaje =
                            "La solicitud o el material no son válidos."
                    });
                }

                var resultado =
                    await solicitudRepository
                        .EliminarDetalleAsync(
                            idSolicitud,
                            idDetalle
                        );

                if (
                    resultado.Codigo ==
                    "DETALLE_NO_EXISTE"
                )
                {
                    return Results.NotFound(new
                    {
                        codigo =
                            resultado.Codigo,

                        mensaje =
                            resultado.Mensaje
                    });
                }

                if (
                    resultado.Codigo ==
                    "MATERIAL_SURTIDO"
                )
                {
                    return Results.BadRequest(new
                    {
                        codigo =
                            resultado.Codigo,

                        mensaje =
                            resultado.Mensaje
                    });
                }

                if (
                    resultado.Codigo ==
                    "ULTIMO_MATERIAL"
                )
                {
                    return Results.BadRequest(new
                    {
                        codigo =
                            resultado.Codigo,

                        mensaje =
                            resultado.Mensaje
                    });
                }

                if (!resultado.Exitoso)
                {
                    return Results.Problem(
                        title:
                            "No se eliminó el material",

                        detail:
                            resultado.Mensaje,

                        statusCode:
                            StatusCodes
                                .Status500InternalServerError
                    );
                }

                return Results.Ok(new
                {
                    codigo =
                        resultado.Codigo,

                    mensaje =
                        resultado.Mensaje,

                    solicitud =
                        resultado.Solicitud
                });
            }
        )
        .WithName(
            "EliminarMaterialSolicitud"
        )
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador",
                "Supervisor",
                "Materialista"
            ));

    }
}