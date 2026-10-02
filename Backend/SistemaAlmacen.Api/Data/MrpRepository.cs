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
    }

    // Registra el encabezado de la importación.
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

        command.CommandText = """
            INSERT INTO requerimientos_mrp (
                id_importacion,
                numero_requisicion,
                numero_material,
                nombre_material,
                familia,
                proyecto,
                fecha_eta,
                cantidad_requerida,
                pack_size,
                bolsas_necesarias
            )
            VALUES (
                @idImportacion,
                @numeroRequisicion,
                @numeroMaterial,
                @nombreMaterial,
                @familia,
                @proyecto,
                @fechaEta,
                @cantidadRequerida,
                @packSize,
                @bolsasNecesarias
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
            "@nombreMaterial",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@familia",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@proyecto",
            MySqlDbType.VarChar
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
                    requerimiento
                        .NumeroRequisicion
                );

            command.Parameters[
                "@numeroMaterial"
            ].Value =
                requerimiento
                    .NumeroMaterial
                    .Trim();

            command.Parameters[
                "@nombreMaterial"
            ].Value =
                ValorODbNull(
                    requerimiento
                        .NombreMaterial
                );

            command.Parameters[
                "@familia"
            ].Value =
                ValorODbNull(
                    requerimiento
                        .Familia
                );

            command.Parameters[
                "@proyecto"
            ].Value =
                ValorODbNull(
                    requerimiento
                        .Proyecto
                );

            command.Parameters[
                "@fechaEta"
            ].Value =
                requerimiento
                    .FechaEta
                    .Date;

            command.Parameters[
                "@cantidadRequerida"
            ].Value =
                requerimiento
                    .CantidadRequerida;

            command.Parameters[
                "@packSize"
            ].Value =
                requerimiento
                    .PackSize;

            command.Parameters[
                "@bolsasNecesarias"
            ].Value =
                requerimiento
                    .BolsasNecesarias;

            await command.ExecuteNonQueryAsync();
        }
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
            condiciones.Add("""
                (
                    r.numero_material LIKE
                        @busqueda
                    OR
                    r.nombre_material LIKE
                        @busqueda
                )
                """);
        }

        if (!string.IsNullOrWhiteSpace(
            proyecto))
        {
            condiciones.Add(
                "r.proyecto = @proyecto"
            );
        }

        if (!string.IsNullOrWhiteSpace(
            familia))
        {
            condiciones.Add(
                "r.familia = @familia"
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

    private static async Task<int>
        ObtenerTotalAsync(
            MySqlConnection connection,
            string where,
            string? busqueda,
            string? proyecto,
            string? familia,
            DateTime? fechaDesde,
            DateTime? fechaHasta)
    {
        await using var command =
            connection.CreateCommand();

        command.CommandText =
            $"""
            SELECT COUNT(*)
            FROM requerimientos_mrp AS r
            INNER JOIN importaciones_mrp AS i
                ON i.id_importacion =
                   r.id_importacion
            WHERE {where};
            """;

        AgregarParametrosFiltro(
            command,
            busqueda,
            proyecto,
            familia,
            fechaDesde,
            fechaHasta
        );

        var resultado =
            await command.ExecuteScalarAsync();

        return Convert.ToInt32(
            resultado
        );
    }

    private static async Task<
        List<RequerimientoMrpDto>
    > ObtenerPaginaAsync(
        MySqlConnection connection,
        string where,
        string? busqueda,
        string? proyecto,
        string? familia,
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
                r.nombre_material,
                r.familia,
                r.proyecto,
                r.fecha_eta,
                r.cantidad_requerida,
                r.pack_size,
                r.bolsas_necesarias
            FROM requerimientos_mrp AS r
            INNER JOIN importaciones_mrp AS i
                ON i.id_importacion =
                   r.id_importacion
            WHERE {where}
            ORDER BY
                r.fecha_eta,
                r.proyecto,
                r.familia,
                r.numero_material
            LIMIT @tamanoPagina
            OFFSET @offset;
            """;

        AgregarParametrosFiltro(
            command,
            busqueda,
            proyecto,
            familia,
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

                    NombreMaterial =
                        ObtenerStringOpcional(
                            reader,
                            "nombre_material"
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
                        )
                }
            );
        }

        return registros;
    }

    // Obtiene los valores disponibles
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
                r.proyecto,
                r.familia
            FROM requerimientos_mrp AS r
            INNER JOIN importaciones_mrp AS i
                ON i.id_importacion =
                   r.id_importacion
            WHERE i.vigente = TRUE
            ORDER BY
                r.proyecto,
                r.familia;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        var proyectos =
            new HashSet<string>(
                StringComparer
                    .OrdinalIgnoreCase
            );

        var familias =
            new HashSet<string>(
                StringComparer
                    .OrdinalIgnoreCase
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
                fechaReader.IsDBNull(
                    fechaReader.GetOrdinal(
                        "fecha_minima"
                    )
                )
                    ? null
                    : fechaReader.GetDateTime(
                        "fecha_minima"
                    );

            resultado.FechaMaxima =
                fechaReader.IsDBNull(
                    fechaReader.GetOrdinal(
                        "fecha_maxima"
                    )
                )
                    ? null
                    : fechaReader.GetDateTime(
                        "fecha_maxima"
                    );
        }

        return resultado;
    }

    private static void
        AgregarParametrosFiltro(
            MySqlCommand command,
            string? busqueda,
            string? proyecto,
            string? familia,
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
}
