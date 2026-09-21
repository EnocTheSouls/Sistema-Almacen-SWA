namespace SistemaAlmacen.Api.Data;

// Registra el control general de cada archivo BOM importado.
public sealed class ImportacionBomRepository
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public ImportacionBomRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Registra el inicio de la importación.
    public async Task<long> CrearAsync(
        string nombreArchivo,
        int idUsuario)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            INSERT INTO importaciones_bom (
                nombre_archivo,
                id_usuario,
                total_filas,
                filas_correctas,
                filas_advertencia,
                filas_con_error,
                estado,
                mensaje
            )
            VALUES (
                @nombreArchivo,
                @idUsuario,
                0,
                0,
                0,
                0,
                'Procesando',
                NULL
            );
            """;

        command.Parameters.AddWithValue(
            "@nombreArchivo",
            nombreArchivo.Trim()
        );

        command.Parameters.AddWithValue(
            "@idUsuario",
            idUsuario
        );

        await command.ExecuteNonQueryAsync();

        return command.LastInsertedId;
    }

    // Guarda el resultado final de la importación.
    public async Task ActualizarResultadoAsync(
        long idImportacion,
        int totalFilas,
        int filasCorrectas,
        int filasAdvertencia,
        int filasConError,
        string estado,
        string? mensaje)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE importaciones_bom
            SET
                total_filas = @totalFilas,
                filas_correctas = @filasCorrectas,
                filas_advertencia = @filasAdvertencia,
                filas_con_error = @filasConError,
                estado = @estado,
                mensaje = @mensaje
            WHERE id_importacion = @idImportacion;
            """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        command.Parameters.AddWithValue(
            "@totalFilas",
            totalFilas
        );

        command.Parameters.AddWithValue(
            "@filasCorrectas",
            filasCorrectas
        );

        command.Parameters.AddWithValue(
            "@filasAdvertencia",
            filasAdvertencia
        );

        command.Parameters.AddWithValue(
            "@filasConError",
            filasConError
        );

        command.Parameters.AddWithValue(
            "@estado",
            estado.Trim()
        );

        command.Parameters.AddWithValue(
            "@mensaje",
            string.IsNullOrWhiteSpace(mensaje)
                ? DBNull.Value
                : mensaje.Trim()
        );

        await command.ExecuteNonQueryAsync();
    }

    // Marca una importación como fallida.
    public async Task MarcarErrorAsync(
        long idImportacion,
        string mensaje)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE importaciones_bom
            SET
                estado = 'Error',
                mensaje = @mensaje
            WHERE id_importacion = @idImportacion;
            """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        command.Parameters.AddWithValue(
            "@mensaje",
            mensaje.Trim()
        );

        await command.ExecuteNonQueryAsync();
    }

    // Guarda un error o advertencia de una fila del BOM.
    public async Task GuardarDetalleAsync(
        long idImportacion,
        int numeroFila,
        string tipo,
        string? productNumber,
        string? materialNumber,
        string mensaje)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO importacion_bom_detalle (
            id_importacion,
            numero_fila,
            tipo,
            product_number,
            material_number,
            mensaje
        )
        VALUES (
            @idImportacion,
            @numeroFila,
            @tipo,
            @productNumber,
            @materialNumber,
            @mensaje
        );
        """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        command.Parameters.AddWithValue(
            "@numeroFila",
            numeroFila
        );

        command.Parameters.AddWithValue(
            "@tipo",
            tipo.Trim()
        );

        command.Parameters.AddWithValue(
            "@productNumber",
            string.IsNullOrWhiteSpace(
                productNumber
            )
                ? DBNull.Value
                : productNumber.Trim()
        );

        command.Parameters.AddWithValue(
            "@materialNumber",
            string.IsNullOrWhiteSpace(
                materialNumber
            )
                ? DBNull.Value
                : materialNumber.Trim()
        );

        command.Parameters.AddWithValue(
            "@mensaje",
            mensaje.Trim()
        );

        await command.ExecuteNonQueryAsync();
    }

    // Guarda todos los errores y advertencias
    // generados durante una importación.
    public async Task GuardarDetallesAsync(
        long idImportacion,
        IEnumerable<Models.ErrorImportacionBom> errores,
        IEnumerable<Models.AdvertenciaImportacionBom>
            advertencias)
    {
        foreach (var error in errores)
        {
            await GuardarDetalleAsync(
                idImportacion,
                error.NumeroFila,
                "Error",
                null,
                null,
                error.Mensaje
            );
        }

        foreach (var advertencia in advertencias)
        {
            await GuardarDetalleAsync(
                idImportacion,
                advertencia.NumeroFila,
                "Advertencia",
                null,
                null,
                advertencia.Mensaje
            );
        }
    }

    // Obtiene el historial general de importaciones.
    public async Task<List<object>>
        ObtenerHistorialAsync()
    {
        var historial =
            new List<object>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            id_importacion,
            nombre_archivo,
            fecha_importacion,
            id_usuario,
            total_filas,
            filas_correctas,
            filas_advertencia,
            filas_con_error,
            estado,
            mensaje
        FROM importaciones_bom
        ORDER BY id_importacion DESC;
        """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            historial.Add(new
            {
                idImportacion =
                    reader.GetInt64(
                        "id_importacion"
                    ),

                nombreArchivo =
                    reader.GetString(
                        "nombre_archivo"
                    ),

                fechaImportacion =
                    reader.GetDateTime(
                        "fecha_importacion"
                    ),

                idUsuario =
                    reader.GetInt32(
                        "id_usuario"
                    ),

                totalFilas =
                    reader.GetInt32(
                        "total_filas"
                    ),

                filasCorrectas =
                    reader.GetInt32(
                        "filas_correctas"
                    ),

                filasAdvertencia =
                    reader.GetInt32(
                        "filas_advertencia"
                    ),

                filasConError =
                    reader.GetInt32(
                        "filas_con_error"
                    ),

                estado =
                    reader.GetString(
                        "estado"
                    ),

                mensaje =
                    reader.IsDBNull(
                        reader.GetOrdinal(
                            "mensaje"
                        )
                    )
                        ? null
                        : reader.GetString(
                            "mensaje"
                        )
            });
        }

        return historial;
    }

    // Obtiene los errores y advertencias
    // de una importación específica.
    public async Task<List<object>>
        ObtenerDetalleAsync(
            long idImportacion)
    {
        var detalles =
            new List<object>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            id_detalle,
            id_importacion,
            numero_fila,
            tipo,
            product_number,
            material_number,
            mensaje,
            fecha_registro
        FROM importacion_bom_detalle
        WHERE id_importacion = @idImportacion
        ORDER BY
            numero_fila,
            id_detalle;
        """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            detalles.Add(new
            {
                idDetalle =
                    reader.GetInt64(
                        "id_detalle"
                    ),

                idImportacion =
                    reader.GetInt64(
                        "id_importacion"
                    ),

                numeroFila =
                    reader.GetInt32(
                        "numero_fila"
                    ),

                tipo =
                    reader.GetString(
                        "tipo"
                    ),

                productNumber =
                    reader.IsDBNull(
                        reader.GetOrdinal(
                            "product_number"
                        )
                    )
                        ? null
                        : reader.GetString(
                            "product_number"
                        ),

                materialNumber =
                    reader.IsDBNull(
                        reader.GetOrdinal(
                            "material_number"
                        )
                    )
                        ? null
                        : reader.GetString(
                            "material_number"
                        ),

                mensaje =
                    reader.GetString(
                        "mensaje"
                    ),

                fechaRegistro =
                    reader.GetDateTime(
                        "fecha_registro"
                    )
            });
        }

        return detalles;
    }


}