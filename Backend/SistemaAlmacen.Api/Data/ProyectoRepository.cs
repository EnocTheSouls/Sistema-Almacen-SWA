using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de proyectos en MySQL.
public sealed class ProyectoRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public ProyectoRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los proyectos ordenados por nombre.
    public async Task<List<Proyecto>> ObtenerTodosAsync()
    {
        var proyectos = new List<Proyecto>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_proyecto,
                nombre,
                descripcion,
                activo
            FROM proyectos
            ORDER BY nombre;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en un objeto Proyecto.
        while (await reader.ReadAsync())
        {
            proyectos.Add(new Proyecto
            {
                IdProyecto =
                    reader.GetInt32("id_proyecto"),

                Nombre =
                    reader.GetString("nombre"),

                Descripcion = reader.IsDBNull(
                    reader.GetOrdinal("descripcion")
                )
                    ? null
                    : reader.GetString("descripcion"),

                Activo =
                    reader.GetBoolean("activo")
            });
        }

        return proyectos;
    }

    // Obtiene un proyecto por su identificador.
    public async Task<Proyecto?> ObtenerPorIdAsync(
        int idProyecto)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_proyecto,
                nombre,
                descripcion,
                activo
            FROM proyectos
            WHERE id_proyecto = @idProyecto
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@idProyecto",
            idProyecto
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null si el proyecto no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Proyecto
        {
            IdProyecto =
                reader.GetInt32("id_proyecto"),

            Nombre =
                reader.GetString("nombre"),

            Descripcion = reader.IsDBNull(
                reader.GetOrdinal("descripcion")
            )
                ? null
                : reader.GetString("descripcion"),

            Activo =
                reader.GetBoolean("activo")
        };
    }

    // Crea un proyecto y devuelve el registro creado.
    public async Task<Proyecto> CrearAsync(
        string nombre,
        string? descripcion)
    {
        var nombreLimpio =
            nombre.Trim();

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
            INSERT INTO proyectos (
                nombre,
                descripcion,
                activo
            )
            VALUES (
                @nombre,
                @descripcion,
                TRUE
            );
            """;

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

        var idProyecto =
            Convert.ToInt32(
                command.LastInsertedId
            );

        return new Proyecto
        {
            IdProyecto = idProyecto,
            Nombre = nombreLimpio,
            Descripcion = descripcionLimpia,
            Activo = true
        };
    }

    // Actualiza los datos o el estado de un proyecto.
    public async Task<bool> ActualizarAsync(
        int idProyecto,
        string nombre,
        string? descripcion,
        bool activo)
    {
        var nombreLimpio =
            nombre.Trim();

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
            UPDATE proyectos
            SET
                nombre = @nombre,
                descripcion = @descripcion,
                activo = @activo
            WHERE id_proyecto = @idProyecto;
            """;

        command.Parameters.AddWithValue(
            "@idProyecto",
            idProyecto
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

        command.Parameters.AddWithValue(
            "@activo",
            activo
        );

        var filasActualizadas =
            await command.ExecuteNonQueryAsync();

        return filasActualizadas > 0;
    }

    // Indica si el proyecto tiene familias asociadas.
    public async Task<bool> TieneFamiliasAsync(
        int idProyecto)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM familias
                WHERE id_proyecto = @idProyecto
            );
            """;

        command.Parameters.AddWithValue(
            "@idProyecto",
            idProyecto
        );

        var resultado =
            await command.ExecuteScalarAsync();

        if (resultado is null ||
            resultado is DBNull)
        {
            return false;
        }

        return Convert.ToInt32(resultado) == 1;
    }

    // Indica si el proyecto tiene otras relaciones
    // que impidan eliminarlo físicamente.
    public async Task<bool> TieneRelacionesAsync(
        int idProyecto)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM familias
                WHERE id_proyecto = @idProyecto

                UNION ALL

                SELECT 1
                FROM solicitudes
                WHERE id_proyecto = @idProyecto

                UNION ALL

                SELECT 1
                FROM zona_proyecto
                WHERE id_proyecto = @idProyecto

                UNION ALL

                SELECT 1
                FROM material_asignado_proyecto
                WHERE id_proyecto = @idProyecto
            );
            """;

        command.Parameters.AddWithValue(
            "@idProyecto",
            idProyecto
        );

        var resultado =
            await command.ExecuteScalarAsync();

        if (resultado is null ||
            resultado is DBNull)
        {
            return false;
        }

        return Convert.ToInt32(resultado) == 1;
    }



    // Comprueba si alguna familia del proyecto
    // se encuentra asignada a un rack.
    public async Task<bool> TieneRacksAsignadosAsync(
        int idProyecto)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT EXISTS (
            SELECT 1
            FROM racks AS r
            INNER JOIN familias AS f
                ON f.id_familia = r.id_familia
            WHERE f.id_proyecto = @idProyecto
        );
        """;

        command.Parameters.AddWithValue(
            "@idProyecto",
            idProyecto
        );

        var resultado =
            await command.ExecuteScalarAsync();

        if (resultado is null ||
            resultado is DBNull)
        {
            return false;
        }

        return Convert.ToInt32(resultado) == 1;
    }

    // Elimina físicamente un proyecto.
    // Este método debe ejecutarse solamente después
    // de comprobar que el proyecto no tiene relaciones.
    public async Task<bool> EliminarAsync(
        int idProyecto)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            DELETE FROM proyectos
            WHERE id_proyecto = @idProyecto;
            """;

        command.Parameters.AddWithValue(
            "@idProyecto",
            idProyecto
        );

        var filasEliminadas =
            await command.ExecuteNonQueryAsync();

        return filasEliminadas > 0;
    }
}