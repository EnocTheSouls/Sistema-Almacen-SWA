using MySqlConnector;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las existencias de materiales por ubicación.
public sealed class InventarioRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public InventarioRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todo el inventario con material y ubicación.
    public async Task<List<Inventario>> ObtenerTodoAsync()
    {
        var inventario = new List<Inventario>();

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
                m.numero_parte_material,
                z.codigo,
                r.nombre,
                u.nivel,
                u.posicion;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            inventario.Add(
                MapearInventario(reader)
            );
        }

        return inventario;
    }

    // Obtiene un registro de inventario por su identificador.
    public async Task<Inventario?> ObtenerPorIdAsync(
        long idInventario)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            WHERE i.id_inventario = @idInventario;
            """;

        command.Parameters.AddWithValue(
            "@idInventario",
            idInventario
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapearInventario(reader);
    }

    // Obtiene el inventario de un material en sus ubicaciones.
    public async Task<List<Inventario>>
        ObtenerPorMaterialAsync(
            int idMaterial)
    {
        var inventario = new List<Inventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            WHERE i.id_material = @idMaterial
            ORDER BY
                z.codigo,
                r.nombre,
                u.nivel,
                u.posicion;
            """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            inventario.Add(
                MapearInventario(reader)
            );
        }

        return inventario;
    }

    // Obtiene todos los materiales de una ubicación.
    public async Task<List<Inventario>>
        ObtenerPorUbicacionAsync(
            int idUbicacion)
    {
        var inventario = new List<Inventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            WHERE i.id_ubicacion = @idUbicacion
            ORDER BY m.numero_parte_material;
            """;

        command.Parameters.AddWithValue(
            "@idUbicacion",
            idUbicacion
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            inventario.Add(
                MapearInventario(reader)
            );
        }

        return inventario;
    }

    // Obtiene un material en una ubicación específica.
    public async Task<Inventario?>
        ObtenerPorMaterialYUbicacionAsync(
            int idMaterial,
            int idUbicacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaBase() +
            Environment.NewLine +
            """
            WHERE i.id_material = @idMaterial
              AND i.id_ubicacion = @idUbicacion
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        command.Parameters.AddWithValue(
            "@idUbicacion",
            idUbicacion
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapearInventario(reader);
    }


    // Registra una entrada de inventario y su movimiento.
public async Task<Inventario?> RegistrarEntradaAsync(
    int idMaterial,
    int idUbicacion,
    decimal cantidad,
    int idUsuario,
    string? referencia,
    string? comentarios)
{
    var referenciaLimpia =
        string.IsNullOrWhiteSpace(referencia)
            ? null
            : referencia.Trim();

    var comentariosLimpios =
        string.IsNullOrWhiteSpace(comentarios)
            ? null
            : comentarios.Trim();

    await using var connection =
        _connectionFactory.CreateConnection();

    await connection.OpenAsync();

    // Ambas operaciones se confirman o cancelan juntas.
    await using var transaction =
        await connection.BeginTransactionAsync();

    try
    {
        long? idInventario = null;

        // Busca y bloquea temporalmente la existencia actual.
        await using (var buscarCommand =
            connection.CreateCommand())
        {
            buscarCommand.Transaction = transaction;

            buscarCommand.CommandText = """
                SELECT id_inventario
                FROM inventario
                WHERE id_material = @idMaterial
                  AND id_ubicacion = @idUbicacion
                LIMIT 1
                FOR UPDATE;
                """;

            buscarCommand.Parameters.AddWithValue(
                "@idMaterial",
                idMaterial
            );

            buscarCommand.Parameters.AddWithValue(
                "@idUbicacion",
                idUbicacion
            );

            var resultado =
                await buscarCommand.ExecuteScalarAsync();

            if (resultado is not null &&
                resultado is not DBNull)
            {
                idInventario =
                    Convert.ToInt64(resultado);
            }
        }

        if (idInventario.HasValue)
        {
            // Aumenta el inventario disponible existente.
            await using var actualizarCommand =
                connection.CreateCommand();

            actualizarCommand.Transaction = transaction;

            actualizarCommand.CommandText = """
                UPDATE inventario
                SET
                    disponible = disponible + @cantidad,
                    ultima_actualizacion = CURRENT_TIMESTAMP
                WHERE id_inventario = @idInventario;
                """;

            actualizarCommand.Parameters.AddWithValue(
                "@cantidad",
                cantidad
            );

            actualizarCommand.Parameters.AddWithValue(
                "@idInventario",
                idInventario.Value
            );

            await actualizarCommand.ExecuteNonQueryAsync();
        }
        else
        {
            // Crea la existencia inicial del material.
            await using var insertarCommand =
                connection.CreateCommand();

            insertarCommand.Transaction = transaction;

            insertarCommand.CommandText = """
                INSERT INTO inventario (
                    id_material,
                    id_ubicacion,
                    disponible,
                    reservado,
                    no_disponible,
                    ultima_actualizacion
                )
                VALUES (
                    @idMaterial,
                    @idUbicacion,
                    @cantidad,
                    0,
                    0,
                    CURRENT_TIMESTAMP
                );
                """;

            insertarCommand.Parameters.AddWithValue(
                "@idMaterial",
                idMaterial
            );

            insertarCommand.Parameters.AddWithValue(
                "@idUbicacion",
                idUbicacion
            );

            insertarCommand.Parameters.AddWithValue(
                "@cantidad",
                cantidad
            );

            await insertarCommand.ExecuteNonQueryAsync();

            idInventario =
                Convert.ToInt64(
                    insertarCommand.LastInsertedId
                );
        }

        // Registra el historial de la entrada.
        await using (var movimientoCommand =
            connection.CreateCommand())
        {
            movimientoCommand.Transaction = transaction;

            movimientoCommand.CommandText = """
                INSERT INTO movimiento_inventario (
                    id_solicitud,
                    id_arnes,
                    fecha_hora,
                    id_material,
                    cantidad,
                    tipo_movimiento,
                    id_ubicacion_origen,
                    id_ubicacion_destino,
                    id_usuario,
                    referencia,
                    comentarios
                )
                VALUES (
                    NULL,
                    NULL,
                    CURRENT_TIMESTAMP,
                    @idMaterial,
                    @cantidad,
                    'ENTRADA',
                    NULL,
                    @idUbicacion,
                    @idUsuario,
                    @referencia,
                    @comentarios
                );
                """;

            movimientoCommand.Parameters.AddWithValue(
                "@idMaterial",
                idMaterial
            );

            movimientoCommand.Parameters.AddWithValue(
                "@cantidad",
                cantidad
            );

            movimientoCommand.Parameters.AddWithValue(
                "@idUbicacion",
                idUbicacion
            );

            movimientoCommand.Parameters.AddWithValue(
                "@idUsuario",
                idUsuario
            );

            movimientoCommand.Parameters.AddWithValue(
                "@referencia",
                referenciaLimpia is null
                    ? DBNull.Value
                    : referenciaLimpia
            );

            movimientoCommand.Parameters.AddWithValue(
                "@comentarios",
                comentariosLimpios is null
                    ? DBNull.Value
                    : comentariosLimpios
            );

            await movimientoCommand.ExecuteNonQueryAsync();
        }

        // Confirma inventario y movimiento al mismo tiempo.
        await transaction.CommitAsync();

        return await ObtenerPorIdAsync(
            idInventario.Value
        );
    }
    catch
    {
        // Cancela todo si cualquiera de las operaciones falla.
        await transaction.RollbackAsync();
        throw;
    }
}

    // Define las tablas y columnas de las consultas.
    private static string CrearConsultaBase()
    {
        return """
            SELECT
                i.id_inventario,
                i.id_material,
                m.numero_parte_material,
                m.descripcion AS descripcion_material,
                m.unidad_medida,
                m.tipo_empaque,
                m.std_pack,
                i.id_ubicacion,
                z.codigo AS codigo_zona,
                r.nombre AS nombre_rack,
                u.nivel,
                u.posicion,
                i.disponible,
                i.reservado,
                i.no_disponible,
                i.ultima_actualizacion
            FROM inventario AS i
            INNER JOIN materiales AS m
                ON m.id_material = i.id_material
            INNER JOIN ubicaciones AS u
                ON u.id_ubicacion = i.id_ubicacion
            INNER JOIN racks AS r
                ON r.id_rack = u.id_rack
            INNER JOIN zonas AS z
                ON z.id_zona = r.id_zona
            """;
    }

    // Convierte una fila de MySQL en un objeto Inventario.
    private static Inventario MapearInventario(
        MySqlDataReader reader)
    {
        return new Inventario
        {
            IdInventario =
                reader.GetInt64("id_inventario"),

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

            TipoEmpaque = reader.IsDBNull(
                reader.GetOrdinal("tipo_empaque")
            )
                ? null
                : reader.GetString("tipo_empaque"),

            StdPack = reader.IsDBNull(
                reader.GetOrdinal("std_pack")
            )
                ? null
                : reader.GetDecimal("std_pack"),

            IdUbicacion =
                reader.GetInt32("id_ubicacion"),

            CodigoZona =
                reader.GetString("codigo_zona"),

            NombreRack =
                reader.GetString("nombre_rack"),

            Nivel =
                reader.GetString("nivel"),

            Posicion =
                reader.GetString("posicion"),

            Disponible =
                reader.GetDecimal("disponible"),

            Reservado =
                reader.GetDecimal("reservado"),

            NoDisponible =
                reader.GetDecimal("no_disponible"),

            UltimaActualizacion =
                reader.GetDateTime(
                    "ultima_actualizacion"
                )
        };
    }
}
