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
                IdProyecto = reader.GetInt32("id_proyecto"),
                Nombre = reader.GetString("nombre"),
                Descripcion = reader.IsDBNull(
                    reader.GetOrdinal("descripcion")
                )
                    ? null
                    : reader.GetString("descripcion"),
                Activo = reader.GetBoolean("activo")
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
            WHERE id_proyecto = @idProyecto;
            """;

        // Envía el identificador mediante un parámetro seguro.
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
            IdProyecto = reader.GetInt32("id_proyecto"),
            Nombre = reader.GetString("nombre"),
            Descripcion = reader.IsDBNull(
                reader.GetOrdinal("descripcion")
            )
                ? null
                : reader.GetString("descripcion"),
            Activo = reader.GetBoolean("activo")
        };

    }
    // Crea un proyecto y devuelve el registro creado.
    public async Task<Proyecto> CrearAsync(
        string nombre,
        string? descripcion)
    {
        // Limpia los datos antes de guardarlos.
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

        // Envía los datos mediante parámetros seguros.
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
        var idProyecto =
            Convert.ToInt32(command.LastInsertedId);

        return new Proyecto
        {
            IdProyecto = idProyecto,
            Nombre = nombreLimpio,
            Descripcion = descripcionLimpia,
            Activo = true
        };
    }
    // Actualiza los datos de un proyecto existente.
public async Task<bool> ActualizarAsync(
    int idProyecto,
    string nombre,
    string? descripcion,
    bool activo)
{
    // Limpia los datos antes de guardarlos.
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
        UPDATE proyectos
        SET
            nombre = @nombre,
            descripcion = @descripcion,
            activo = @activo
        WHERE id_proyecto = @idProyecto;
        """;

    // Envía los datos mediante parámetros seguros.
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

    // Indica si el proyecto fue actualizado.
    return filasActualizadas > 0;
}

}