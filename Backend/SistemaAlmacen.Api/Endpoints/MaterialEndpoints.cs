using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de materiales.
public static class MaterialEndpoints
{
    public static void MapMaterialEndpoints(
        this WebApplication app)
    {
        // Agrupa y protege las rutas de materiales.
        var grupo = app.MapGroup("/api/materiales")
            .WithTags("Materiales")
            .RequireAuthorization();

        // Obtiene todos los materiales.
        grupo.MapGet("/", async (
            MaterialRepository repository) =>
        {
            var materiales =
                await repository.ObtenerTodosAsync();

            return Results.Ok(materiales);
        })
        .WithName("ObtenerMateriales");

        // Obtiene un material por su identificador.
        grupo.MapGet("/{idMaterial:int}", async (
            int idMaterial,
            MaterialRepository repository) =>
        {
            var material =
                await repository.ObtenerPorIdAsync(
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

            return Results.Ok(material);
        })
        .WithName("ObtenerMaterialPorId");

        // Obtiene un material por su número de parte.
        grupo.MapGet("/numero-parte/{numeroParte}", async (
            string numeroParte,
            MaterialRepository repository) =>
        {
            // Valida el número de parte recibido.
            if (string.IsNullOrWhiteSpace(numeroParte))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte es obligatorio."
                });
            }

            var material =
                await repository.ObtenerPorNumeroParteAsync(
                    numeroParte
                );

            if (material is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe el material con número de parte {numeroParte}."
                });
            }

            return Results.Ok(material);
        })
        .WithName("ObtenerMaterialPorNumeroParte");

        // Crea un material nuevo.
        grupo.MapPost("/", async (
            CrearMaterialDto dto,
            MaterialRepository repository) =>
        {
            // Valida el número de parte.
            if (string.IsNullOrWhiteSpace(
                dto.NumeroParteMaterial))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte del material es obligatorio."
                });
            }

            if (dto.NumeroParteMaterial.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El número de parte no puede exceder 100 caracteres."
                });
            }

            // Valida la descripción obligatoria.
            if (string.IsNullOrWhiteSpace(dto.Descripcion))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción del material es obligatoria."
                });
            }

            if (dto.Descripcion.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción no puede exceder 255 caracteres."
                });
            }

            // Valida los campos opcionales.
            if (dto.UnidadMedida?.Trim().Length > 20)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La unidad de medida no puede exceder 20 caracteres."
                });
            }

            if (dto.CodigoBarras?.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El código de barras no puede exceder 100 caracteres."
                });
            }

            if (dto.SerialKits?.Trim().Length > 100)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El serial de kits no puede exceder 100 caracteres."
                });
            }

            // GenericCode es obligatorio y permite un carácter.
            if (string.IsNullOrWhiteSpace(dto.GenericCode))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El código genérico es obligatorio."
                });
            }

            if (dto.GenericCode.Trim().Length != 1)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El código genérico debe contener exactamente un carácter."
                });
            }
            var genericCodeLimpio =
            dto.GenericCode
            .Trim()
            .ToUpperInvariant();

            if (!new[] { "C", "P", "S", "W" }
                .Contains(genericCodeLimpio))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El código genérico debe ser C, P, S o W."
                });
            }


            // Valida el tipo de empaque.
            if (dto.TipoEmpaque?.Trim().Length > 30)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El tipo de empaque no puede exceder 30 caracteres."
                });
            }

            // Valida la cantidad estándar por empaque.
            if (dto.StdPack.HasValue &&
                dto.StdPack.Value <= 0)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La cantidad estándar por empaque debe ser mayor que cero."
                });
            }

            // Ambos datos deben existir juntos.
            if (string.IsNullOrWhiteSpace(dto.TipoEmpaque) !=
                !dto.StdPack.HasValue)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El tipo de empaque y el estándar de empaque deben capturarse juntos."
                });
            }

            try
            {
                var materialCreado =
                    await repository.CrearAsync(
                        dto.NumeroParteMaterial,
                        dto.Descripcion,
                        dto.UnidadMedida,
                        dto.CodigoBarras,
                        dto.SerialKits,
                        dto.GenericCode,
                        dto.TipoEmpaque,
                        dto.StdPack
                    );

                if (materialCreado is null)
                {
                    return Results.Problem(
                        title:
                            "No se obtuvo el material creado",
                        detail:
                            "El registro fue insertado, pero no pudo consultarse.",
                        statusCode:
                            StatusCodes.Status500InternalServerError
                    );
                }

                return Results.Created(
                    $"/api/materiales/{materialCreado.IdMaterial}",
                    materialCreado
                );
            }
            catch (MySqlException ex)
                when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un material con el mismo número de parte, código de barras o serial de kits."
                });
            }
        })
        .WithName("CrearMaterial")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador"));
        grupo.MapPut("/{idMaterial:int}", async (
        int idMaterial,
        ActualizarMaterialDto dto,
        MaterialRepository repository) =>
        {
            var materialExistente =
                await repository.ObtenerPorIdAsync(
                idMaterial
            );

            if (materialExistente is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe el material {idMaterial}."
                });
            }

            if (string.IsNullOrWhiteSpace(
                dto.NumeroParteMaterial))
            {
                return Results.BadRequest();
            }

            if (string.IsNullOrWhiteSpace(
                dto.Descripcion))
            {
                return Results.BadRequest();
            }

           

            try
            {
                var material =
                    await repository.ActualizarAsync(
                        idMaterial,
                        dto.NumeroParteMaterial,
                        dto.Descripcion,
                        dto.UnidadMedida,
                        dto.CodigoBarras,
                        dto.SerialKits, 
                        dto.GenericCode,
                        dto.TipoEmpaque,
                        dto.StdPack,
                        dto.Activo
                    );

                return Results.Ok(material);
            }
            catch (MySqlException ex)
                when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un material con esos datos."
                });



            }
        })
