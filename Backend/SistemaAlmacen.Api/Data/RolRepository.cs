using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de roles en MySQL.
public sealed class RolRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public RolRepository(MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los roles ordenados por nombre.
    public async Task<List<Rol>> ObtenerTodosAsync()
    {
        var roles = new List<Rol>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_rol,
                nombre,
                descripcion
            FROM roles
            ORDER BY nombre;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro de MySQL en un objeto Rol.
        while (await reader.ReadAsync())
        {
            roles.Add(new Rol
            {
                IdRol = reader.GetInt32("id_rol"),
                Nombre = reader.GetString("nombre"),
                Descripcion = reader.IsDBNull(
                    reader.GetOrdinal("descripcion")
                )
                    ? null
                    : reader.GetString("descripcion")
            });
        }

        return roles;
    }

    // Busca un rol por su identificador.
    public async Task<Rol?> ObtenerPorIdAsync(int idRol)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_rol,
                nombre,
                descripcion
            FROM roles
            WHERE id_rol = @idRol;
            """;

        // Envía el identificador como parámetro seguro.
        command.Parameters.AddWithValue(
            "@idRol",
            idRol
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null cuando el rol no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Rol
        {
            IdRol = reader.GetInt32("id_rol"),
            Nombre = reader.GetString("nombre"),
            Descripcion = reader.IsDBNull(
                reader.GetOrdinal("descripcion")
            )
                ? null
                : reader.GetString("descripcion")
        };
    }

    // Inserta un rol y devuelve el registro creado.
    public async Task<Rol> CrearAsync(
        string nombre,
        string? descripcion)
    {
        // Limpia los espacios antes de guardar.
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
            INSERT INTO roles (
                nombre,
                descripcion
            )
            VALUES (
                @nombre,
                @descripcion
            );
            """;

        command.Parameters.AddWithValue(
            "@nombre",
            nombreLimpio
        );

        // Guarda NULL cuando no se proporciona descripción.
        command.Parameters.AddWithValue(
            "@descripcion",
            descripcionLimpia is null
                ? DBNull.Value
                : descripcionLimpia
        );

        await command.ExecuteNonQueryAsync();

        // Recupera el identificador generado por MySQL.
        var idRol = Convert.ToInt32(
            command.LastInsertedId
        );

        return new Rol
        {
            IdRol = idRol,
            Nombre = nombreLimpio,
            Descripcion = descripcionLimpia
        };
    }

    // Actualiza los datos de un rol existente.
    public async Task<bool> ActualizarAsync(
        int idRol,
        string nombre,
        string? descripcion)
    {
        // Normaliza los datos antes de actualizarlos.
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
            UPDATE roles
            SET
                nombre = @nombre,
                descripcion = @descripcion
            WHERE id_rol = @idRol;
            """;

        command.Parameters.AddWithValue(
            "@idRol",
            idRol
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

        var filasAfectadas =
            await command.ExecuteNonQueryAsync();

        // Devuelve true si el rol fue actualizado.
        return filasAfectadas > 0;
    }

    // Verifica si el rol está asignado a uno o más usuarios.
    public async Task<bool> EstaAsignadoAUsuariosAsync(int idRol)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT EXISTS (
                SELECT 1
                FROM usuarios
                WHERE id_rol = @idRol
            );
            """;

        command.Parameters.AddWithValue(
            "@idRol",
            idRol
        );

        var resultado =
            await command.ExecuteScalarAsync();

        // Convierte el resultado de EXISTS en verdadero o falso.
        return Convert.ToBoolean(resultado);
    }

    // Elimina un rol por su identificador.
    public async Task<bool> EliminarAsync(int idRol)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            DELETE FROM roles
            WHERE id_rol = @idRol;
            """;

        command.Parameters.AddWithValue(
            "@idRol",
            idRol
        );

        var filasAfectadas =
            await command.ExecuteNonQueryAsync();

        // Devuelve true si el rol fue eliminado.
        return filasAfectadas > 0;
    }
}