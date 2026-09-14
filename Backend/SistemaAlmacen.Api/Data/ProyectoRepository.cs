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
}