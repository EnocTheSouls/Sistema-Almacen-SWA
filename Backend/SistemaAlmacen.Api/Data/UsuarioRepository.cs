using SistemaAlmacen.Api.Dtos;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las consultas de usuarios en MySQL.
public sealed class UsuarioRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public UsuarioRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los usuarios con el nombre de su rol.
    public async Task<List<UsuarioRespuestaDto>> ObtenerTodosAsync()
    {
        var usuarios = new List<UsuarioRespuestaDto>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                u.id_usuario,
                u.nombre,
                u.usuario,
                u.id_rol,
                r.nombre AS nombre_rol,
                u.activo,
                u.fecha_registro
            FROM usuarios AS u
            INNER JOIN roles AS r
                ON r.id_rol = u.id_rol
            ORDER BY u.nombre;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en una respuesta segura.
        while (await reader.ReadAsync())
        {
            usuarios.Add(new UsuarioRespuestaDto
            {
                IdUsuario = reader.GetInt32("id_usuario"),
                Nombre = reader.GetString("nombre"),
                NombreUsuario = reader.GetString("usuario"),
                IdRol = reader.GetInt32("id_rol"),
                NombreRol = reader.GetString("nombre_rol"),
                Activo = reader.GetBoolean("activo"),
                FechaRegistro = reader.GetDateTime(
                    "fecha_registro"
                )
            });
        }

        return usuarios;
    }
    // Obtiene un usuario por su identificador.
    public async Task<UsuarioRespuestaDto?> ObtenerPorIdAsync(
        int idUsuario)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            u.id_usuario,
            u.nombre,
            u.usuario,
            u.id_rol,
            r.nombre AS nombre_rol,
            u.activo,
            u.fecha_registro
        FROM usuarios AS u
        INNER JOIN roles AS r
            ON r.id_rol = u.id_rol
        WHERE u.id_usuario = @idUsuario;
        """;

        // Envía el identificador como parámetro seguro.
        command.Parameters.AddWithValue(
            "@idUsuario",
            idUsuario
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null cuando el usuario no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new UsuarioRespuestaDto
        {
            IdUsuario = reader.GetInt32("id_usuario"),
            Nombre = reader.GetString("nombre"),
            NombreUsuario = reader.GetString("usuario"),
            IdRol = reader.GetInt32("id_rol"),
            NombreRol = reader.GetString("nombre_rol"),
            Activo = reader.GetBoolean("activo"),
            FechaRegistro = reader.GetDateTime("fecha_registro")
        };
    }
// Obtiene los datos internos necesarios para validar el inicio de sesión.
public async Task<UsuarioLoginDto?> ObtenerParaLoginAsync(
    string nombreUsuario)
{
    await using var connection =
        _connectionFactory.CreateConnection();

    await connection.OpenAsync();

    await using var command =
        connection.CreateCommand();

    command.CommandText = """
        SELECT
            u.id_usuario,
            u.nombre,
            u.usuario,
            u.password_hash,
            u.id_rol,
            r.nombre AS nombre_rol,
            u.activo
        FROM usuarios AS u
        INNER JOIN roles AS r
            ON r.id_rol = u.id_rol
        WHERE u.usuario = @nombreUsuario
        LIMIT 1;
        """;

    // Busca al usuario mediante un parámetro seguro.
    command.Parameters.AddWithValue(
        "@nombreUsuario",
        nombreUsuario.Trim()
    );

    await using var reader =
        await command.ExecuteReaderAsync();

    // Devuelve null cuando el usuario no existe.
    if (!await reader.ReadAsync())
    {
        return null;
    }

    return new UsuarioLoginDto
    {
        IdUsuario = reader.GetInt32("id_usuario"),
        Nombre = reader.GetString("nombre"),
        NombreUsuario = reader.GetString("usuario"),
        PasswordHash = reader.GetString("password_hash"),
        IdRol = reader.GetInt32("id_rol"),
        NombreRol = reader.GetString("nombre_rol"),
        Activo = reader.GetBoolean("activo")
    };
}

// Obtiene los datos internos del usuario por su identificador.
public async Task<UsuarioLoginDto?> ObtenerParaLoginPorIdAsync(
    int idUsuario)
{
    await using var connection =
        _connectionFactory.CreateConnection();

    await connection.OpenAsync();

    await using var command =
        connection.CreateCommand();

    command.CommandText = """
        SELECT
            u.id_usuario,
            u.nombre,
            u.usuario,
            u.password_hash,
            u.id_rol,
            r.nombre AS nombre_rol,
            u.activo
        FROM usuarios AS u
        INNER JOIN roles AS r
            ON r.id_rol = u.id_rol
        WHERE u.id_usuario = @idUsuario
        LIMIT 1;
        """;

    // Envía el identificador mediante un parámetro seguro.
    command.Parameters.AddWithValue(
        "@idUsuario",
        idUsuario
    );

    await using var reader =
        await command.ExecuteReaderAsync();

    // Devuelve null cuando el usuario no existe.
    if (!await reader.ReadAsync())
    {
        return null;
    }

    return new UsuarioLoginDto
    {
        IdUsuario = reader.GetInt32("id_usuario"),
        Nombre = reader.GetString("nombre"),
        NombreUsuario = reader.GetString("usuario"),
        PasswordHash = reader.GetString("password_hash"),
        IdRol = reader.GetInt32("id_rol"),
        NombreRol = reader.GetString("nombre_rol"),
        Activo = reader.GetBoolean("activo")
    };
}

    // Guarda un usuario con la contraseña protegida.
    public async Task<int> CrearAsync(Usuario usuario)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO usuarios (
            nombre,
            usuario,
            password_hash,
            id_rol,
            activo
        )
        VALUES (
            @nombre,
            @nombreUsuario,
            @passwordHash,
            @idRol,
            @activo
        );
        """;

        // Envía los datos mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@nombre",
            usuario.Nombre.Trim()
        );

        command.Parameters.AddWithValue(
            "@nombreUsuario",
            usuario.NombreUsuario.Trim()
        );

        command.Parameters.AddWithValue(
            "@passwordHash",
            usuario.PasswordHash
        );

        command.Parameters.AddWithValue(
            "@idRol",
            usuario.IdRol
        );

        command.Parameters.AddWithValue(
            "@activo",
            usuario.Activo
        );

        await command.ExecuteNonQueryAsync();

        // Devuelve el identificador generado por MySQL.
        return Convert.ToInt32(
            command.LastInsertedId
        );
    }
    

    // Actualiza el hash de la contraseña de un usuario.
    public async Task<bool> ActualizarPasswordAsync(
        int idUsuario,
        string passwordHash)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            UPDATE usuarios
            SET password_hash = @passwordHash
            WHERE id_usuario = @idUsuario;
            """;

        // Envía los valores mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@passwordHash",
            passwordHash
        );

        command.Parameters.AddWithValue(
            "@idUsuario",
            idUsuario
        );

        var filasActualizadas =
            await command.ExecuteNonQueryAsync();

        return filasActualizadas > 0;
    }
}
