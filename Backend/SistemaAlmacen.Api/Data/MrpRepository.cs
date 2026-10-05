using MySqlConnector;
using SistemaAlmacen.Api.Dtos.Mrp;
using SistemaAlmacen.Api.Models.Mrp;

namespace SistemaAlmacen.Api.Data;

// Administra las importaciones semanales MRP
// y la consulta del plan de surtido.
public sealed class MrpRepository
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public MrpRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Guarda una importación semanal completa.
    // Si ocurre un error, revierte toda la operación.
    public async Task<long> ImportarSemanaAsync(
        string nombreArchivo,
        DateTime fechaInicio,
        DateTime fechaFin,
        int idUsuario,
        IReadOnlyCollection<
            RequerimientoMrpImportacion
        > requerimientos,
        int registrosRechazados)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            // Las importaciones anteriores que se cruzan
            // con el nuevo periodo dejan de estar vigentes.
            await DesactivarPeriodoAnteriorAsync(
                connection,
                transaction,
                fechaInicio,
                fechaFin
            );

            var idImportacion =
                await CrearImportacionAsync(
                    connection,
                    transaction,
                    nombreArchivo,
                    fechaInicio,
                    fechaFin,
                    idUsuario,
                    requerimientos.Count +
                    registrosRechazados
                );
            await InsertarRequerimientosAsync(
                connection,
                transaction,
                idImportacion,
                requerimientos
            );

            await CompletarImportacionAsync(
                connection,
                transaction,
                idImportacion,
                requerimientos.Count,
                registrosRechazados
            );

            await transaction.CommitAsync();
            

            return idImportacion;
        }
        catch
        {
            await transaction.RollbackAsync();

            throw;
        }
    }

    // Desactiva importaciones vigentes que coincidan
    // total o parcialmente con el nuevo periodo.
    private static async Task
        DesactivarPeriodoAnteriorAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            DateTime fechaInicio,
            DateTime fechaFin)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;

        command.CommandText = """
            UPDATE importaciones_mrp
            SET vigente = FALSE
            WHERE vigente = TRUE
              AND fecha_inicio <= @fechaFin
              AND fecha_fin >= @fechaInicio;
            """;

        command.Parameters.AddWithValue(
            "@fechaInicio",
            fechaInicio.Date
        );

        command.Parameters.AddWithValue(
            "@fechaFin",
            fechaFin.Date
        );

        await command.ExecuteNonQueryAsync();
    }   // Registra el encabezado de la importación.
    private static async Task<long>
        CrearImportacionAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            string nombreArchivo,
            DateTime fechaInicio,
            DateTime fechaFin,
            int idUsuario,
            int totalRegistros)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;

        command.CommandText = """
        INSERT INTO importaciones_mrp (
            nombre_archivo,
            fecha_inicio,
            fecha_fin,
            total_registros,
            registros_importados,
            registros_rechazados,
            estado,
            vigente,
            id_usuario
        )
        VALUES (
            @nombreArchivo,
            @fechaInicio,
            @fechaFin,
            @totalRegistros,
            0,
            0,
            'PROCESANDO',
            TRUE,
            @idUsuario
        );
        """;

        command.Parameters.AddWithValue(
            "@nombreArchivo",
            nombreArchivo.Trim()
        );

        command.Parameters.AddWithValue(
            "@fechaInicio",
            fechaInicio.Date
        );

        command.Parameters.AddWithValue(
            "@fechaFin",
            fechaFin.Date
        );

        command.Parameters.AddWithValue(
            "@totalRegistros",
            totalRegistros
        );

        command.Parameters.AddWithValue(
            "@idUsuario",
            idUsuario
        );

        await command.ExecuteNonQueryAsync();

        return command.LastInsertedId;
    }
    // Inserta los renglones reutilizando el mismo
    // comando para mejorar el rendimiento.

    // Inserta los requerimientos de la importación.
    private static async Task
        InsertarRequerimientosAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            long idImportacion,
            IReadOnlyCollection<
                RequerimientoMrpImportacion
            > requerimientos)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;    
        command.CommandTimeout =
            300;

        command.CommandText = """
        INSERT INTO requerimientos_mrp (
            id_importacion,
            numero_requisicion,
            numero_material,
            id_material,
            nombre_material,
            tipo_material,
            familia,
            id_familia,
            proyecto,
            id_proyecto,
            fecha_eta,
            cantidad_requerida,
            pack_size,
            bolsas_necesarias,
            tipo_coincidencia,
            requiere_revision
        )
        VALUES (
            @idImportacion,
            @numeroRequisicion,
            @numeroMaterial,
            @idMaterial,
            @nombreMaterial,
            @tipoMaterial,
            @familia,
            @idFamilia,
            @proyecto,
            @idProyecto,
            @fechaEta,
            @cantidadRequerida,
            @packSize,
            @bolsasNecesarias,
            @tipoCoincidencia,
            @requiereRevision
        );
        """;

        command.Parameters.Add(
            "@idImportacion",
            MySqlDbType.Int64
        );

        command.Parameters.Add(
            "@numeroRequisicion",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@numeroMaterial",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@idMaterial",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@nombreMaterial",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@tipoMaterial",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@familia",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@idFamilia",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@proyecto",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@idProyecto",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@fechaEta",
            MySqlDbType.Date
        );

        command.Parameters.Add(
            "@cantidadRequerida",
            MySqlDbType.Decimal
        );

        command.Parameters.Add(
            "@packSize",
            MySqlDbType.Decimal
        );

        command.Parameters.Add(
            "@bolsasNecesarias",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@tipoCoincidencia",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@requiereRevision",
            MySqlDbType.Bool
        );

        foreach (
            var requerimiento
            in requerimientos
        )
        {
            command.Parameters[
                "@idImportacion"
            ].Value = idImportacion;

            command.Parameters[
                "@numeroRequisicion"
            ].Value =
                ValorODbNull(
                    requerimiento.NumeroRequisicion
                );

            command.Parameters[
                "@numeroMaterial"
            ].Value =
                requerimiento
                    .NumeroMaterial
                    .Trim();

            command.Parameters[
                "@idMaterial"
            ].Value =
                requerimiento.IdMaterial.HasValue
                    ? requerimiento.IdMaterial.Value
                    : DBNull.Value;

            command.Parameters[
                "@nombreMaterial"
            ].Value =
                ValorODbNull(
                    requerimiento.NombreMaterial
                );

            command.Parameters[
                "@tipoMaterial"
            ].Value =
                ValorODbNull(
                    requerimiento.TipoMaterial
                );

            command.Parameters[
                "@familia"
            ].Value =
                ValorODbNull(
                    requerimiento.Familia
                );

            command.Parameters[
                "@idFamilia"
            ].Value =
                requerimiento.IdFamilia.HasValue
                    ? requerimiento.IdFamilia.Value
                    : DBNull.Value;

            command.Parameters[
                "@proyecto"
            ].Value =
                ValorODbNull(
                    requerimiento.Proyecto
                );

            command.Parameters[
                "@idProyecto"
            ].Value =
                requerimiento.IdProyecto.HasValue
                    ? requerimiento.IdProyecto.Value
                    : DBNull.Value;

            command.Parameters[
                "@fechaEta"
            ].Value =
                requerimiento.FechaEta.Date;

            command.Parameters[
                "@cantidadRequerida"
            ].Value =
                requerimiento.CantidadRequerida;

            command.Parameters[
                "@packSize"
            ].Value =
                requerimiento.PackSize;

            command.Parameters[
                "@bolsasNecesarias"
            ].Value =
                requerimiento.BolsasNecesarias;

            command.Parameters[
                "@tipoCoincidencia"
            ].Value =
                string.IsNullOrWhiteSpace(
                    requerimiento.TipoCoincidencia
                )
                    ? "SIN_COINCIDENCIA"
                    : requerimiento
                        .TipoCoincidencia
                        .Trim();

            command.Parameters[
                "@requiereRevision"
            ].Value =
                requerimiento.RequiereRevision;

            await command.ExecuteNonQueryAsync();
        }
    }
    // Relaciona automáticamente los renglones
    // recién importados con los catálogos.
    private static async Task
        RelacionarImportacionAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            long idImportacion)
    {
        // 1. Relaciona Material Number con
        // el catálogo y obtiene C/P/S/W.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN materiales AS m
            ON UPPER(TRIM(
                m.numero_parte_material
            )) =
               UPPER(TRIM(
                r.numero_material
            ))

        SET
            r.id_material =
                m.id_material,

            r.tipo_material =
                CASE
                    WHEN UPPER(
                        TRIM(m.generic_code)
                    ) IN (
                        'C',
                        'P',
                        'S',
                        'W'
                    )
                    THEN UPPER(
                        TRIM(m.generic_code)
                    )
                    ELSE NULL
                END,

            r.nombre_material =
                COALESCE(
                    NULLIF(
                        TRIM(m.descripcion),
                        ''
                    ),
                    r.nombre_material
                )

        WHERE r.id_importacion =
              @idImportacion
          AND m.activo = TRUE;
        """
        );

        // 2. Si Product No. / Family es
        // un número de arnés, obtiene su familia.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN arneses AS a
            ON REGEXP_REPLACE(
                UPPER(TRIM(r.familia)),
                '[^A-Z0-9]',
                ''
            ) =
               REGEXP_REPLACE(
                UPPER(
                    TRIM(
                        a.numero_parte_arnes
                    )
                ),
                '[^A-Z0-9]',
                ''
            )

        INNER JOIN familias AS f
            ON f.id_familia =
               a.id_familia

        SET
            r.id_familia =
                f.id_familia,

            r.id_proyecto =
                f.id_proyecto,

            r.tipo_coincidencia =
                'ARNES_A_FAMILIA'

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_familia IS NULL
          AND a.activo = TRUE
          AND f.activo = TRUE;
        """
        );

        // 3. Relaciona el valor original
        // con una familia de nombre exacto.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN familias AS f
            ON REGEXP_REPLACE(
                UPPER(TRIM(r.familia)),
                '[^A-Z0-9]',
                ''
            ) =
               REGEXP_REPLACE(
                UPPER(TRIM(f.nombre)),
                '[^A-Z0-9]',
                ''
            )

        SET
            r.id_familia =
                f.id_familia,

            r.id_proyecto =
                f.id_proyecto,

            r.tipo_coincidencia =
                'FAMILIA_DIRECTA'

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_familia IS NULL
          AND f.activo = TRUE;
        """
        );

        // 4. Relaciona nombres abreviados
        // solo cuando existe una opción única.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN (
            SELECT
                r2.id_requerimiento,

                MIN(f.id_familia)
                    AS id_familia

            FROM requerimientos_mrp AS r2

            INNER JOIN familias AS f
                ON REGEXP_REPLACE(
                    UPPER(TRIM(f.nombre)),
                    '[^A-Z0-9]',
                    ''
                ) LIKE CONCAT(
                    REGEXP_REPLACE(
                        UPPER(
                            TRIM(r2.familia)
                        ),
                        '[^A-Z0-9]',
                        ''
                    ),
                    '%'
                )

            WHERE r2.id_importacion =
                  @idImportacion
              AND r2.id_familia IS NULL
              AND r2.familia IS NOT NULL
              AND TRIM(r2.familia) <> ''
              AND f.activo = TRUE

            GROUP BY
                r2.id_requerimiento

            HAVING COUNT(
                DISTINCT f.id_familia
            ) = 1
        ) AS coincidencia
            ON coincidencia.id_requerimiento =
               r.id_requerimiento

        INNER JOIN familias AS f
            ON f.id_familia =
               coincidencia.id_familia

        SET
            r.id_familia =
                f.id_familia,

            r.id_proyecto =
                f.id_proyecto,

            r.tipo_coincidencia =
                'FAMILIA_ABREVIADA'

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_familia IS NULL;
        """
        );

        // 5. Si el material pertenece a una sola
        // familia según BOM, asigna esa familia.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN (
            SELECT
                bd.id_material,

                MIN(a.id_familia)
                    AS id_familia

            FROM bom_detalle AS bd

            INNER JOIN bom AS b
                ON b.id_bom =
                   bd.id_bom
               AND b.vigente = TRUE

            INNER JOIN arneses AS a
                ON a.id_arnes =
                   b.id_arnes
               AND a.activo = TRUE

            GROUP BY
                bd.id_material

            HAVING COUNT(
                DISTINCT a.id_familia
            ) = 1
        ) AS relacion_bom
            ON relacion_bom.id_material =
               r.id_material

        INNER JOIN familias AS f
            ON f.id_familia =
               relacion_bom.id_familia
           AND f.activo = TRUE

        SET
            r.id_familia =
                f.id_familia,

            r.id_proyecto =
                f.id_proyecto,

            r.tipo_coincidencia =
                'MATERIAL_BOM'

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_familia IS NULL
          AND r.id_material IS NOT NULL;
        """
        );

        // 6. Para materiales compartidos, intenta
        // elegir una familia usando el texto Excel,
        // pero solo si queda una opción única.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN (
            SELECT
                candidatos.id_requerimiento,

                MIN(candidatos.id_familia)
                    AS id_familia

            FROM (
                SELECT DISTINCT
                    r2.id_requerimiento,
                    f.id_familia

                FROM requerimientos_mrp AS r2

                INNER JOIN bom_detalle AS bd
                    ON bd.id_material =
                       r2.id_material

                INNER JOIN bom AS b
                    ON b.id_bom =
                       bd.id_bom
                   AND b.vigente = TRUE

                INNER JOIN arneses AS a
                    ON a.id_arnes =
                       b.id_arnes
                   AND a.activo = TRUE

                INNER JOIN familias AS f
                    ON f.id_familia =
                       a.id_familia
                   AND f.activo = TRUE

                WHERE r2.id_importacion =
                      @idImportacion
                  AND r2.id_familia IS NULL
                  AND r2.familia IS NOT NULL

                  AND REGEXP_REPLACE(
                        UPPER(TRIM(f.nombre)),
                        '[^A-Z0-9]',
                        ''
                      ) LIKE CONCAT(
                        REGEXP_REPLACE(
                            UPPER(
                                TRIM(r2.familia)
                            ),
                            '[^A-Z0-9]',
                            ''
                        ),
                        '%'
                      )
            ) AS candidatos

            GROUP BY
                candidatos.id_requerimiento

            HAVING COUNT(
                DISTINCT candidatos.id_familia
            ) = 1
        ) AS coincidencia
            ON coincidencia.id_requerimiento =
               r.id_requerimiento

        INNER JOIN familias AS f
            ON f.id_familia =
               coincidencia.id_familia

        SET
            r.id_familia =
                f.id_familia,

            r.id_proyecto =
                f.id_proyecto,

            r.tipo_coincidencia =
                'MATERIAL_FAMILIA'

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_familia IS NULL;
        """
        );

        // 7. Marca los materiales que aparecen
        // relacionados con varias familias.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN (
            SELECT
                bd.id_material

            FROM bom_detalle AS bd

            INNER JOIN bom AS b
                ON b.id_bom =
                   bd.id_bom
               AND b.vigente = TRUE

            INNER JOIN arneses AS a
                ON a.id_arnes =
                   b.id_arnes
               AND a.activo = TRUE

            GROUP BY
                bd.id_material

            HAVING COUNT(
                DISTINCT a.id_familia
            ) > 1
        ) AS relacion_multiple
            ON relacion_multiple.id_material =
               r.id_material

        SET
            r.tipo_coincidencia =
                'MULTIPLE_FAMILIA',

            r.requiere_revision =
                TRUE

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_familia IS NULL;
        """
        );

        // 8. Relaciona el proyecto original con
        // los proyectos oficiales registrados.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN proyectos AS p
            ON REGEXP_REPLACE(
                UPPER(TRIM(p.nombre)),
                '[^A-Z0-9]',
                ''
            ) =
               REGEXP_REPLACE(
                UPPER(TRIM(r.proyecto)),
                '[^A-Z0-9]',
                ''
            )

        SET
            r.id_proyecto =
                p.id_proyecto

        WHERE r.id_importacion =
              @idImportacion
          AND r.id_proyecto IS NULL
          AND p.activo = TRUE;
        """
        );

        // 9. Agrupa todas las variantes RIV
        // bajo el proyecto oficial RIVIAN.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp AS r

        INNER JOIN proyectos AS p
            ON REGEXP_REPLACE(
                UPPER(TRIM(p.nombre)),
                '[^A-Z0-9]',
                ''
            ) = 'RIVIAN'
           AND p.activo = TRUE

        SET
            r.id_proyecto =
                p.id_proyecto

        WHERE r.id_importacion =
              @idImportacion

          AND REGEXP_REPLACE(
                UPPER(TRIM(r.proyecto)),
                '[^A-Z0-9]',
                ''
              ) IN (
                'RIV',
                'RIV1',
                'RIV2',
                'RIVIAN'
              );
        """
        );

        // 10. Actualiza la marca final de revisión.
        await EjecutarRelacionAsync(
            connection,
            transaction,
            idImportacion,
            """
        UPDATE requerimientos_mrp

        SET requiere_revision =
            CASE
                WHEN id_material IS NULL
                  OR id_familia IS NULL
                  OR id_proyecto IS NULL
                THEN TRUE
                ELSE FALSE
            END

        WHERE id_importacion =
              @idImportacion;
        """
        );
    }
    // Ejecuta una regla de relación dentro
    // de la transacción de importación.
    private static async Task
        EjecutarRelacionAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            long idImportacion,
            string sql)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;

        // Algunas relaciones con BOM requieren
        // más de los 30 segundos predeterminados.
        command.CommandTimeout =
            300;

        command.CommandText =
            sql;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        await command.ExecuteNonQueryAsync();
    }








    // Marca la importación como completada.
    private static async Task
        CompletarImportacionAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            long idImportacion,
            int registrosImportados,
            int registrosRechazados)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;
        command.CommandTimeout =
            300;

        command.CommandText = """
            UPDATE importaciones_mrp
            SET
                registros_importados =
                    @registrosImportados,

                registros_rechazados =
                    @registrosRechazados,

                estado =
                    'COMPLETADA'

            WHERE id_importacion =
                @idImportacion;
            """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        command.Parameters.AddWithValue(
            "@registrosImportados",
            registrosImportados
        );

        command.Parameters.AddWithValue(
            "@registrosRechazados",
            registrosRechazados
        );

        await command.ExecuteNonQueryAsync();
    }

    // Consulta el plan MRP vigente aplicando filtros.
    public async Task<RequerimientosMrpPaginaDto>
        ObtenerRequerimientosAsync(
            string? busqueda,
            string? proyecto,
            string? familia,
            string? tipoMaterial,
            DateTime? fechaDesde,
            DateTime? fechaHasta,
            int pagina,
            int tamanoPagina)
    {
        pagina =
            Math.Max(
                pagina,
                1
            );

        tamanoPagina =
            Math.Clamp(
                tamanoPagina,
                10,
                200
            );

        var offset =
            (pagina - 1) *
            tamanoPagina;

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        var condiciones =
            new List<string>
            {
            "i.vigente = TRUE"
            };

        if (!string.IsNullOrWhiteSpace(
            busqueda))
        {
            condiciones.Add(
                """
            (
                r.numero_material LIKE
                    @busqueda
                OR
                r.nombre_material LIKE
                    @busqueda
            )
            """
            );
        }

        if (!string.IsNullOrWhiteSpace(
            proyecto))
        {
            condiciones.Add(
                """
            (
                p.nombre = @proyecto
                OR
                (
                    @proyecto = 'RIVIAN'
                    AND
                    REGEXP_REPLACE(
                        UPPER(
                            TRIM(r.proyecto)
                        ),
                        '[^A-Z0-9]',
                        ''
                    ) IN (
                        'RIV',
                        'RIV1',
                        'RIV2',
                        'RIVIAN'
                    )
                )
            )
            """
            );
        }

        if (!string.IsNullOrWhiteSpace(
            familia))
        {
            condiciones.Add(
                "f.nombre = @familia"
            );
        }

        if (!string.IsNullOrWhiteSpace(
            tipoMaterial))
        {
            condiciones.Add(
                "r.tipo_material = @tipoMaterial"
            );
        }

        if (fechaDesde.HasValue)
        {
            condiciones.Add(
                "r.fecha_eta >= @fechaDesde"
            );
        }

        if (fechaHasta.HasValue)
        {
            condiciones.Add(
                "r.fecha_eta <= @fechaHasta"
            );
        }

        var where =
            string.Join(
                " AND ",
                condiciones
            );

        var totalRegistros =
            await ObtenerTotalAsync(
                connection,
                where,
                busqueda,
                proyecto,
                familia,
                tipoMaterial,
                fechaDesde,
                fechaHasta
            );

        var registros =
            await ObtenerPaginaAsync(
                connection,
                where,
                busqueda,
                proyecto,
                familia,
                tipoMaterial,
                fechaDesde,
                fechaHasta,
                tamanoPagina,
                offset
            );

        return new RequerimientosMrpPaginaDto
        {
            Registros =
                registros,

            TotalRegistros =
                totalRegistros,

            Pagina =
                pagina,

            TamanoPagina =
                tamanoPagina,

            TotalPaginas =
                totalRegistros == 0
                    ? 0
                    : (int)Math.Ceiling(
                        totalRegistros /
                        (decimal)tamanoPagina
                    )
        };
    }

    // Obtiene el total de registros
    // que cumplen los filtros.
    private static async Task<int>
        ObtenerTotalAsync(
            MySqlConnection connection,
            string where,
            string? busqueda,
            string? proyecto,
            string? familia,
            string? tipoMaterial,
            DateTime? fechaDesde,
            DateTime? fechaHasta)
    {
        await using var command =
            connection.CreateCommand();

        command.CommandText =
            $"""
        SELECT
            COUNT(*)

        FROM requerimientos_mrp AS r

        INNER JOIN importaciones_mrp AS i
            ON i.id_importacion =
               r.id_importacion

        LEFT JOIN familias AS f
            ON f.id_familia =
               r.id_familia

        LEFT JOIN proyectos AS p
            ON p.id_proyecto =
               r.id_proyecto

        WHERE {where};
        """;

        AgregarParametrosFiltro(
            command,
            busqueda,
            proyecto,
            familia,
            tipoMaterial,
            fechaDesde,
            fechaHasta
        );

        var resultado =
            await command.ExecuteScalarAsync();

        return Convert.ToInt32(
            resultado
        );
    }

    // Obtiene una página de resultados.
    private static async Task<
        List<RequerimientoMrpDto>
    > ObtenerPaginaAsync(
        MySqlConnection connection,
        string where,
        string? busqueda,
        string? proyecto,
        string? familia,
        string? tipoMaterial,
        DateTime? fechaDesde,
        DateTime? fechaHasta,
        int tamanoPagina,
        int offset)
    {
        var registros =
            new List<
                RequerimientoMrpDto
            >();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            $"""
        SELECT
            r.id_requerimiento,
            r.id_importacion,
            r.numero_requisicion,
            r.numero_material,
            r.id_material,
            r.nombre_material,
            r.tipo_material,

            COALESCE(
                f.nombre,
                r.familia
            ) AS familia,

            COALESCE(
                p.nombre,
                CASE
                    WHEN REGEXP_REPLACE(
                        UPPER(
                            TRIM(r.proyecto)
                        ),
                        '[^A-Z0-9]',
                        ''
                    ) IN (
                        'RIV',
                        'RIV1',
                        'RIV2',
                        'RIVIAN'
                    )
                    THEN 'RIVIAN'
                    ELSE r.proyecto
                END
            ) AS proyecto,

            r.fecha_eta,
            r.cantidad_requerida,
            r.pack_size,
            r.bolsas_necesarias,
            r.tipo_coincidencia,
            r.requiere_revision

        FROM requerimientos_mrp AS r

        INNER JOIN importaciones_mrp AS i
            ON i.id_importacion =
               r.id_importacion

        LEFT JOIN familias AS f
            ON f.id_familia =
               r.id_familia

        LEFT JOIN proyectos AS p
            ON p.id_proyecto =
               r.id_proyecto

        WHERE {where}

        ORDER BY
            r.fecha_eta,
            proyecto,
            familia,
            r.numero_material

        LIMIT @tamanoPagina
        OFFSET @offset;
        """;

        AgregarParametrosFiltro(
            command,
            busqueda,
            proyecto,
            familia,
            tipoMaterial,
            fechaDesde,
            fechaHasta
        );

        command.Parameters.AddWithValue(
            "@tamanoPagina",
            tamanoPagina
        );

        command.Parameters.AddWithValue(
            "@offset",
            offset
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            registros.Add(
                new RequerimientoMrpDto
                {
                    IdRequerimiento =
                        reader.GetInt64(
                            "id_requerimiento"
                        ),

                    IdImportacion =
                        reader.GetInt64(
                            "id_importacion"
                        ),

                    NumeroRequisicion =
                        ObtenerStringOpcional(
                            reader,
                            "numero_requisicion"
                        ),

                    NumeroMaterial =
                        reader.GetString(
                            "numero_material"
                        ),

                    IdMaterial =
                        ObtenerIntOpcional(
                            reader,
                            "id_material"
                        ),

                    NombreMaterial =
                        ObtenerStringOpcional(
                            reader,
                            "nombre_material"
                        ),

                    TipoMaterial =
                        ObtenerStringOpcional(
                            reader,
                            "tipo_material"
                        ),

                    Familia =
                        ObtenerStringOpcional(
                            reader,
                            "familia"
                        ),

                    Proyecto =
                        ObtenerStringOpcional(
                            reader,
                            "proyecto"
                        ),

                    FechaEta =
                        reader.GetDateTime(
                            "fecha_eta"
                        ),

                    CantidadRequerida =
                        reader.GetDecimal(
                            "cantidad_requerida"
                        ),

                    PackSize =
                        reader.GetDecimal(
                            "pack_size"
                        ),

                    BolsasNecesarias =
                        reader.GetInt32(
                            "bolsas_necesarias"
                        ),

                    TipoCoincidencia =
                        reader.GetString(
                            "tipo_coincidencia"
                        ),

                    RequiereRevision =
                        reader.GetBoolean(
                            "requiere_revision"
                        )
                }
            );
        }

        return registros;
    }

    // Obtiene los valores oficiales disponibles
    // para los selectores de filtrado.
    public async Task<FiltrosMrpDto>
        ObtenerFiltrosAsync()
    {
        var resultado =
            new FiltrosMrpDto();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT DISTINCT
            p.nombre AS proyecto,
            f.nombre AS familia

        FROM requerimientos_mrp AS r

        INNER JOIN importaciones_mrp AS i
            ON i.id_importacion =
               r.id_importacion

        LEFT JOIN proyectos AS p
            ON p.id_proyecto =
               r.id_proyecto

        LEFT JOIN familias AS f
            ON f.id_familia =
               r.id_familia

        WHERE i.vigente = TRUE

        ORDER BY
            p.nombre,
            f.nombre;
        """;

        await using var reader =
            await command.ExecuteReaderAsync();

        var proyectos =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        var familias =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        while (await reader.ReadAsync())
        {
            var proyecto =
                ObtenerStringOpcional(
                    reader,
                    "proyecto"
                );

            var familia =
                ObtenerStringOpcional(
                    reader,
                    "familia"
                );

            if (!string.IsNullOrWhiteSpace(
                proyecto))
            {
                proyectos.Add(
                    proyecto
                );
            }

            if (!string.IsNullOrWhiteSpace(
                familia))
            {
                familias.Add(
                    familia
                );
            }
        }

        resultado.Proyectos =
            proyectos
                .OrderBy(
                    valor => valor
                )
                .ToList();

        resultado.Familias =
            familias
                .OrderBy(
                    valor => valor
                )
                .ToList();

        await reader.DisposeAsync();

        await using var fechaCommand =
            connection.CreateCommand();

        fechaCommand.CommandText = """
        SELECT
            MIN(r.fecha_eta) AS fecha_minima,
            MAX(r.fecha_eta) AS fecha_maxima

        FROM requerimientos_mrp AS r

        INNER JOIN importaciones_mrp AS i
            ON i.id_importacion =
               r.id_importacion

        WHERE i.vigente = TRUE;
        """;

        await using var fechaReader =
            await fechaCommand
                .ExecuteReaderAsync();

        if (await fechaReader.ReadAsync())
        {
            resultado.FechaMinima =
                ObtenerFechaOpcional(
                    fechaReader,
                    "fecha_minima"
                );

            resultado.FechaMaxima =
                ObtenerFechaOpcional(
                    fechaReader,
                    "fecha_maxima"
                );
        }

        return resultado;
    }

    // Agrega los parámetros utilizados
    // por las consultas de filtros.
    private static void
        AgregarParametrosFiltro(
            MySqlCommand command,
            string? busqueda,
            string? proyecto,
            string? familia,
            string? tipoMaterial,
            DateTime? fechaDesde,
            DateTime? fechaHasta)
    {
        if (!string.IsNullOrWhiteSpace(
            busqueda))
        {
            command.Parameters.AddWithValue(
                "@busqueda",
                $"%{busqueda.Trim()}%"
            );
        }

        if (!string.IsNullOrWhiteSpace(
            proyecto))
        {
            command.Parameters.AddWithValue(
                "@proyecto",
                proyecto.Trim()
            );
        }

        if (!string.IsNullOrWhiteSpace(
            familia))
        {
            command.Parameters.AddWithValue(
                "@familia",
                familia.Trim()
            );
        }

        if (!string.IsNullOrWhiteSpace(
            tipoMaterial))
        {
            command.Parameters.AddWithValue(
                "@tipoMaterial",
                tipoMaterial
                    .Trim()
                    .ToUpperInvariant()
            );
        }

        if (fechaDesde.HasValue)
        {
            command.Parameters.AddWithValue(
                "@fechaDesde",
                fechaDesde.Value.Date
            );
        }

        if (fechaHasta.HasValue)
        {
            command.Parameters.AddWithValue(
                "@fechaHasta",
                fechaHasta.Value.Date
            );
        }
    }





    private static object ValorODbNull(
        string? valor)
    {
        return string.IsNullOrWhiteSpace(
            valor)
            ? DBNull.Value
            : valor.Trim();
    }

    private static string?
        ObtenerStringOpcional(
            MySqlDataReader reader,
            string columna)
    {
        var posicion =
            reader.GetOrdinal(
                columna
            );

        return reader.IsDBNull(
            posicion)
            ? null
            : reader.GetString(
                posicion
            );
    }
    private static int?
    ObtenerIntOpcional(
        MySqlDataReader reader,
        string columna)
    {
        var posicion =
            reader.GetOrdinal(
                columna
            );

        return reader.IsDBNull(
            posicion)
            ? null
            : reader.GetInt32(
                posicion
            );
    }

    private static DateTime?
        ObtenerFechaOpcional(
            MySqlDataReader reader,
            string columna)
    {
        var posicion =
            reader.GetOrdinal(
                columna
            );

        return reader.IsDBNull(
            posicion)
            ? null
            : reader.GetDateTime(
                posicion
            );
    }

}
