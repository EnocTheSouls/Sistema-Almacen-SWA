using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;
using System.Security.Claims;
namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de proyectos.
public static class ProyectoEndpoints
{
    public static void MapProyectoEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de proyectos.
        var grupo = app.MapGroup("/api/proyectos")
            .WithTags("Proyectos")
            .RequireAuthorization();

        // Obtiene todos los proyectos.
        grupo.MapGet("/", async (
            ProyectoRepository repository) =>
        {
            var proyectos =
                await repository.ObtenerTodosAsync();

            return Results.Ok(proyectos);
        })
        .WithName("ObtenerProyectos");

        // Obtiene un proyecto por su identificador.
        grupo.MapGet("/{idProyecto:int}", async (
            int idProyecto,
            ProyectoRepository repository) =>
        {
            var proyecto =
                await repository.ObtenerPorIdAsync(idProyecto);

            // Devuelve 404 cuando el proyecto no existe.
            if (proyecto is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {idProyecto}."
                });
            }

            return Results.Ok(proyecto);
        })
        .WithName("ObtenerProyectoPorId");
        // Crea un proyecto nuevo.
        grupo.MapPost("/", async (
            CrearProyectoDto dto,
            ProyectoRepository repository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre del proyecto es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del proyecto no puede exceder 50 caracteres."
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
                var proyectoCreado =
                    await repository.CrearAsync(
                        dto.Nombre,
                        dto.Descripcion
                    );

                return Results.Created(
                    $"/api/proyectos/{proyectoCreado.IdProyecto}",
                    proyectoCreado
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita proyectos con nombres duplicados.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un proyecto con ese nombre."
                });
            }
        })
        .WithName("CrearProyecto")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );



        // Actualiza los datos de un proyecto existente.
        grupo.MapPut("/{idProyecto:int}", async (
            int idProyecto,
            ActualizarProyectoDto dto,
            ProyectoRepository repository) =>
        {
            // Valida que el nombre tenga contenido.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre del proyecto es obligatorio."
                });
            }

            // Valida la longitud definida en MySQL.
            if (dto.Nombre.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del proyecto no puede exceder 50 caracteres."
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

            // Comprueba que el proyecto exista.
            var proyectoExistente =
                await repository.ObtenerPorIdAsync(idProyecto);

            if (proyectoExistente is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {idProyecto}."
                });
            }

            try
            {
                var actualizado =
                    await repository.ActualizarAsync(
                        idProyecto,
                        dto.Nombre,
                        dto.Descripcion,
                        dto.Activo
                    );

                if (!actualizado)
                {
                    return Results.Problem(
                        title: "No se actualizó el proyecto",
                        detail:
                            "MySQL no modificó el registro del proyecto.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                // Devuelve el proyecto con los datos actualizados.
                var proyectoActualizado =
                    await repository.ObtenerPorIdAsync(idProyecto);

                return Results.Ok(proyectoActualizado);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita utilizar el nombre de otro proyecto.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe otro proyecto con ese nombre."
                });
            }
        })
        .WithName("ActualizarProyecto")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );


        // Obtiene los materiales relacionados con los BOM
        // para mostrarlos y administrarlos por estación.
        grupo.MapGet(
            "/materiales-estaciones",
            async (
                BomRepository bomRepository) =>
            {
                var relaciones =
                    await bomRepository
                        .ObtenerRelacionesCodigosBarrasAsync();

                return Results.Ok(
                    relaciones
                );
            }
        )
        .WithName(
            "ObtenerMaterialesPorEstacion"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );

        // Cambia la estación de un detalle BOM específico
        // y devuelve el contenido actualizado del QR.
        grupo.MapPut(
            "/bom-detalles/{idDetalle:long}/estacion",
            async (
                long idDetalle,
                CambiarEstacionDetalleBomDto dto,
                HttpContext httpContext,
                BomRepository bomRepository) =>
            {
                if (idDetalle <= 0)
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El detalle BOM no es válido."
                        }
                    );
                }

                if (dto.IdEstacion <= 0)
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "Selecciona una estación válida."
                        }
                    );
                }

                var motivo =
                    dto.Motivo?.Trim() ??
                    string.Empty;

                if (motivo.Length < 5)
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "Escribe el motivo del cambio de estación."
                        }
                    );
                }

                if (motivo.Length > 500)
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El motivo no puede exceder 500 caracteres."
                        }
                    );
                }

                var idUsuarioTexto =
                    httpContext.User.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    );

                if (
                    !int.TryParse(
                        idUsuarioTexto,
                        out var idUsuario
                    )
                )
                {
                    return Results.Unauthorized();
                }

                // Cambia la estación y registra
                // el movimiento en bitácora.
                var resultado =
                    await bomRepository
                        .CambiarEstacionDetalleAsync(
                            idDetalle,
                            dto.IdEstacion,
                            idUsuario,
                            motivo
                        );

                if (resultado is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                "No se encontró el detalle BOM o la estación no pertenece a la misma familia."
                        }
                    );
                }

                // Vuelve a consultar el detalle actualizado.
                // MaterialBarcodeRelationRow genera
                // el contenido oficial del QR.
                var relacionQr =
                    await bomRepository
                        .ObtenerRelacionCodigoBarrasAsync(
                            idDetalle
                        );

                if (relacionQr is null)
                {
                    return Results.Problem(
                        title:
                            "La estación fue actualizada, pero no se pudo obtener el QR.",

                        detail:
                            "No se encontró el contexto activo del detalle BOM.",

                        statusCode:
                            StatusCodes
                                .Status500InternalServerError
                    );
                }

                resultado.ContenidoQr =
                    relacionQr.ContenidoQr;

                return Results.Ok(
                    new
                    {
                        mensaje =
                            resultado
                                .RequiereReemplazarQr
                                ? "La estación se actualizó. Reemplaza la etiqueta QR anterior."
                                : "El material ya estaba relacionado con esa estación.",

                        resultado
                    }
                );
            }
        )
        .WithName(
            "CambiarEstacionDetalleBom"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );




        // Elimina un proyecto únicamente cuando no tiene relaciones.
        grupo.MapDelete("/{idProyecto:int}", async (
            int idProyecto,
            ProyectoRepository repository) =>
        {
            // Valida el identificador recibido.
            if (idProyecto <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El identificador del proyecto no es válido."
                });
            }

            // Comprueba que el proyecto exista.
            var proyecto =
                await repository.ObtenerPorIdAsync(
                    idProyecto
                );

            if (proyecto is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un proyecto con el identificador {idProyecto}."
                });
            }

            // Solamente los racks asignados bloquean
            // la eliminación física del proyecto.
            var tieneRacksAsignados =
                await repository.TieneRacksAsignadosAsync(
                    idProyecto
                );

            if (tieneRacksAsignados)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "No se puede eliminar el proyecto porque tiene uno o más racks asignados."
                });
            }

            try
            {
                var eliminado =
                    await repository.EliminarAsync(
                        idProyecto
                    );

                if (!eliminado)
                {
                    return Results.Problem(
                        title:
                            "No se eliminó el proyecto",
                        detail:
                            "MySQL no eliminó el registro solicitado.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                // La eliminación fue exitosa y no requiere contenido.
                return Results.NoContent();
            }
            catch (MySqlException ex)
                when (ex.Number == 1451)
            {
                // Protección adicional si se crea una relación
                // entre la validación y la eliminación.
                return Results.Conflict(new
                {
                    mensaje =
                        "No se puede eliminar el proyecto porque ya tiene información relacionada."
                });
            }
        })
        .WithName("EliminarProyecto")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador")
        );
    }
}