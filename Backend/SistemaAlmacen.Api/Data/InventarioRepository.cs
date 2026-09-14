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
            inventario.Add(MapearInventario(reader));
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

    // Obtiene el inventario de un material en todas sus ubicaciones.
    public async Task<List<Inventario>> ObtenerPorMaterialAsync(
        int idMaterial)
    {
        var inventario = new List<Inventario>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();


        command.CommandText = CrearConsultaBase() + """
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
            inventario.Add(MapearInventario(reader));
        }

        return inventario;
    }

    // Obtiene todos los materiales de una ubicación.
    public async Task<List<Inventario>> ObtenerPorUbicacionAsync(
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
            inventario.Add(MapearInventario(reader));
        }

        return inventario;
    }

    // Obtiene la existencia de un material en una ubicación específica.
    public async Task<Inventario?> ObtenerPorMaterialYUbicacionAsync(
        int idMaterial,
        int idUbicacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = CrearConsultaBase() + """
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

    // Define las tablas y columnas utilizadas por las consultas.
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
                reader.GetString("numero_parte_material"),

            DescripcionMaterial =
                reader.GetString("descripcion_material"),

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
                reader.GetDateTime("ultima_actualizacion")
        };
    }
}