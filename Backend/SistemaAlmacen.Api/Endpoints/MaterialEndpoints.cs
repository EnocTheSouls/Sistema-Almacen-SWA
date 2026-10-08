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
        var grupo =
            app.MapGroup(
                "/api/materiales"
            )
            .WithTags(
                "Materiales"
            )
            .RequireAuthorization();

        // Obtiene todos los materiales.
        grupo.MapGet(
            "/",
            async (
                MaterialRepository repository) =>
            {
                var materiales =
                    await repository
                        .ObtenerTodosAsync();

                return Results.Ok(
                    materiales
                );
            }
        )
        .WithName(
            "ObtenerMateriales"
        );

        // Obtiene un material por su identificador.
        grupo.MapGet(
            "/{idMaterial:int}",
            async (
                int idMaterial,
                MaterialRepository repository) =>
            {
                var material =
                    await repository
                        .ObtenerPorIdAsync(
                            idMaterial
                        );

                if (material is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                $"No existe un material con el identificador {idMaterial}."
                        }
                    );
                }

                return Results.Ok(
                    material
                );
            }
        )
        .WithName(
            "ObtenerMaterialPorId"
        );

        // Obtiene un material por número de parte.
        grupo.MapGet(
            "/numero-parte/{numeroParte}",
            async (
                string numeroParte,
                MaterialRepository repository) =>
            {
                if (
                    string.IsNullOrWhiteSpace(
                        numeroParte
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El número de parte es obligatorio."
                        }
                    );
                }

                var material =
                    await repository
                        .ObtenerPorNumeroParteAsync(
                            numeroParte
                        );

                if (material is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                $"No existe el material con número de parte {numeroParte}."
                        }
                    );
                }

                return Results.Ok(
                    material
                );
            }
        )
        .WithName(
            "ObtenerMaterialPorNumeroParte"
        );

        // Valida una etiqueta QR contextual
        // contra la estructura real del BOM.
        grupo.MapPost(
            "/validar-qr",
            async (
                ValidarMaterialQrDto dto,
                BomRepository bomRepository) =>
            {
                if (
                    string.IsNullOrWhiteSpace(
                        dto.ContenidoQr
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El contenido del QR es obligatorio."
                        }
                    );
                }
                Console.WriteLine($"QR RECIBIDO: {dto.ContenidoQr}");
                var contenidoQrNormalizado =
                    dto.ContenidoQr
                        .Replace("ç", "|")
                        .Replace("Ç", "|")
                        .Replace("¡", "=")
                        .ToUpperInvariant();

                var resultadoLectura =
                    InterpretarQr(
                        contenidoQrNormalizado
                    );



                if (
                    !resultadoLectura.EsValido
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                resultadoLectura.Mensaje
                        }
                    );
                }

                var datosQr =
                    resultadoLectura.Datos!;

                var contexto =
                    await bomRepository
                        .ObtenerContextoQrAsync(
                            datosQr.IdBomDetalle
                        );

                if (contexto is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                "La etiqueta no corresponde a una relación activa y vigente del BOM."
                        }
                    );
                }

                // Comprueba que el texto QR no haya
                // sido alterado manualmente.
                var coincidenDatos =
                    contexto.IdBomDetalle ==
                        datosQr.IdBomDetalle &&
                    contexto.IdProyecto ==
                        datosQr.IdProyecto &&
                    contexto.IdFamilia ==
                        datosQr.IdFamilia &&
                    contexto.IdArnes ==
                        datosQr.IdArnes &&
                    contexto.IdEstacion ==
                        datosQr.IdEstacion &&
                    contexto.IdMaterial ==
                        datosQr.IdMaterial &&
                    contexto.NumeroParteMaterial
                        .Equals(
                            datosQr.NumeroParteMaterial,
                            StringComparison
                                .OrdinalIgnoreCase
                        );

                if (!coincidenDatos)
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La información del QR no coincide con la relación registrada en el BOM."
                        }
                    );
                }

                return Results.Ok(
                    contexto
                );
            }
        )
        .WithName(
            "ValidarMaterialQr"
        );
        // Obtiene el contexto BOM de un material
        // para la estación seleccionada.
        grupo.MapGet(
            "/{idMaterial:int}/contexto-estacion/{idEstacion:int}",
            async (
                int idMaterial,
                int idEstacion,
                BomRepository bomRepository) =>
            {
                if (
                    idMaterial <= 0 ||
                    idEstacion <= 0
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El material o la estación no son válidos."
                        }
                    );
                }

                var contexto =
                    await bomRepository
                        .ObtenerContextoMaterialAsync(
                            idMaterial,
                            idEstacion
                        );

                if (contexto is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                "El material no pertenece a la estación seleccionada."
                        }
                    );
                }

                return Results.Ok(
                    contexto
                );
            }
        )
        .WithName(
            "ObtenerContextoMaterialEstacion"
        );

        // Crea un material nuevo.
        grupo.MapPost(
            "/",
            async (
                CrearMaterialDto dto,
                MaterialRepository repository) =>
            {
                if (
                    string.IsNullOrWhiteSpace(
                        dto.NumeroParteMaterial
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El número de parte del material es obligatorio."
                        }
                    );
                }

                if (
                    dto.NumeroParteMaterial
                        .Trim()
                        .Length > 100
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El número de parte no puede exceder 100 caracteres."
                        }
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        dto.Descripcion
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La descripción del material es obligatoria."
                        }
                    );
                }

                if (
                    dto.Descripcion
                        .Trim()
                        .Length > 255
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La descripción no puede exceder 255 caracteres."
                        }
                    );
                }

                if (
                    dto.UnidadMedida
                        ?.Trim()
                        .Length > 20
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La unidad de medida no puede exceder 20 caracteres."
                        }
                    );
                }

                if (
                    dto.CodigoBarras
                        ?.Trim()
                        .Length > 100
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El código de barras no puede exceder 100 caracteres."
                        }
                    );
                }

                if (
                    dto.SerialKits
                        ?.Trim()
                        .Length > 100
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El serial de kits no puede exceder 100 caracteres."
                        }
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        dto.GenericCode
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El código genérico es obligatorio."
                        }
                    );
                }

                if (
                    dto.GenericCode
                        .Trim()
                        .Length != 1
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El código genérico debe contener exactamente un carácter."
                        }
                    );
                }

                var genericCodeLimpio =
                    dto.GenericCode
                        .Trim()
                        .ToUpperInvariant();

                if (
                    !new[]
                    {
                        "C",
                        "P",
                        "S",
                        "W"
                    }
                    .Contains(
                        genericCodeLimpio
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El código genérico debe ser C, P, S o W."
                        }
                    );
                }

                if (
                    dto.TipoEmpaque
                        ?.Trim()
                        .Length > 30
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El tipo de empaque no puede exceder 30 caracteres."
                        }
                    );
                }

                if (
                    dto.StdPack.HasValue &&
                    dto.StdPack.Value <= 0
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La cantidad estándar por empaque debe ser mayor que cero."
                        }
                    );
                }

                // Tipo de empaque y STD Pack
                // deben capturarse juntos.
                var tieneTipoEmpaque =
                    !string.IsNullOrWhiteSpace(
                        dto.TipoEmpaque
                    );

                if (
                    tieneTipoEmpaque !=
                    dto.StdPack.HasValue
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El tipo de empaque y el estándar de empaque deben capturarse juntos."
                        }
                    );
                }

                try
                {
                    var materialCreado =
                        await repository
                            .CrearAsync(
                                dto.NumeroParteMaterial,
                                dto.Descripcion,
                                dto.UnidadMedida,
                                dto.CodigoBarras,
                                dto.SerialKits,
                                genericCodeLimpio,
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
                                StatusCodes
                                    .Status500InternalServerError
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
                    return Results.Conflict(
                        new
                        {
                            mensaje =
                                "Ya existe un material con el mismo número de parte, código de barras o serial de kits."
                        }
                    );
                }
            }
        )
        .WithName(
            "CrearMaterial"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );

        // Actualiza un material.
        grupo.MapPut(
            "/{idMaterial:int}",
            async (
                int idMaterial,
                ActualizarMaterialDto dto,
                MaterialRepository repository) =>
            {
                var materialExistente =
                    await repository
                        .ObtenerPorIdAsync(
                            idMaterial
                        );

                if (materialExistente is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                $"No existe el material {idMaterial}."
                        }
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        dto.NumeroParteMaterial
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El número de parte es obligatorio."
                        }
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        dto.Descripcion
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La descripción es obligatoria."
                        }
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        dto.GenericCode
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El código genérico es obligatorio."
                        }
                    );
                }

                var genericCodeLimpio =
                    dto.GenericCode
                        .Trim()
                        .ToUpperInvariant();

                if (
                    !new[]
                    {
                        "C",
                        "P",
                        "S",
                        "W"
                    }
                    .Contains(
                        genericCodeLimpio
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El código genérico debe ser C, P, S o W."
                        }
                    );
                }

                try
                {
                    var material =
                        await repository
                            .ActualizarAsync(
                                idMaterial,
                                dto.NumeroParteMaterial,
                                dto.Descripcion,
                                dto.UnidadMedida,
                                dto.CodigoBarras,
                                dto.SerialKits,
                                genericCodeLimpio,
                                dto.TipoEmpaque,
                                dto.StdPack,
                                dto.Activo
                            );

                    return Results.Ok(
                        material
                    );
                }
                catch (MySqlException ex)
                    when (ex.Number == 1062)
                {
                    return Results.Conflict(
                        new
                        {
                            mensaje =
                                "Ya existe un material con esos datos."
                        }
                    );
                }
            }
        )
        .WithName(
            "ActualizarMaterial"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );

        // Activa o desactiva un material.
        grupo.MapPatch(
            "/{idMaterial:int}/estado",
            async (
                int idMaterial,
                bool activo,
                MaterialRepository repository) =>
            {
                var actualizado =
                    await repository
                        .CambiarEstadoAsync(
                            idMaterial,
                            activo
                        );

                if (!actualizado)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                $"No existe el material {idMaterial}."
                        }
                    );
                }

                return Results.NoContent();
            }
        )
        .WithName(
            "CambiarEstadoMaterial"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );

        // Elimina un material sin relaciones.
        grupo.MapDelete(
            "/{idMaterial:int}",
            async (
                int idMaterial,
                MaterialRepository repository) =>
            {
                var material =
                    await repository
                        .ObtenerPorIdAsync(
                            idMaterial
                        );

                if (material is null)
                {
                    return Results.NotFound(
                        new
                        {
                            mensaje =
                                $"No existe el material {idMaterial}."
                        }
                    );
                }

                try
                {
                    var eliminado =
                        await repository
                            .EliminarAsync(
                                idMaterial
                            );

                    if (!eliminado)
                    {
                        return Results.NotFound(
                            new
                            {
                                mensaje =
                                    $"No existe el material {idMaterial}."
                            }
                        );
                    }

                    return Results.NoContent();
                }
                catch (MySqlException ex)
                    when (ex.Number == 1451)
                {
                    return Results.Conflict(
                        new
                        {
                            mensaje =
                                "El material no puede eliminarse porque tiene inventario, solicitudes, movimientos o BOM relacionados. Puedes marcarlo como inactivo."
                        }
                    );
                }
            }
        )
        .WithName(
            "EliminarMaterial"
        )
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador"
                )
        );
    }

    // Interpreta el contenido compacto
    // de una etiqueta QR del sistema.
    private static ResultadoLecturaQr
        InterpretarQr(
            string contenidoQr)
    {
        var contenidoLimpio =
             contenidoQr
                .Replace("ç", "|")
                .Replace("ç", "|")
                .Replace("Ç", "|")
                .Replace("¡", "=")
                .Trim()
                .ToUpperInvariant();


        if (
            !contenidoLimpio.StartsWith(
                "SWA|",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return ResultadoLecturaQr.Error(
                "El código escaneado no es una etiqueta QR válida del Sistema Web de Almacén."
            );
        }

        var segmentos =
            contenidoLimpio.Split(
                '|',
                StringSplitOptions
                    .RemoveEmptyEntries |
                StringSplitOptions
                    .TrimEntries
            );

        if (
            segmentos.Length < 8 ||
            !segmentos[0].Equals(
                "SWA",
                StringComparison.OrdinalIgnoreCase
            )
        )
        {
            return ResultadoLecturaQr.Error(
                "La estructura de la etiqueta QR no es válida."
            );
        }

        var valores =
            new Dictionary<string, string>(
                StringComparer.OrdinalIgnoreCase
            );

        foreach (
            var segmento in
            segmentos.Skip(1)
        )
        {
            var posicionIgual =
                segmento.IndexOf('=');

            if (
                posicionIgual <= 0 ||
                posicionIgual >=
                    segmento.Length - 1
            )
            {
                return ResultadoLecturaQr.Error(
                    $"El segmento '{segmento}' del QR no es válido."
                );
            }

            var clave =
                segmento[
                    ..posicionIgual
                ]
                .Trim();

            var valor =
                segmento[
                    (posicionIgual + 1)..
                ]
                .Trim();

            if (
                string.IsNullOrWhiteSpace(
                    clave
                ) ||
                string.IsNullOrWhiteSpace(
                    valor
                )
            )
            {
                return ResultadoLecturaQr.Error(
                    "La etiqueta QR contiene valores vacíos."
                );
            }

            if (
                valores.ContainsKey(
                    clave
                )
            )
            {
                return ResultadoLecturaQr.Error(
                    $"La propiedad {clave} aparece repetida en el QR."
                );
            }

            valores[clave] =
                valor;
        }

        var clavesObligatorias =
            new[]
            {
                "V",
                "BD",
                "P",
                "F",
                "A",
                "E",
                "M",
                "NP"
            };

        var clavesFaltantes =
            clavesObligatorias
                .Where(
                    clave =>
                        !valores.ContainsKey(
                            clave
                        )
                )
                .ToList();

        if (clavesFaltantes.Count > 0)
        {
            return ResultadoLecturaQr.Error(
                "La etiqueta QR no contiene: " +
                string.Join(
                    ", ",
                    clavesFaltantes
                ) +
                "."
            );
        }

        if (
            !int.TryParse(
                valores["V"],
                out var version
            ) ||
            version != 1
        )
        {
            return ResultadoLecturaQr.Error(
                "La versión de la etiqueta QR no es compatible."
            );
        }

        if (
            !long.TryParse(
                valores["BD"],
                out var idBomDetalle
            ) ||
            idBomDetalle <= 0
        )
        {
            return ResultadoLecturaQr.Error(
                "El identificador del detalle BOM no es válido."
            );
        }

        if (
            !int.TryParse(
                valores["P"],
                out var idProyecto
            ) ||
            idProyecto <= 0
        )
        {
            return ResultadoLecturaQr.Error(
                "El identificador del proyecto no es válido."
            );
        }

        if (
            !int.TryParse(
                valores["F"],
                out var idFamilia
            ) ||
            idFamilia <= 0
        )
        {
            return ResultadoLecturaQr.Error(
                "El identificador de la familia no es válido."
            );
        }

        if (
            !int.TryParse(
                valores["A"],
                out var idArnes
            ) ||
            idArnes <= 0
        )
        {
            return ResultadoLecturaQr.Error(
                "El identificador del arnés no es válido."
            );
        }

        if (
            !int.TryParse(
                valores["E"],
                out var idEstacion
            ) ||
            idEstacion <= 0
        )
        {
            return ResultadoLecturaQr.Error(
                "El identificador de la estación no es válido."
            );
        }

        if (
            !int.TryParse(
                valores["M"],
                out var idMaterial
            ) ||
            idMaterial <= 0
        )
        {
            return ResultadoLecturaQr.Error(
                "El identificador del material no es válido."
            );
        }

        var numeroParte =
            valores["NP"]
                .Trim()
                .ToUpperInvariant();

        if (
            string.IsNullOrWhiteSpace(
                numeroParte
            ) ||
            numeroParte.Length > 100
        )
        {
            return ResultadoLecturaQr.Error(
                "El número de parte contenido en el QR no es válido."
            );
        }

        return ResultadoLecturaQr.Exito(
            new MaterialQrDataDto
            {
                Version =
                    version,

                IdBomDetalle =
                    idBomDetalle,

                IdProyecto =
                    idProyecto,

                IdFamilia =
                    idFamilia,

                IdArnes =
                    idArnes,

                IdEstacion =
                    idEstacion,

                IdMaterial =
                    idMaterial,

                NumeroParteMaterial =
                    numeroParte
            }
        );
    }

    // Encapsula el resultado obtenido
    // al interpretar la etiqueta QR.
    private sealed class ResultadoLecturaQr
    {
        public bool EsValido
        {
            get;
            init;
        }

        public string Mensaje
        {
            get;
            init;
        } = string.Empty;

        public MaterialQrDataDto? Datos
        {
            get;
            init;
        }

        public static ResultadoLecturaQr
            Exito(
                MaterialQrDataDto datos)
        {
            return new ResultadoLecturaQr
            {
                EsValido =
                    true,

                Datos =
                    datos
            };
        }

        public static ResultadoLecturaQr
            Error(
                string mensaje)
        {
            return new ResultadoLecturaQr
            {
                EsValido =
                    false,

                Mensaje =
                    mensaje
            };
        }
    }
}
