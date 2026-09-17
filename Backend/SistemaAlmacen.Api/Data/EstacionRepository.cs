using MySqlConnector;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de estaciones en MySQL.
public sealed class EstacionRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public EstacionRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todas las estaciones con su familia y proyecto.
    public async Task<List<Estacion>> ObtenerTodasAsync()
    {
        var estaciones = new List<Estacion>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                e.id_estacion,
                e.id_familia,
                f.nombre AS nombre_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                e.nombre,
                e.activo
            FROM estaciones AS e
            INNER JOIN familias AS f
                ON f.id_familia = e.id_familia
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            ORDER BY
                p.nombre,
                f.nombre,
                e.nombre;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            estaciones.Add(
                MapearEstacion(reader)
            );
        }

        return estaciones;
    }

    // Obtiene una estación por su identificador.
    public async Task<Estacion?> ObtenerPorIdAsync(
        int idEstacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                e.id_estacion,
                e.id_familia,
                f.nombre AS nombre_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                e.nombre,
                e.activo
            FROM estaciones AS e
            INNER JOIN familias AS f
                ON f.id_familia = e.id_familia
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            WHERE e.id_estacion = @idEstacion
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapearEstacion(reader);
    }

    // Obtiene las estaciones asociadas a una familia.
    public async Task<List<Estacion>> ObtenerPorFamiliaAsync(
        int idFamilia)
    {
        var estaciones = new List<Estacion>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                e.id_estacion,
                e.id_familia,
                f.nombre AS nombre_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                e.nombre,
                e.activo
            FROM estaciones AS e
            INNER JOIN familias AS f
                ON f.id_familia = e.id_familia
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            WHERE e.id_familia = @idFamilia
            ORDER BY e.nombre;
            """;

        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            estaciones.Add(
                MapearEstacion(reader)
            );
        }

        return estaciones;
    }

    // Crea una estación y devuelve el registro creado.
    public async Task<Estacion?> CrearAsync(
        int idFamilia,
        string nombre)
    {
        var nombreLimpio =
            nombre.Trim().ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            INSERT INTO estaciones (
                id_familia,
                nombre,
                activo
            )
            VALUES (
                @idFamilia,
                @nombre,
                TRUE
            );
            """;

        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        command.Parameters.AddWithValue(
            "@nombre",
            nombreLimpio
        );

        await command.ExecuteNonQueryAsync();

        var idEstacion =
            Convert.ToInt32(command.LastInsertedId);

        return await ObtenerPorIdAsync(
            idEstacion
        );
    }

    // Actualiza los datos permitidos de una estación.
    public async Task<Estacion?> ActualizarAsync(
        int idEstacion,
        int idFamilia,
        string nombre,
        bool activo)
    {
        var nombreLimpio =
            nombre.Trim().ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE estaciones
            SET
                id_familia = @idFamilia,
                nombre = @nombre,
                activo = @activo
            WHERE id_estacion = @idEstacion;
            """;

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        command.Parameters.AddWithValue(
            "@nombre",
            nombreLimpio
        );

        command.Parameters.AddWithValue(
            "@activo",
            activo
        );

        var filasAfectadas =
            await command.ExecuteNonQueryAsync();

        if (filasAfectadas == 0)
        {
            return null;
        }

        return await ObtenerPorIdAsync(
            idEstacion
        );
    }

    // Activa o desactiva una estación.
    public async Task<bool> CambiarEstadoAsync(
        int idEstacion,
        bool activo)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE estaciones
            SET activo = @activo
            WHERE id_estacion = @idEstacion;
            """;

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        command.Parameters.AddWithValue(
            "@activo",
            activo
        );

        var filasAfectadas =
            await command.ExecuteNonQueryAsync();

        return filasAfectadas > 0;
    }
    // Comprueba si la estación tiene solicitudes relacionadas.
    public async Task<bool> TieneRelacionesAsync(
        int idEstacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM solicitudes
                WHERE id_estacion = @idEstacion
            );
            """;

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        var resultado =
            await command.ExecuteScalarAsync();

        if (resultado is null ||
            resultado is DBNull)
        {
            return false;
        }

        return Convert.ToInt32(
            resultado
        ) == 1;
    }

    // Elimina físicamente una estación.
    // Debe llamarse después de comprobar
    // que no tenga solicitudes relacionadas.
    public async Task<bool> EliminarAsync(
        int idEstacion)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            DELETE FROM estaciones
            WHERE id_estacion = @idEstacion;
            """;

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        var filasEliminadas =
            await command.ExecuteNonQueryAsync();

        return filasEliminadas > 0;
    }


    // Convierte una fila de MySQL en una estación.
    private static Estacion MapearEstacion(
        MySqlDataReader reader)
    {
        return new Estacion
        {
            IdEstacion =
                reader.GetInt32("id_estacion"),

            IdFamilia =
                reader.GetInt32("id_familia"),

            NombreFamilia =
                reader.GetString("nombre_familia"),

            IdProyecto =
                reader.GetInt32("id_proyecto"),

            NombreProyecto =
                reader.GetString("nombre_proyecto"),

            Nombre =
                reader.GetString("nombre"),

            Activo =
                reader.GetBoolean("activo")
        };
    }
}