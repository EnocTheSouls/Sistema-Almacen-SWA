using MySqlConnector;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las consultas del Kardex de inventario.
public sealed class MovimientoInventarioRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public MovimientoInventarioRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los movimientos, comenzando por el más reciente.
    public async Task<List<MovimientoInventario>>
        ObtenerTodosAsync()
    {
        var movimientos =
            new List<MovimientoInventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            ORDER BY
                mi.fecha_hora DESC,
                mi.id_movimiento DESC;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            movimientos.Add(
                MapearMovimiento(reader)
            );
        }

        return movimientos;
    }

    // Obtiene el Kardex de un material específico.
    public async Task<List<MovimientoInventario>>
        ObtenerPorMaterialAsync(
            int idMaterial)
    {
        var movimientos =
            new List<MovimientoInventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            WHERE mi.id_material = @idMaterial
            ORDER BY
                mi.fecha_hora DESC,
                mi.id_movimiento DESC;
            """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            movimientos.Add(
                MapearMovimiento(reader)
            );
        }

        return movimientos;
    }

    // Obtiene los movimientos relacionados con una solicitud.
    public async Task<List<MovimientoInventario>>
        ObtenerPorSolicitudAsync(
            long idSolicitud)
    {
        var movimientos =
            new List<MovimientoInventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            WHERE mi.id_solicitud = @idSolicitud
            ORDER BY
                mi.fecha_hora ASC,
                mi.id_movimiento ASC;
            """;

        command.Parameters.AddWithValue(
            "@idSolicitud",
            idSolicitud
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            movimientos.Add(
                MapearMovimiento(reader)
            );
        }

        return movimientos;
    }

    // Obtiene movimientos usando filtros opcionales combinables.
    public async Task<List<MovimientoInventario>>
        ObtenerFiltradosAsync(
            int? idMaterial,
            long? idSolicitud,
            string? tipoMovimiento,
            int? idUsuario,
            int? idUbicacion,
            DateTime? fechaDesde,
            DateTime? fechaHasta)
    {
        var movimientos =
            new List<MovimientoInventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        var condiciones =
            new List<string>();

        // Filtra por material.
        if (idMaterial.HasValue)
        {
            condiciones.Add(
                "mi.id_material = @idMaterial"
            );

            command.Parameters.AddWithValue(
                "@idMaterial",
                idMaterial.Value
            );
        }

        // Filtra por solicitud.
        if (idSolicitud.HasValue)
        {
            condiciones.Add(
                "mi.id_solicitud = @idSolicitud"
            );

            command.Parameters.AddWithValue(
                "@idSolicitud",
                idSolicitud.Value
            );
        }

        // Filtra por tipo de movimiento.
        if (!string.IsNullOrWhiteSpace(
            tipoMovimiento))
        {
            condiciones.Add(
                "UPPER(mi.tipo_movimiento) = @tipoMovimiento"
            );

            command.Parameters.AddWithValue(
                "@tipoMovimiento",
                tipoMovimiento
                    .Trim()
                    .ToUpperInvariant()
            );
        }

        // Filtra por usuario responsable.
        if (idUsuario.HasValue)
        {
            condiciones.Add(
                "mi.id_usuario = @idUsuario"
            );

            command.Parameters.AddWithValue(
                "@idUsuario",
                idUsuario.Value
            );
        }

        // Busca la ubicación como origen o destino.
        if (idUbicacion.HasValue)
        {
            condiciones.Add(
                """
                (
                    mi.id_ubicacion_origen = @idUbicacion
                    OR
                    mi.id_ubicacion_destino = @idUbicacion
                )
                """
            );

            command.Parameters.AddWithValue(
                "@idUbicacion",
                idUbicacion.Value
            );
        }

        // Incluye movimientos desde el inicio del día indicado.
        if (fechaDesde.HasValue)
        {
            condiciones.Add(
                "mi.fecha_hora >= @fechaDesde"
            );

            command.Parameters.AddWithValue(
                "@fechaDesde",
                fechaDesde.Value.Date
            );
        }

        // Incluye todo el día de la fecha final.
        if (fechaHasta.HasValue)
        {
            condiciones.Add(
                "mi.fecha_hora < @fechaHastaExclusiva"
            );

            command.Parameters.AddWithValue(
                "@fechaHastaExclusiva",
                fechaHasta.Value.Date.AddDays(1)
            );
        }

        var consulta =
            CrearConsultaBase();

        if (condiciones.Count > 0)
        {
            consulta +=
                Environment.NewLine +
                "WHERE " +
                string.Join(
                    Environment.NewLine + "  AND ",
                    condiciones
                );
        }

        consulta +=
            Environment.NewLine +
            """
            ORDER BY
                mi.fecha_hora DESC,
                mi.id_movimiento DESC;
            """;

        command.CommandText = consulta;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            movimientos.Add(
                MapearMovimiento(reader)
            );
        }

        return movimientos;
    }

    // Define las tablas y columnas utilizadas por el Kardex.
    private static string CrearConsultaBase()
    {
        return """
            SELECT
                mi.id_movimiento,
                mi.id_solicitud,
                mi.id_arnes,
                mi.fecha_hora,
                mi.id_material,
                m.numero_parte_material,
                m.descripcion AS descripcion_material,
                m.unidad_medida,
                mi.cantidad,
                mi.tipo_movimiento,
                mi.id_ubicacion_origen,

                CASE
                    WHEN mi.id_ubicacion_origen IS NULL
                    THEN NULL
                    ELSE CONCAT(
                        zo.codigo,
                        ' / ',
                        ro.nombre,
                        ' / ',
                        uo.nivel,
                        ' / ',
                        uo.posicion
                    )
                END AS ubicacion_origen,

                mi.id_ubicacion_destino,

                CASE
                    WHEN mi.id_ubicacion_destino IS NULL
                    THEN NULL
                    ELSE CONCAT(
                        zd.codigo,
                        ' / ',
                        rd.nombre,
                        ' / ',
                        ud.nivel,
                        ' / ',
                        ud.posicion
                    )
                END AS ubicacion_destino,

                mi.id_usuario,
                us.nombre AS nombre_usuario,
                mi.referencia,
                mi.comentarios

            FROM movimiento_inventario AS mi

            INNER JOIN materiales AS m
                ON m.id_material = mi.id_material

            INNER JOIN usuarios AS us
                ON us.id_usuario = mi.id_usuario

            LEFT JOIN ubicaciones AS uo
                ON uo.id_ubicacion =
                    mi.id_ubicacion_origen

            LEFT JOIN racks AS ro
                ON ro.id_rack = uo.id_rack

            LEFT JOIN zonas AS zo
                ON zo.id_zona = ro.id_zona

            LEFT JOIN ubicaciones AS ud
                ON ud.id_ubicacion =
                    mi.id_ubicacion_destino

            LEFT JOIN racks AS rd
                ON rd.id_rack = ud.id_rack

            LEFT JOIN zonas AS zd
                ON zd.id_zona = rd.id_zona
            """;
    }

    // Convierte una fila de MySQL en un movimiento.
    private static MovimientoInventario
        MapearMovimiento(
            MySqlDataReader reader)
    {
        return new MovimientoInventario
        {
            IdMovimiento =
                reader.GetInt64("id_movimiento"),

            IdSolicitud = reader.IsDBNull(
                reader.GetOrdinal("id_solicitud")
            )
                ? null
                : reader.GetInt64("id_solicitud"),

            IdArnes = reader.IsDBNull(
                reader.GetOrdinal("id_arnes")
            )
                ? null
                : reader.GetInt32("id_arnes"),

            FechaHora =
                reader.GetDateTime("fecha_hora"),

            IdMaterial =
                reader.GetInt32("id_material"),

            NumeroParteMaterial =
                reader.GetString(
                    "numero_parte_material"
                ),

            DescripcionMaterial =
                reader.GetString(
                    "descripcion_material"
                ),

            UnidadMedida = reader.IsDBNull(
                reader.GetOrdinal("unidad_medida")
            )
                ? null
                : reader.GetString("unidad_medida"),

            Cantidad =
                reader.GetDecimal("cantidad"),

            TipoMovimiento =
                reader.GetString("tipo_movimiento"),

            IdUbicacionOrigen = reader.IsDBNull(
                reader.GetOrdinal(
                    "id_ubicacion_origen"
                )
            )
                ? null
                : reader.GetInt32(
                    "id_ubicacion_origen"
                ),

            UbicacionOrigen = reader.IsDBNull(
                reader.GetOrdinal(
                    "ubicacion_origen"
                )
            )
                ? null
                : reader.GetString(
                    "ubicacion_origen"
                ),

            IdUbicacionDestino = reader.IsDBNull(
                reader.GetOrdinal(
                    "id_ubicacion_destino"
                )
            )
                ? null
                : reader.GetInt32(
                    "id_ubicacion_destino"
                ),

            UbicacionDestino = reader.IsDBNull(
                reader.GetOrdinal(
                    "ubicacion_destino"
                )
            )
                ? null
                : reader.GetString(
                    "ubicacion_destino"
                ),

            IdUsuario =
                reader.GetInt32("id_usuario"),

            NombreUsuario =
                reader.GetString("nombre_usuario"),

            Referencia = reader.IsDBNull(
                reader.GetOrdinal("referencia")
            )
                ? null
                : reader.GetString("referencia"),

            Comentarios = reader.IsDBNull(
                reader.GetOrdinal("comentarios")
            )
                ? null
                : reader.GetString("comentarios")
        };
    }
}
