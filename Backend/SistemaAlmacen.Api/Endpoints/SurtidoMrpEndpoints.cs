using System.Security.Claims;
using MySqlConnector;
using SistemaAlmacen.Api.Data;

namespace SistemaAlmacen.Api.Endpoints;

// Consulta proyectos, familias y materiales
// del MRP enlazados con los kits de PICS.
public static class SurtidoMrpEndpoints
{
    public static void MapSurtidoMrpEndpoints(
        this WebApplication app)
    {
        var grupo =
            app.MapGroup(
                "/api/surtido-mrp"
            )
            .WithTags(
                "Surtido MRP"
            )
            .RequireAuthorization();

        grupo.MapGet(
            "/fechas",
            ObtenerFechasAsync
        );

        // Devuelve los proyectos
        // del MRP vigente.
        grupo.MapGet(
            "/proyectos",
            ObtenerProyectosAsync
        );

        // Devuelve las familias
        // del proyecto seleccionado.
        grupo.MapGet(
            "/familias",
            ObtenerFamiliasAsync
        );

        // Devuelve los materiales,
        // necesidad MRP y disponibilidad PICS.
        grupo.MapGet(
            "/materiales",
            ObtenerMaterialesAsync
        );
        // Devuelve los kits pendientes
        // de recepción.
        grupo.MapGet(
            "/kits-no-recibidos",
            ObtenerKitsNoRecibidosAsync
        );

        // Devuelve cada kit PICS
        // separado por número de serie.
        grupo.MapGet(
            "/kits-individuales",
            ObtenerKitsIndividualesAsync
        );
        // Devuelve el próximo kit
        // según el orden FIFO.
        grupo.MapGet(
            "/requerimientos/{idRequerimiento:long}/siguiente-kit",
            ObtenerSiguienteKitFifoAsync
        );
        // Procesa el escaneo y descuenta
        // la existencia del kit.
        grupo.MapPost(
            "/escanear-kit",
            EscanearKitAsync
        );
    }


    // Devuelve los días cubiertos
    // por el PICS semanal activo.
    private static async Task<IResult>
        ObtenerFechasAsync(
            MySqlConnectionFactory connectionFactory)
    {
        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT DISTINCT
            fecha_eta
        FROM vista_surtido_mrp_diario
        ORDER BY
            fecha_eta;
        """;

        var fechas =
            new List<string>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            fechas.Add(
                reader
                    .GetDateTime(
                        "fecha_eta"
                    )
                    .ToString(
                        "yyyy-MM-dd"
                    )
            );
        }

        return Results.Ok(fechas);
    }
    private static async Task<IResult>
        ObtenerProyectosAsync(
            DateTime? fecha,
            MySqlConnectionFactory connectionFactory)
    {
        if (!fecha.HasValue)
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona una fecha de surtido."
                }
            );
        }
        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
    SELECT DISTINCT
        proyecto
    FROM vista_surtido_mrp_diario
    WHERE fecha_eta =
          @fecha
    ORDER BY
        proyecto;
    """;

        command.Parameters.Add(
            "@fecha",
            MySqlDbType.Date
        ).Value =
            fecha.Value.Date;

        var proyectos =
            new List<string>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            proyectos.Add(
                reader.GetString(
                    "proyecto"
                )
            );
        }

