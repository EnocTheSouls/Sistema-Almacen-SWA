namespace SistemaAlmacen.Api.Data;

// Controla el historial de archivos 5MF importados.
public sealed class ImportacionFiveMfRepository
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public ImportacionFiveMfRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Registra el inicio de una importación 5MF.
    public async Task<long> CrearAsync(
        string nombreArchivo,
        int idUsuario)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            INSERT INTO importaciones_5mf (
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

    // Actualiza los contadores y el estado final.
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
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE importaciones_5mf
            SET
                total_filas =
                    @totalFilas,
                filas_correctas =
                    @filasCorrectas,
                filas_advertencia =
                    @filasAdvertencia,
                filas_con_error =
                    @filasConError,
                estado =
                    @estado,
                mensaje =
                    @mensaje
            WHERE id_importacion_5mf =
                  @idImportacion;
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

    // Marca una importación 5MF como fallida.
    public async Task MarcarErrorAsync(
        long idImportacion,
        string mensaje)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE importaciones_5mf
            SET
                estado = 'Error',
                mensaje = @mensaje
            WHERE id_importacion_5mf =
                  @idImportacion;
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

    // Obtiene el historial de importaciones 5MF.
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
                i.id_importacion_5mf,
                i.nombre_archivo,
                i.fecha_importacion,
                i.id_usuario,
                u.nombre AS nombre_usuario,
                i.total_filas,
                i.filas_correctas,
                i.filas_advertencia,
                i.filas_con_error,
                i.estado,
                i.mensaje
            FROM importaciones_5mf AS i
            INNER JOIN usuarios AS u
                ON u.id_usuario = i.id_usuario
            ORDER BY
                i.id_importacion_5mf DESC;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            historial.Add(new
            {
                idImportacion =
                    reader.GetInt64(
                        "id_importacion_5mf"
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

                nombreUsuario =
                    reader.GetString(
                        "nombre_usuario"
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

    // Obtiene las advertencias y errores de una importación.
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
                id_staging_5mf,
                numero_fila,
                familia_archivo,
                numero_arnes,
                nivel_diseno,
                proyecto_rivian,
                fecha_inicio,
                fecha_final,
                numero_requisicion,
                sets_planeados,
                id_familia_coincidente,
                id_arnes_coincidente,
                es_valido,
                tiene_advertencia,
                detalle_validacion
            FROM staging_5mf
            WHERE id_importacion_5mf =
                  @idImportacion
            ORDER BY
                numero_fila,
                id_staging_5mf;
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
                idStaging =
                    reader.GetInt64(
                        "id_staging_5mf"
                    ),

                numeroFila =
                    reader.GetInt32(
                        "numero_fila"
                    ),

                familia =
                    ObtenerStringOpcional(
                        reader,
                        "familia_archivo"
                    ),

                numeroArnes =
                    ObtenerStringOpcional(
                        reader,
                        "numero_arnes"
                    ),

                nivelDiseno =
                    ObtenerStringOpcional(
                        reader,
                        "nivel_diseno"
                    ),

                proyectoRivian =
                    ObtenerStringOpcional(
                        reader,
                        "proyecto_rivian"
                    ),

                fechaInicio =
                    ObtenerFechaOpcional(
                        reader,
                        "fecha_inicio"
                    ),

                fechaFinal =
                    ObtenerFechaOpcional(
                        reader,
                        "fecha_final"
                    ),

                numeroRequisicion =
                    ObtenerStringOpcional(
                        reader,
                        "numero_requisicion"
                    ),

                setsPlaneados =
                    ObtenerDecimalOpcional(
                        reader,
                        "sets_planeados"
                    ),

                idFamilia =
                    ObtenerIntOpcional(
                        reader,
                        "id_familia_coincidente"
                    ),

                idArnes =
                    ObtenerIntOpcional(
                        reader,
                        "id_arnes_coincidente"
                    ),

                esValido =
                    reader.GetBoolean(
                        "es_valido"
                    ),

                tieneAdvertencia =
                    reader.GetBoolean(
                        "tiene_advertencia"
                    ),

                detalleValidacion =
                    ObtenerStringOpcional(
                        reader,
                        "detalle_validacion"
                    )
            });
        }

        return detalles;
    }

    // Guarda una fila leída del archivo 5MF.
    public async Task<long> GuardarStagingAsync(
        long idImportacion,
        Models.FiveMfRow fila,
        int? idFamilia,
        int? idArnes,
        bool esValido,
        bool tieneAdvertencia,
        string? detalleValidacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO staging_5mf (
            id_importacion_5mf,
            numero_fila,
            familia_archivo,
            numero_arnes,
            nivel_diseno,
            proyecto_rivian,
            fecha_inicio,
            fecha_final,
            numero_requisicion,
            sets_planeados,
            id_familia_coincidente,
            id_arnes_coincidente,
            es_valido,
            tiene_advertencia,
            detalle_validacion
        )
        VALUES (
            @idImportacion,
            @numeroFila,
            @familia,
            @numeroArnes,
            @nivelDiseno,
            @proyectoRivian,
            @fechaInicio,
            @fechaFinal,
            @numeroRequisicion,
            @setsPlaneados,
            @idFamilia,
            @idArnes,
            @esValido,
            @tieneAdvertencia,
            @detalleValidacion
        );
        """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        command.Parameters.AddWithValue(
            "@numeroFila",
            fila.NumeroFila
        );

        command.Parameters.AddWithValue(
            "@familia",
            ValorODbNull(fila.Familia)
        );

        command.Parameters.AddWithValue(
            "@numeroArnes",
            ValorODbNull(fila.NumeroArnes)
        );

        command.Parameters.AddWithValue(
            "@nivelDiseno",
            ValorODbNull(fila.NivelDiseno)
        );

        command.Parameters.AddWithValue(
            "@proyectoRivian",
            ValorODbNull(fila.ProyectoRivian)
        );

        command.Parameters.AddWithValue(
            "@fechaInicio",
            fila.FechaInicio.HasValue
                ? fila.FechaInicio.Value.ToDateTime(
                    TimeOnly.MinValue
                )
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "@fechaFinal",
            fila.FechaFinal.HasValue
                ? fila.FechaFinal.Value.ToDateTime(
                    TimeOnly.MinValue
                )
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "@numeroRequisicion",
            ValorODbNull(
                fila.NumeroRequisicion
            )
        );

        command.Parameters.AddWithValue(
            "@setsPlaneados",
            fila.SetsPlaneados
        );

        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia.HasValue
                ? idFamilia.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "@idArnes",
            idArnes.HasValue
                ? idArnes.Value
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "@esValido",
            esValido
        );

        command.Parameters.AddWithValue(
            "@tieneAdvertencia",
            tieneAdvertencia
        );

        command.Parameters.AddWithValue(
            "@detalleValidacion",
            ValorODbNull(
                detalleValidacion
            )
        );

        await command.ExecuteNonQueryAsync();

        return command.LastInsertedId;
    }

    // Guarda o actualiza el plan semanal del arnés.
    public async Task GuardarPlanSemanalAsync(
        long idImportacion,
        int idArnes,
        Models.FiveMfRow fila)
    {
        if (
            !fila.FechaInicio.HasValue ||
            !fila.FechaFinal.HasValue
        )
        {
            throw new InvalidOperationException(
                "La fila no contiene las fechas del plan semanal."
            );
        }

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO plan_semanal_arnes (
            id_importacion_5mf,
            id_arnes,
            proyecto_rivian,
            fecha_inicio,
            fecha_final,
            numero_requisicion,
            sets_planeados,
            activo
        )
        VALUES (
            @idImportacion,
            @idArnes,
            @proyectoRivian,
            @fechaInicio,
            @fechaFinal,
            @numeroRequisicion,
            @setsPlaneados,
            TRUE
        )
        ON DUPLICATE KEY UPDATE
            id_importacion_5mf =
                VALUES(id_importacion_5mf),
            fecha_final =
                VALUES(fecha_final),
            sets_planeados =
                VALUES(sets_planeados),
            activo =
                TRUE;
        """;

        command.Parameters.AddWithValue(
            "@idImportacion",
            idImportacion
        );

        command.Parameters.AddWithValue(
            "@idArnes",
            idArnes
        );

        command.Parameters.AddWithValue(
            "@proyectoRivian",
            ValorODbNull(
                fila.ProyectoRivian
            )
        );

        command.Parameters.AddWithValue(
            "@fechaInicio",
            fila.FechaInicio.Value.ToDateTime(
                TimeOnly.MinValue
            )
        );

        command.Parameters.AddWithValue(
            "@fechaFinal",
            fila.FechaFinal.Value.ToDateTime(
                TimeOnly.MinValue
            )
        );

        command.Parameters.AddWithValue(
            "@numeroRequisicion",
            ValorODbNull(
                fila.NumeroRequisicion
            )
        );

        command.Parameters.AddWithValue(
            "@setsPlaneados",
            fila.SetsPlaneados
        );

        await command.ExecuteNonQueryAsync();
    }

    // Convierte texto vacío en NULL de MySQL.
    private static object ValorODbNull(
        string? valor)
    {
        return string.IsNullOrWhiteSpace(valor)
            ? DBNull.Value
            : valor.Trim();
    }


    // Obtiene texto permitiendo valores NULL.
    private static string?
        ObtenerStringOpcional(
            MySqlConnector.MySqlDataReader reader,
            string columna)
    {
        var posicion =
            reader.GetOrdinal(columna);

        return reader.IsDBNull(posicion)
            ? null
            : reader.GetString(posicion);
    }

    // Obtiene un entero permitiendo valores NULL.
    private static int?
        ObtenerIntOpcional(
            MySqlConnector.MySqlDataReader reader,
            string columna)
    {
        var posicion =
            reader.GetOrdinal(columna);

        return reader.IsDBNull(posicion)
            ? null
            : reader.GetInt32(posicion);
    }

    // Obtiene un decimal permitiendo valores NULL.
    private static decimal?
        ObtenerDecimalOpcional(
            MySqlConnector.MySqlDataReader reader,
            string columna)
    {
        var posicion =
            reader.GetOrdinal(columna);

        return reader.IsDBNull(posicion)
            ? null
            : reader.GetDecimal(posicion);
    }

    // Obtiene una fecha permitiendo valores NULL.
    private static DateTime?
        ObtenerFechaOpcional(
            MySqlConnector.MySqlDataReader reader,
            string columna)
    {
        var posicion =
            reader.GetOrdinal(columna);

        return reader.IsDBNull(posicion)
            ? null
            : reader.GetDateTime(posicion);
    }
}