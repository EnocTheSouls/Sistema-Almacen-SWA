using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de ubicaciones en MySQL.
public sealed class UbicacionRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public UbicacionRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todas las ubicaciones con su rack y zona.
    public async Task<List<Ubicacion>> ObtenerTodasAsync()
    {
        var ubicaciones = new List<Ubicacion>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                u.id_ubicacion,
                u.id_rack,
                r.id_zona,
                z.codigo AS codigo_zona,
                z.nombre AS nombre_zona,
                r.nombre AS nombre_rack,
                u.nivel,
                u.posicion,
                u.capacidad_maxima,
                u.activo
            FROM ubicaciones AS u
            INNER JOIN racks AS r
                ON r.id_rack = u.id_rack
            INNER JOIN zonas AS z
                ON z.id_zona = r.id_zona
            ORDER BY
                z.codigo,
                r.nombre,
                u.nivel,
                u.posicion;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en un objeto Ubicacion.
        while (await reader.ReadAsync())
        {
            ubicaciones.Add(MapearUbicacion(reader));
        }

        return ubicaciones;
    }

    // Obtiene una ubicación por su identificador.
    public async Task<Ubicacion?> ObtenerPorIdAsync(
        int idUbicacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                u.id_ubicacion,
                u.id_rack,
                r.id_zona,
                z.codigo AS codigo_zona,
                z.nombre AS nombre_zona,
                r.nombre AS nombre_rack,
                u.nivel,
                u.posicion,
                u.capacidad_maxima,
                u.activo
            FROM ubicaciones AS u
            INNER JOIN racks AS r
                ON r.id_rack = u.id_rack
            INNER JOIN zonas AS z
                ON z.id_zona = r.id_zona
            WHERE u.id_ubicacion = @idUbicacion;
            """;

        // Envía el identificador como parámetro seguro.
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

        return MapearUbicacion(reader);
    }

    // Crea una ubicación dentro de un rack.
    public async Task<Ubicacion?> CrearAsync(
        int idRack,
        string nivel,
        string posicion,
        decimal? capacidadMaxima)
    {
        var nivelLimpio =
            nivel.Trim().ToUpperInvariant();

        var posicionLimpia =
            posicion.Trim().ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            INSERT INTO ubicaciones (
                id_rack,
                nivel,
                posicion,
                capacidad_maxima,
                activo
            )
            VALUES (
                @idRack,
                @nivel,
                @posicion,
                @capacidadMaxima,
                TRUE
            );
            """;

        // Envía los datos mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@idRack",
            idRack
        );

        command.Parameters.AddWithValue(
            "@nivel",
            nivelLimpio
        );

        command.Parameters.AddWithValue(
            "@posicion",
            posicionLimpia
        );

        command.Parameters.AddWithValue(
            "@capacidadMaxima",
            capacidadMaxima.HasValue
                ? capacidadMaxima.Value
                : DBNull.Value
        );

        await command.ExecuteNonQueryAsync();

        var idUbicacion =
            Convert.ToInt32(command.LastInsertedId);

        // Consulta la ubicación para incluir rack y zona.
        return await ObtenerPorIdAsync(idUbicacion);
    }

    // Convierte una fila de MySQL en una ubicación.
    private static Ubicacion MapearUbicacion(
        MySqlConnector.MySqlDataReader reader)
    {
        return new Ubicacion
        {
            IdUbicacion =
                reader.GetInt32("id_ubicacion"),

            IdRack =
                reader.GetInt32("id_rack"),

            IdZona =
                reader.GetInt32("id_zona"),

            CodigoZona =
                reader.GetString("codigo_zona"),

            NombreZona =
                reader.GetString("nombre_zona"),

            NombreRack =
                reader.GetString("nombre_rack"),

            Nivel =
                reader.GetString("nivel"),

            Posicion =
                reader.GetString("posicion"),

            CapacidadMaxima = reader.IsDBNull(
                reader.GetOrdinal("capacidad_maxima")
            )
                ? null
                : reader.GetDecimal("capacidad_maxima"),

            Activo =
                reader.GetBoolean("activo")
        };
    }
}