        return Results.Ok(proyectos);
    }
    private static async Task<IResult>
   ObtenerFamiliasAsync(
    DateTime? fecha,
    string? proyecto,
    MySqlConnectionFactory connectionFactory)
    {
        if (!fecha.HasValue)
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona una fecha de surtido."
                }
            );
        }

        var proyectoNormalizado =
            proyecto?.Trim() ?? "";

        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
                SELECT DISTINCT
                    familia
                FROM vista_surtido_mrp_diario
                WHERE fecha_eta =
                    @fecha
                AND (
                @proyecto = ''
                OR UPPER(
                    TRIM(proyecto)
                ) = UPPER(
                    @proyecto
                )
            )
            ORDER BY
                familia;
            """;

        command.Parameters.Add(
            "@fecha",
            MySqlDbType.Date
        ).Value =
        fecha.Value.Date;

        command.Parameters.Add(
            "@proyecto",
            MySqlDbType.VarChar
        ).Value =
            proyectoNormalizado;

        var familias =
            new List<string>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            familias.Add(
                reader.GetString(
                    "familia"
                )
            );
        }

        return Results.Ok(familias);
    }
    private static async Task<IResult>
    ObtenerMaterialesAsync(
        DateTime? fecha,
        string proyecto,
        string familia,
        MySqlConnectionFactory connectionFactory)
    {
        if (!fecha.HasValue)
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona una fecha de surtido."
                }
            );
        }

        var proyectoNormalizado =
            proyecto?.Trim() ?? "";

        var familiaNormalizada =
            familia?.Trim() ?? "";

        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_requerimiento,
                id_importacion_mrp,
                numero_requisicion,
                fecha_eta,

                id_proyecto,
                proyecto,

                id_familia,
                familia,

                id_material,
                numero_material,
                nombre_material,
                tipo_material,

                cantidad_requerida_dia,
                cantidad_surtida_dia,
                cantidad_pendiente_dia,

                kits_disponibles,
                cantidad_disponible,

                kits_no_recibidos,
                cantidad_no_recibida,

                cantidad_surtible,
                estado_surtido

            FROM vista_surtido_mrp_diario

            WHERE fecha_eta =
                @fecha

            AND UPPER(
                TRIM(proyecto)
            ) = UPPER(
                @proyecto
            )

            AND UPPER(
                TRIM(familia)
            ) = UPPER(
                @familia
            )

            ORDER BY
                numero_material,
                id_requerimiento;
            """;


        command.Parameters.Add(
            "@fecha",
            MySqlDbType.Date
        ).Value =
            fecha.Value.Date;

        command.Parameters.Add(
            "@proyecto",
            MySqlDbType.VarChar
        ).Value =
            proyectoNormalizado;

        command.Parameters.Add(
            "@familia",
            MySqlDbType.VarChar
        ).Value =
            familiaNormalizada;

        var materiales =
            new List<object>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            materiales.Add(
                new
                {
                    idRequerimiento =
                        reader.GetInt64(
                            "id_requerimiento"
                        ),

                    idImportacionMrp =
                        reader.GetInt64(
                            "id_importacion_mrp"
                        ),

                    numeroRequisicion =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_requisicion"
                        ),

                    fecha =
                        reader
                            .GetDateTime(
                                "fecha_eta"
                            )
                            .ToString(
                                "yyyy-MM-dd"
                            ),

                    idProyecto =
                        ObtenerEnteroOpcional(
                            reader,
                            "id_proyecto"
                        ),

                    proyecto =
                        reader.GetString(
                            "proyecto"
                        ),

                    idFamilia =
                        ObtenerEnteroOpcional(
                            reader,
                            "id_familia"
                        ),

                    familia =
                        reader.GetString(
                            "familia"
                        ),

                    idMaterial =
                        ObtenerEnteroOpcional(
                            reader,
                            "id_material"
                        ),

                    numeroMaterial =
                        reader.GetString(
                            "numero_material"
                        ),

                    nombreMaterial =
                        ObtenerTextoOpcional(
                            reader,
                            "nombre_material"
                        ),

                    tipoMaterial =
                        ObtenerTextoOpcional(
                            reader,
                            "tipo_material"
                        ),
                    cantidadRequeridaDia =
                        reader.GetDecimal(
                            "cantidad_requerida_dia"
                        ),

                    cantidadSurtidaDia =
                        reader.GetDecimal(
                            "cantidad_surtida_dia"
                        ),
                    kitsDisponibles =
                        reader.GetInt64(
                            "kits_disponibles"
                        ),

                    cantidadDisponible =
                        reader.GetDecimal(
                            "cantidad_disponible"
                        ),

                    kitsNoRecibidos =
                        reader.GetInt64(
                            "kits_no_recibidos"
                        ),

                    cantidadNoRecibida =
                        reader.GetDecimal(
                            "cantidad_no_recibida"
                        ),

                    cantidadPendienteDia =
                        reader.GetDecimal(
                            "cantidad_pendiente_dia"
                        ),

                    cantidadSurtible =
                        reader.GetDecimal(
                            "cantidad_surtible"
                        ),
                    estadoSurtido =
                        reader.GetString(
                            "estado_surtido"
                        )

                }
            );
        }

        return Results.Ok(materiales);
    }

    // Obtiene un entero que puede ser NULL.
    private static int? ObtenerEnteroOpcional(
        MySqlDataReader reader,
        string nombreColumna)
    {
        var indice =
            reader.GetOrdinal(
                nombreColumna
            );

        return reader.IsDBNull(
            indice
        )
            ? null
            : reader.GetInt32(
                indice
            );
    }

    // Obtiene un texto que puede ser NULL.
    private static string? ObtenerTextoOpcional(
        MySqlDataReader reader,
        string nombreColumna)
    {
        var indice =
            reader.GetOrdinal(
                nombreColumna
            );

        return reader.IsDBNull(
            indice
        )
            ? null
            : reader.GetString(
                indice
            );
    }
    private static async Task<IResult>
    ObtenerKitsNoRecibidosAsync(
        DateTime? fecha,
        string? proyecto,
        string? familia,
        MySqlConnectionFactory connectionFactory)
    {
        if (!fecha.HasValue)
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona una fecha de surtido."
                }
            );
        }

        // Vacío significa todos los proyectos.
        var proyectoNormalizado =
            proyecto?.Trim() ?? "";

        // Vacío significa todas las familias.
        var familiaNormalizada =
            familia?.Trim() ?? "";

        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
    SELECT
        mk.id_material_kit,

        TRIM(
            mk.numero_material_origen
        ) AS numero_material,

        mk.serial_caja,
        mk.numero_asn,
        mk.numero_camion,
        mk.numero_pallet,
        mk.cantidad_inicial,
        mk.estado_origen,
        mk.localidad,
        mk.rack,
        mk.ship_from

    FROM material_kit AS mk

    INNER JOIN importacion_pics AS ip
        ON ip.id_importacion_pics =
           mk.id_importacion_pics

    WHERE mk.activo = TRUE
      AND ip.activo = TRUE
      AND mk.estado_kit =
          'POR_RECIBIR'

      AND EXISTS (
          SELECT 1

          FROM vista_surtido_mrp_acumulado AS mrp

          WHERE mrp.fecha_eta =
                @fecha

            AND (
                @proyecto = ''
                OR UPPER(
                    TRIM(mrp.proyecto)
                ) = UPPER(
                    @proyecto
                )
            )

            AND (
                @familia = ''
                OR UPPER(
                    TRIM(mrp.familia)
                ) = UPPER(
                    @familia
                )
            )

            AND UPPER(
                TRIM(mrp.numero_material)
            ) = UPPER(
                TRIM(
                    mk.numero_material_origen
                )
            )
      )

    ORDER BY
        numero_material,
        mk.serial_caja;
    """;

        command.Parameters.Add(
            "@fecha",
            MySqlDbType.Date
        ).Value =
            fecha.Value.Date;

        command.Parameters.Add(
            "@proyecto",
            MySqlDbType.VarChar
        ).Value =
            proyectoNormalizado;

        command.Parameters.Add(
            "@familia",
            MySqlDbType.VarChar
        ).Value =
            familiaNormalizada;

        var kits =
            new List<object>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            kits.Add(
                new
                {
                    idMaterialKit =
                        reader.GetInt64(
                            "id_material_kit"
                        ),

                    numeroMaterial =
                        reader.GetString(
                            "numero_material"
                        ),

                    serialCaja =
                        reader.GetString(
                            "serial_caja"
                        ),

                    numeroAsn =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_asn"
                        ),

                    numeroCamion =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_camion"
                        ),

                    numeroPallet =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_pallet"
                        ),

                    cantidad =
                        reader.GetDecimal(
                            "cantidad_inicial"
                        ),

                    estado =
                        ObtenerTextoOpcional(
                            reader,
                            "estado_origen"
                        ),

                    localidad =
                        ObtenerTextoOpcional(
                            reader,
                            "localidad"
                        ),

                    rack =
                        ObtenerTextoOpcional(
                            reader,
                            "rack"
                        ),

                    shipFrom =
                        ObtenerTextoOpcional(
                            reader,
                            "ship_from"
                        )
                }
            );
        }

        return Results.Ok(kits);
    }




    // Devuelve todos los kits relacionados
    // con el MRP seleccionado, uno por serial.
    private static async Task<IResult>
        ObtenerKitsIndividualesAsync(
            DateTime? fecha,
            string? proyecto,
            string? familia,
            MySqlConnectionFactory connectionFactory)
    {
        if (!fecha.HasValue)
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona una fecha de surtido."
                }
            );
        }

        var proyectoNormalizado =
            proyecto?.Trim() ?? "";

        var familiaNormalizada =
            familia?.Trim() ?? "";

        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
    SELECT
        mk.id_material_kit,

        TRIM(
            mk.numero_material_origen
        ) AS numero_material,

        mrp.nombre_material,
        mrp.tipo_material,

        mk.serial_caja,
        mk.numero_asn,
        mk.numero_camion,
        mk.numero_pallet,

        mk.cantidad_inicial,
        mk.cantidad_disponible,

        mk.estado_origen,
        mk.estado_kit,

        mk.localidad,
        mk.rack,
        mk.ship_from,

        mk.fecha_importacion,
        mk.fecha_actualizacion

    FROM material_kit AS mk

    INNER JOIN importacion_pics AS ip
        ON ip.id_importacion_pics =
           mk.id_importacion_pics

    INNER JOIN (
        SELECT DISTINCT
            numero_material,
            nombre_material,
            tipo_material

        FROM vista_surtido_mrp_acumulado

        WHERE fecha_eta =
              @fecha

          AND (
              @proyecto = ''
              OR UPPER(
                  TRIM(proyecto)
              ) = UPPER(
                  @proyecto
              )
          )

          AND (
              @familia = ''
              OR UPPER(
                  TRIM(familia)
              ) = UPPER(
                  @familia
              )
          )
    ) AS mrp
        ON UPPER(
            TRIM(mrp.numero_material)
        ) = UPPER(
            TRIM(
                mk.numero_material_origen
            )
        )

    WHERE mk.activo = TRUE
      AND ip.activo = TRUE

    ORDER BY
        numero_material,
        mk.serial_caja;
    """;

        command.Parameters.Add(
            "@fecha",
            MySqlDbType.Date
        ).Value =
            fecha.Value.Date;

        command.Parameters.Add(
            "@proyecto",
            MySqlDbType.VarChar
        ).Value =
            proyectoNormalizado;

        command.Parameters.Add(
            "@familia",
            MySqlDbType.VarChar
        ).Value =
            familiaNormalizada;

        var kits =
            new List<object>();

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            kits.Add(
                new
                {
                    idMaterialKit =
                        reader.GetInt64(
                            "id_material_kit"
                        ),

                    numeroMaterial =
                        reader.GetString(
                            "numero_material"
                        ),

                    nombreMaterial =
                        ObtenerTextoOpcional(
                            reader,
                            "nombre_material"
                        ),

                    tipoMaterial =
                        ObtenerTextoOpcional(
                            reader,
                            "tipo_material"
                        ),

                    serialCaja =
                        reader.GetString(
                            "serial_caja"
                        ),

                    numeroAsn =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_asn"
                        ),

                    numeroCamion =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_camion"
                        ),

                    numeroPallet =
                        ObtenerTextoOpcional(
                            reader,
                            "numero_pallet"
                        ),

                    cantidadInicial =
                        reader.GetDecimal(
                            "cantidad_inicial"
                        ),

                    cantidadDisponible =
                        reader.GetDecimal(
                            "cantidad_disponible"
                        ),

                    estadoOrigen =
                        ObtenerTextoOpcional(
                            reader,
                            "estado_origen"
                        ),

                    estadoKit =
                        reader.GetString(
                            "estado_kit"
                        ),

                    localidad =
                        ObtenerTextoOpcional(
                            reader,
                            "localidad"
                        ),

                    rack =
                        ObtenerTextoOpcional(
                            reader,
                            "rack"
                        ),

                    shipFrom =
                        ObtenerTextoOpcional(
                            reader,
                            "ship_from"
                        ),

                    fechaImportacion =
                        reader
                            .GetDateTime(
                                "fecha_importacion"
                            )
                            .ToString(
                                "yyyy-MM-dd HH:mm:ss"
                            ),

                    fechaActualizacion =
                        ObtenerFechaOpcional(
                            reader,
                            "fecha_actualizacion"
                        )
                }
            );
        }

        return Results.Ok(kits);
    }


    // Obtiene una fecha que puede ser NULL.
    private static string? ObtenerFechaOpcional(
        MySqlDataReader reader,
        string nombreColumna)
    {
        var indice =
            reader.GetOrdinal(
                nombreColumna
            );

        return reader.IsDBNull(
            indice
        )
            ? null
            : reader
                .GetDateTime(
                    indice
                )
                .ToString(
                    "yyyy-MM-dd HH:mm:ss"
                );
    }
    private static async Task<IResult>
    ObtenerSiguienteKitFifoAsync(
        long idRequerimiento,
        MySqlConnectionFactory connectionFactory)
    {
        await using var connection =
            connectionFactory.CreateConnection();

        await connection.OpenAsync();

        string numeroMaterial;
        decimal pendienteDia;

        await using (
            var command =
                connection.CreateCommand()
        )
        {
            command.CommandText = """
        SELECT
            numero_material,
            cantidad_pendiente_dia

        FROM vista_surtido_mrp_diario

        WHERE id_requerimiento =
              @idRequerimiento

        LIMIT 1;
        """;

            command.Parameters.Add(
                "@idRequerimiento",
                MySqlDbType.Int64
            ).Value =
                idRequerimiento;

            await using var reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return Results.NotFound(
                    new
                    {
                        mensaje =
                            "No se encontró el requerimiento MRP."
                    }
                );
            }

            numeroMaterial =
                reader.GetString(
                    "numero_material"
                );

            pendienteDia =
                reader.GetDecimal(
                    "cantidad_pendiente_dia"
                );
        }

        if (pendienteDia <= 0)
        {
            return Results.Conflict(
                new
                {
                    mensaje =
                        "El requerimiento del día ya está completado."
                }
            );
        }

        await using var kitCommand =
            connection.CreateCommand();

        kitCommand.CommandText = """
    SELECT
        mk.id_material_kit,
        mk.serial_caja,

        TRIM(
            mk.numero_material_origen
        ) AS numero_material,

        mk.cantidad_inicial,
        mk.cantidad_disponible,
        mk.estado_kit,
        mk.fecha_importacion

    FROM material_kit AS mk

    INNER JOIN importacion_pics AS ip
        ON ip.id_importacion_pics =
           mk.id_importacion_pics

    WHERE mk.activo = TRUE
      AND ip.activo = TRUE

      AND mk.estado_kit IN (
          'DISPONIBLE',
          'PARCIAL'
      )

      AND mk.cantidad_disponible > 0

      AND UPPER(
          TRIM(
              mk.numero_material_origen
          )
      ) = UPPER(
          @numeroMaterial
      )

    ORDER BY
        mk.fecha_importacion,
        mk.id_material_kit

    LIMIT 1;
    """;

        kitCommand.Parameters.Add(
            "@numeroMaterial",
            MySqlDbType.VarChar
        ).Value =
            numeroMaterial;

        await using var kitReader =
            await kitCommand.ExecuteReaderAsync();

        if (!await kitReader.ReadAsync())
        {
            return Results.NotFound(
                new
                {
                    mensaje =
                        "No existe un kit recibido y disponible para este material.",

                    numeroMaterial,
                    pendienteDia
                }
            );
        }

        return Results.Ok(
            new
            {
                idMaterialKit =
                    kitReader.GetInt64(
                        "id_material_kit"
                    ),

                serialKit =
                    kitReader.GetString(
                        "serial_caja"
                    ),

                numeroMaterial =
                    kitReader.GetString(
                        "numero_material"
                    ),

                cantidadInicial =
                    kitReader.GetDecimal(
                        "cantidad_inicial"
                    ),

                cantidadDisponible =
                    kitReader.GetDecimal(
                        "cantidad_disponible"
                    ),

                estadoKit =
                    kitReader.GetString(
                        "estado_kit"
                    ),

                pendienteDia,

                fechaRegistroPics =
                    kitReader
                        .GetDateTime(
                            "fecha_importacion"
                        )
                        .ToString(
                            "yyyy-MM-dd HH:mm:ss"
                        )
            }
        );
    }

    // Valida temporalmente la solicitud
    // antes de agregar el descuento FIFO.
    private static Task<IResult>
        EscanearKitAsync(
            EscanearKitMrpRequest request,
            HttpContext httpContext,
            MySqlConnectionFactory connectionFactory)
    {
        var serialNormalizado =
            request.SerialKit?.Trim() ?? "";

        if (request.IdRequerimiento <= 0)
        {
            IResult resultado =
                Results.BadRequest(
                    new
                    {
                        mensaje =
                            "El requerimiento MRP no es válido."
                    }
                );

            return Task.FromResult(
                resultado
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                serialNormalizado
            )
        )
        {
            IResult resultado =
                Results.BadRequest(
                    new
                    {
                        mensaje =
                            "Escanea el serial del kit."
                    }
                );

            return Task.FromResult(
                resultado
            );
        }

        var idUsuarioTexto =
            httpContext.User.FindFirst(
                ClaimTypes.NameIdentifier
            )?.Value;

        if (
            !int.TryParse(
                idUsuarioTexto,
                out _
            )
        )
        {
            IResult resultado =
                Results.Unauthorized();

            return Task.FromResult(
                resultado
            );
        }

        // Se utilizará cuando agreguemos
        // la transacción FIFO real.
        _ = connectionFactory;

        IResult pendienteImplementacion =
            Results.Json(
                new
                {
                    mensaje =
                        "La solicitud de escaneo es válida. Falta habilitar el descuento FIFO.",

                    idRequerimiento =
                        request.IdRequerimiento,

                    serialKit =
                        serialNormalizado
                },
                statusCode:
                    StatusCodes
                        .Status501NotImplemented
            );

        return Task.FromResult(
            pendienteImplementacion
        );
    }

}

public sealed record EscanearKitMrpRequest(
    long IdRequerimiento,
    string SerialKit
);