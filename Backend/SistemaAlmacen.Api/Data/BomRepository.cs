namespace SistemaAlmacen.Api.Data;

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
                    VALUES(localizacion_bom),

                std_pack_bom =
                    VALUES(std_pack_bom),

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
}