.WithName("ActualizarMaterial")
.RequireAuthorization(policy =>
policy.RequireRole("Administrador"));
        grupo.MapPatch(
            "/{idMaterial:int}/estado",
            async (
                int idMaterial,
                bool activo,
                MaterialRepository repository) =>
        {
            var actualizado =
                await repository.CambiarEstadoAsync(
                    idMaterial,
                    activo
                );

            if (!actualizado)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe el material {idMaterial}."
                });
            }

            return Results.NoContent();
        })
        .WithName("CambiarEstadoMaterial")
        .RequireAuthorization(policy =>
            policy.RequireRole("Administrador"));
        // Elimina un material sin relaciones.
        // Solamente un Administrador puede hacerlo.
        grupo.MapDelete(
            "/{idMaterial:int}",
            async (
                int idMaterial,
                MaterialRepository repository) =>
            {
                var material =
                    await repository.ObtenerPorIdAsync(
                        idMaterial
                    );

                if (material is null)
                {
                    return Results.NotFound(new
                    {
                        mensaje =
                            $"No existe el material {idMaterial}."
                    });
                }

                try
                {
                    var eliminado =
                        await repository.EliminarAsync(
                            idMaterial
                        );

                    if (!eliminado)
                    {
                        return Results.NotFound(new
                        {
                            mensaje =
                                $"No existe el material {idMaterial}."
                        });
                    }

                    return Results.NoContent();
                }
                catch (MySqlException ex)
                    when (ex.Number == 1451)
                {
                    return Results.Conflict(new
                    {
                        mensaje =
                            "El material no puede eliminarse porque tiene inventario, solicitudes, movimientos o BOM relacionados. Puedes marcarlo como inactivo."
                    });
                }
            }
        )
        .WithName("EliminarMaterial")
        .RequireAuthorization(policy =>
            policy.RequireRole(
                "Administrador"
            )
        );

    }
}