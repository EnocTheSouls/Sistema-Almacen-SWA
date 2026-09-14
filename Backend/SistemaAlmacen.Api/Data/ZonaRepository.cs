using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de zonas en MySQL.
public sealed class ZonaRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public ZonaRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todas las zonas ordenadas por código.
    public async Task<List<Zona>> ObtenerTodasAsync()
    {
        var zonas = new List<Zona>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_zona,
                codigo,
                nombre,
                descripcion,
                activo
            FROM zonas
            ORDER BY codigo;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en un objeto Zona.
        while (await reader.ReadAsync())
        {
            zonas.Add(new Zona
            {
                IdZona = reader.GetInt32("id_zona"),
                Codigo = reader.GetString("codigo"),
                Nombre = reader.GetString("nombre"),
                Descripcion = reader.IsDBNull(
                    reader.GetOrdinal("descripcion")
                )
                    ? null
                    : reader.GetString("descripcion"),
                Activo = reader.GetBoolean("activo")
            });
        }

        return zonas;
    }

    // Obtiene una zona por su identificador.
    public async Task<Zona?> ObtenerPorIdAsync(
        int idZona)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_zona,
                codigo,
                nombre,
                descripcion,
                activo
            FROM zonas
            WHERE id_zona = @idZona;
            """;

        // Envía el identificador como parámetro seguro.
        command.Parameters.AddWithValue(
            "@idZona",
            idZona
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null cuando la zona no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Zona
        {
            IdZona = reader.GetInt32("id_zona"),
            Codigo = reader.GetString("codigo"),
            Nombre = reader.GetString("nombre"),
            Descripcion = reader.IsDBNull(
                reader.GetOrdinal("descripcion")
            )
                ? null
                : reader.GetString("descripcion"),
            Activo = reader.GetBoolean("activo")
        };
    }


    // Crea una zona y devuelve el registro creado.
    public async Task<Zona> CrearAsync(
        string codigo,
        string nombre,
        string? descripcion)
    {
        // Limpia los datos antes de guardarlos.
        var codigoLimpio = codigo.Trim().ToUpperInvariant();
        var nombreLimpio = nombre.Trim();

        var descripcionLimpia =
            string.IsNullOrWhiteSpace(descripcion)
                ? null
                : descripcion.Trim();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO zonas (
            codigo,
            nombre,
            descripcion,
            activo
        )
        VALUES (
            @codigo,
            @nombre,
            @descripcion,
            TRUE
        );
        """;

        // Envía los datos mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@codigo",
            codigoLimpio
        );

        command.Parameters.AddWithValue(
            "@nombre",
            nombreLimpio
        );

        command.Parameters.AddWithValue(
            "@descripcion",
            descripcionLimpia is null
                ? DBNull.Value
                : descripcionLimpia
        );

        await command.ExecuteNonQueryAsync();

        // Recupera el identificador generado por MySQL.
        var idZona =
            Convert.ToInt32(command.LastInsertedId);

        return new Zona
        {
            IdZona = idZona,
            Codigo = codigoLimpio,
            Nombre = nombreLimpio,
            Descripcion = descripcionLimpia,
            Activo = true
        };
    }
}