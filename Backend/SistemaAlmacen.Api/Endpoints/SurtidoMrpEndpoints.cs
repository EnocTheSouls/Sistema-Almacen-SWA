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
        grupo.MapGet(
            "/kits-no-recibidos",
            ObtenerKitsNoRecibidosAsync
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
        string proyecto,
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


        if (
            string.IsNullOrWhiteSpace(
                proyectoNormalizado
            )
        )
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona un proyecto."
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
        familia
    FROM vista_surtido_mrp_diario
    WHERE fecha_eta =
          @fecha
      AND UPPER(
          TRIM(proyecto)
      ) = UPPER(
          @proyecto
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

        if (
            string.IsNullOrWhiteSpace(
                proyectoNormalizado
            ) ||
            string.IsNullOrWhiteSpace(
                familiaNormalizada
            )
        )
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona proyecto y familia."
                }
            );
        }

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

        cantidad_requerida_acumulada,
        cantidad_surtida_acumulada,
        cantidad_pendiente_acumulada,

        kits_disponibles,
        cantidad_disponible,

        kits_no_recibidos,
        cantidad_no_recibida,

        cantidad_surtible_acumulada,
        estado_surtido

    FROM vista_surtido_mrp_acumulado

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
        numero_material;
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
                        reader.GetString(
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

                    cantidadRequeridaAcumulada =
                        reader.GetDecimal(
                            "cantidad_requerida_acumulada"
                        ),

                    cantidadSurtidaAcumulada =
                        reader.GetDecimal(
                            "cantidad_surtida_acumulada"
                        ),

                    cantidadPendienteAcumulada =
                        reader.GetDecimal(
                            "cantidad_pendiente_acumulada"
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

                    cantidadSurtibleAcumulada =
                        reader.GetDecimal(
                            "cantidad_surtible_acumulada"
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

        if (
            string.IsNullOrWhiteSpace(
                proyectoNormalizado
            ) ||
            string.IsNullOrWhiteSpace(
                familiaNormalizada
            )
        )
        {
            return Results.BadRequest(
                new
                {
                    mensaje =
                        "Selecciona proyecto y familia."
                }
            );
        }

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

            AND UPPER(
                TRIM(mrp.proyecto)
            ) = UPPER(
                @proyecto
            )

            AND UPPER(
                TRIM(mrp.familia)
            ) = UPPER(
                @familia
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

}
