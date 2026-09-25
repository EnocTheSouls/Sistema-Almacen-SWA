namespace SistemaAlmacen.Api.Data;

using SistemaAlmacen.Api.Models;
// Guarda el encabezado y los materiales de cada BOM.
public sealed class BomRepository
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public BomRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Obtiene un BOM existente o crea uno nuevo.
    public async Task<int> ObtenerOCrearAsync(
        long idImportacion,
        int idArnes,
        string version,
        string archivoOrigen,
        int idUsuario)
    {
        var versionLimpia =
            version
                .Trim()
                .ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var buscarCommand =
            connection.CreateCommand();

        buscarCommand.CommandText = """
            SELECT id_bom
            FROM bom
            WHERE id_arnes = @idArnes
              AND UPPER(version) = @version
            LIMIT 1;
            """;

        buscarCommand.Parameters.AddWithValue(
            "@idArnes",
            idArnes
        );

        buscarCommand.Parameters.AddWithValue(
            "@version",
            versionLimpia
        );

        var idExistente =
            await buscarCommand
                .ExecuteScalarAsync();

        if (
            idExistente is not null &&
            idExistente is not DBNull
        )
        {
            return Convert.ToInt32(
                idExistente
            );
        }

        await using var crearCommand =
            connection.CreateCommand();

        crearCommand.CommandText = """
            INSERT INTO bom (
                id_importacion,
                id_arnes,
                version,
                fecha_inicio,
                fecha_final,
                archivo_origen,
                usuario_importacion,
                vigente
            )
            VALUES (
                @idImportacion,
                @idArnes,
                @version,
                CURRENT_DATE,
                NULL,
                @archivoOrigen,
                @idUsuario,
                TRUE
            );
            """;

        crearCommand.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        crearCommand.Parameters.AddWithValue(
            "@idArnes",
            idArnes
        );

        crearCommand.Parameters.AddWithValue(
            "@version",
            versionLimpia
        );

        crearCommand.Parameters.AddWithValue(
            "@archivoOrigen",
            archivoOrigen.Trim()
        );

        crearCommand.Parameters.AddWithValue(
            "@idUsuario",
            idUsuario
        );

        await crearCommand
            .ExecuteNonQueryAsync();

        return Convert.ToInt32(
            crearCommand.LastInsertedId
        );
    }

    // Crea o actualiza una fila del detalle del BOM.
    public async Task GuardarDetalleAsync(
        int idBom,
        int idMaterial,
        int numeroFila,
        decimal cantidadRequerida,
        string? estacion,
        decimal? stdPack)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            INSERT INTO bom_detalle (
                id_bom,
                id_material,
                numero_fila,
                cantidad_requerida,
                localizacion_bom,
                std_pack_bom,
                tiene_advertencia,
                detalle_advertencia
            )
            VALUES (
                @idBom,
                @idMaterial,
                @numeroFila,
                @cantidadRequerida,
                @estacion,
                @stdPack,
                FALSE,
                NULL
            )
            ON DUPLICATE KEY UPDATE
                id_material =
                    VALUES(id_material),

                cantidad_requerida =
                    VALUES(cantidad_requerida),

                localizacion_bom =
                    COALESCE(
                    
                VALUES(localizacion_bom),
                    localizacion_bom),
                    
                std_pack_bom =
                    COALESCE(
                        VALUES(std_pack_bom),
                        std_pack_bom
                    ),   


                tiene_advertencia =
                    VALUES(tiene_advertencia),

                detalle_advertencia =
                    VALUES(detalle_advertencia);
            """;

        command.Parameters.AddWithValue(
            "@idBom",
            idBom
        );

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        command.Parameters.AddWithValue(
            "@numeroFila",
            numeroFila
        );

        command.Parameters.AddWithValue(
            "@cantidadRequerida",
            cantidadRequerida
        );

        command.Parameters.AddWithValue(
            "@estacion",
            string.IsNullOrWhiteSpace(
                estacion
            )
                ? DBNull.Value
                : estacion
                    .Trim()
                    .ToUpperInvariant()
        );

        command.Parameters.AddWithValue(
            "@stdPack",
            stdPack.HasValue
                ? stdPack.Value
                : DBNull.Value
        );

        await command.ExecuteNonQueryAsync();


    }

    // Localiza el detalle BOM por arnés y material.
    public async Task<long?>
        ObtenerIdDetalleAsync(
            int idArnes,
            int idMaterial)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                bd.id_detalle
            FROM bom_detalle AS bd
            INNER JOIN bom AS b
                ON b.id_bom = bd.id_bom
            WHERE b.id_arnes = @idArnes
              AND bd.id_material = @idMaterial
            ORDER BY
                b.fecha_importacion DESC,
                bd.id_detalle DESC
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@idArnes",
            idArnes
        );

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        var resultado =
            await command
                .ExecuteScalarAsync();

        if (
            resultado is null ||
            resultado is DBNull
        )
        {
            return null;
        }

        return Convert.ToInt64(
            resultado
        );
    }

    // Asigna la estación oficial al detalle BOM.
    public async Task<bool>
        AsignarEstacionAsync(
            long idDetalle,
            int idEstacion,
            string nombreEstacion,
            decimal? stdPack)
    {
        var nombreLimpio =
            nombreEstacion
                .Trim()
                .ToUpperInvariant();

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE bom_detalle
            SET
                id_estacion =
                    @idEstacion,

                localizacion_bom =
                    @nombreEstacion,

                std_pack_bom =
                    COALESCE(
                        @stdPack,
                        std_pack_bom
                    )
            WHERE id_detalle =
                  @idDetalle;
            """;

        command.Parameters.AddWithValue(
            "@idDetalle",
            idDetalle
        );

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        command.Parameters.AddWithValue(
            "@nombreEstacion",
            nombreLimpio
        );

        command.Parameters.AddWithValue(
            "@stdPack",
            stdPack.HasValue
                ? stdPack.Value
                : DBNull.Value
        );

        var filasAfectadas =
            await command
                .ExecuteNonQueryAsync();

        return filasAfectadas > 0;
    }

    // Cuenta los materiales asignados a una estación.
    public async Task<int>
        ContarMaterialesPorEstacionAsync(
            int idEstacion)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                COUNT(DISTINCT id_material)
            FROM bom_detalle
            WHERE id_estacion = @idEstacion;
            """;

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        var resultado =
            await command
                .ExecuteScalarAsync();

        if (
            resultado is null ||
            resultado is DBNull
        )
        {
            return 0;
        }

        return Convert.ToInt32(
            resultado
        );
    }
    // Obtiene la relación completa de materiales
    // para exportar etiquetas por proyecto y familia.
    public async Task<
        List<MaterialBarcodeRelationRow>>
        ObtenerRelacionesCodigosBarrasAsync()
    {
        var relaciones =
            new List<
                MaterialBarcodeRelationRow
            >();

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT DISTINCT
                bd.id_detalle AS id_bom_detalle,

                p.id_proyecto,

                UPPER(
                    TRIM(p.nombre)
                ) AS proyecto,

                f.id_familia,

                UPPER(
                    TRIM(f.nombre)
                ) AS familia,

                a.id_arnes,

                UPPER(
                    TRIM(a.numero_parte_arnes)
                ) AS numero_arnes,

                UPPER(
                    TRIM(a.nivel_diseno)
                ) AS diseno_arnes,

                bd.id_estacion,

                UPPER(
                    TRIM(
                        COALESCE(
                            e.nombre,
                            bd.localizacion_bom,
                            ''
                        )
                    )
                ) AS estacion,

                m.id_material,
            UPPER(
                TRIM(
                    m.numero_parte_material
                )
            ) AS numero_material,

            TRIM(
                m.descripcion
            ) AS descripcion,

            UPPER(
                TRIM(
                    m.generic_code
                )
            ) AS generic_code,

            m.unidad_medida,
            m.tipo_empaque,

            COALESCE(
                bd.std_pack_bom,
                m.std_pack
            ) AS std_pack,

            UPPER(
                TRIM(
                    COALESCE(
                        m.codigo_barras,
                        m.numero_parte_material
                    )
                )
            ) AS codigo_barras

        FROM bom_detalle AS bd

        INNER JOIN bom AS b
            ON b.id_bom =
               bd.id_bom

        INNER JOIN arneses AS a
            ON a.id_arnes =
               b.id_arnes

        INNER JOIN familias AS f
            ON f.id_familia =
               a.id_familia

        INNER JOIN proyectos AS p
            ON p.id_proyecto =
               f.id_proyecto

        INNER JOIN materiales AS m
            ON m.id_material =
               bd.id_material

        LEFT JOIN estaciones AS e
            ON e.id_estacion =
               bd.id_estacion

        WHERE b.vigente = TRUE
          AND a.activo = TRUE
          AND f.activo = TRUE
          AND p.activo = TRUE
          AND m.activo = TRUE
        ORDER BY
            proyecto,
            familia,
            numero_arnes,
            diseno_arnes,
            estacion,
            numero_material;
        """;

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            relaciones.Add(
                new MaterialBarcodeRelationRow
                {
                    IdBomDetalle =
                        reader.GetInt64(
                            "id_bom_detalle"
                        ),

                    IdProyecto =
                        reader.GetInt32(
                            "id_proyecto"
                        ),

                    Proyecto =
                        reader.GetString(
                            "proyecto"
                        ),
                    IdFamilia =
                        reader.GetInt32(
                            "id_familia"
                         ),

                    Familia =
                        reader.GetString(
                            "familia"
                        ),
                    IdArnes =
                        reader.GetInt32(
                            "id_arnes"
                        ),

                    NumeroArnes =
                        reader.GetString(
                            "numero_arnes"
                        ),

                    DisenoArnes =
                        reader.GetString(
                            "diseno_arnes"
                        ),

                    IdEstacion =
                        reader.IsDBNull(
                        reader.GetOrdinal(
                            "id_estacion"
                        )
                    )
                         ? null
                        : reader.GetInt32(
                            "id_estacion"
                            ),

                    Estacion =
                        reader.GetString(
                            "estacion"
                        ),

                    IdMaterial =
                        reader.GetInt32(
                            "id_material"
                        ),

                    NumeroParteMaterial =
                        reader.GetString(
                            "numero_material"
                        ),

                    Descripcion =
                        reader.GetString(
                            "descripcion"
                        ),

                    GenericCode =
                        reader.GetString(
                            "generic_code"
                        ),

                    UnidadMedida =
                        reader.IsDBNull(
                            reader.GetOrdinal(
                                "unidad_medida"
                            )
                        )
                            ? null
                            : reader.GetString(
                                "unidad_medida"
                            ),

                    TipoEmpaque =
                        reader.IsDBNull(
                            reader.GetOrdinal(
                                "tipo_empaque"
                            )
                        )
                            ? null
                            : reader.GetString(
                                "tipo_empaque"
                            ),

                    StdPack =
                        reader.IsDBNull(
                            reader.GetOrdinal(
                                "std_pack"
                            )
                        )
                            ? null
                            : reader.GetDecimal(
                                "std_pack"
                            ),

                    CodigoBarras =
                        reader.GetString(
                            "codigo_barras"
                        )
                }
            );
        }

        return relaciones;
    }



}

