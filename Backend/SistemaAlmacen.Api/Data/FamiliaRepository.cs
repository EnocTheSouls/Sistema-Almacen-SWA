using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de familias en MySQL.
public sealed class FamiliaRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public FamiliaRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todas las familias con el nombre del proyecto.
    public async Task<List<Familia>> ObtenerTodasAsync()
    {
        var familias = new List<Familia>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                f.id_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                f.nombre,
                f.descripcion,
                f.activo
            FROM familias AS f
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            ORDER BY
                p.nombre,
                f.nombre;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en un objeto Familia.
        while (await reader.ReadAsync())
        {
            familias.Add(new Familia
            {
                IdFamilia = reader.GetInt32("id_familia"),
                IdProyecto = reader.GetInt32("id_proyecto"),
                NombreProyecto =
                    reader.GetString("nombre_proyecto"),
                Nombre = reader.GetString("nombre"),
                Descripcion = reader.IsDBNull(
                    reader.GetOrdinal("descripcion")
                )
                    ? null
                    : reader.GetString("descripcion"),
                Activo = reader.GetBoolean("activo")
            });
        }

        return familias;
    }

    // Obtiene una familia por su identificador.
    public async Task<Familia?> ObtenerPorIdAsync(
        int idFamilia)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                f.id_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                f.nombre,
                f.descripcion,
                f.activo
            FROM familias AS f
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            WHERE f.id_familia = @idFamilia;
            """;

        // Envía el identificador como parámetro seguro.
        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null cuando la familia no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Familia
        {
            IdFamilia = reader.GetInt32("id_familia"),
            IdProyecto = reader.GetInt32("id_proyecto"),
            NombreProyecto =
                reader.GetString("nombre_proyecto"),
            Nombre = reader.GetString("nombre"),
            Descripcion = reader.IsDBNull(
                reader.GetOrdinal("descripcion")
            )
                ? null
                : reader.GetString("descripcion"),
            Activo = reader.GetBoolean("activo")
        };
    }
    // Crea una familia y devuelve el registro creado.
    public async Task<Familia?> CrearAsync(
        int idProyecto,
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
        INSERT INTO familias (
            id_proyecto,
            nombre,
            descripcion,
            activo
        )
        VALUES (
            @idProyecto,
            @nombre,
            @descripcion,
            TRUE
        );
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

        await command.ExecuteNonQueryAsync();

        // Recupera el identificador generado por MySQL.
        var idFamilia =
            Convert.ToInt32(command.LastInsertedId);

        // Consulta nuevamente para incluir el nombre del proyecto.
        return await ObtenerPorIdAsync(idFamilia);
    }
    // Actualiza los datos de una familia existente.
    public async Task<bool> ActualizarAsync(
        int idFamilia,
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
        UPDATE familias
        SET
            id_proyecto = @idProyecto,
            nombre = @nombre,
            descripcion = @descripcion,
            activo = @activo
        WHERE id_familia = @idFamilia;
        """;

        // Envía los datos mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

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

        // Indica si la familia fue actualizada.
        return filasActualizadas > 0;
    }
}