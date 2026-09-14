using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de racks en MySQL.
public sealed class RackRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public RackRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los racks junto con su zona.
    public async Task<List<Rack>> ObtenerTodosAsync()
    {
        var racks = new List<Rack>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                r.id_rack,
                r.id_zona,
                z.codigo AS codigo_zona,
                z.nombre AS nombre_zona,
                r.nombre,
                r.altura_total,
                r.activo
            FROM racks AS r
            INNER JOIN zonas AS z
                ON z.id_zona = r.id_zona
            ORDER BY
                z.codigo,
                r.nombre;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en un objeto Rack.
        while (await reader.ReadAsync())
        {
            racks.Add(new Rack
            {
                IdRack = reader.GetInt32("id_rack"),
                IdZona = reader.GetInt32("id_zona"),
                CodigoZona = reader.GetString("codigo_zona"),
                NombreZona = reader.GetString("nombre_zona"),
                Nombre = reader.GetString("nombre"),

                AlturaTotal = reader.IsDBNull(
                    reader.GetOrdinal("altura_total")
                )
                    ? null
                    : reader.GetInt32("altura_total"),

                Activo = reader.GetBoolean("activo")
            });
        }

        return racks;
    }

    // Obtiene un rack por su identificador.
    public async Task<Rack?> ObtenerPorIdAsync(
        int idRack)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                r.id_rack,
                r.id_zona,
                z.codigo AS codigo_zona,
                z.nombre AS nombre_zona,
                r.nombre,
                r.altura_total,
                r.activo
            FROM racks AS r
            INNER JOIN zonas AS z
                ON z.id_zona = r.id_zona
            WHERE r.id_rack = @idRack;
            """;

        // Envía el identificador mediante un parámetro seguro.
        command.Parameters.AddWithValue(
            "@idRack",
            idRack
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null cuando el rack no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Rack
        {
            IdRack = reader.GetInt32("id_rack"),
            IdZona = reader.GetInt32("id_zona"),
            CodigoZona = reader.GetString("codigo_zona"),
            NombreZona = reader.GetString("nombre_zona"),
            Nombre = reader.GetString("nombre"),

            AlturaTotal = reader.IsDBNull(
                reader.GetOrdinal("altura_total")
            )
                ? null
                : reader.GetInt32("altura_total"),

            Activo = reader.GetBoolean("activo")
        };
    }

    // Crea un rack dentro de una zona.
    public async Task<Rack?> CrearAsync(
        int idZona,
        string nombre,
        int? alturaTotal)
    {
        var nombreLimpio = nombre.Trim();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            INSERT INTO racks (
                id_zona,
                nombre,
                altura_total,
                activo
            )
            VALUES (
                @idZona,
                @nombre,
                @alturaTotal,
                TRUE
            );
            """;

        // Envía los datos mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@idZona",
            idZona
        );

        command.Parameters.AddWithValue(
            "@nombre",
            nombreLimpio
        );

        command.Parameters.AddWithValue(
            "@alturaTotal",
            alturaTotal.HasValue
                ? alturaTotal.Value
                : DBNull.Value
        );

        await command.ExecuteNonQueryAsync();

        var idRack =
            Convert.ToInt32(command.LastInsertedId);

        // Consulta el rack para incluir los datos de la zona.
        return await ObtenerPorIdAsync(idRack);
    }
}