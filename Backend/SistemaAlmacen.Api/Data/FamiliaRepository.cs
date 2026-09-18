using MySqlConnector;
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
        var familias =
            new List<Familia>();

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

        while (await reader.ReadAsync())
        {
            familias.Add(
                MapearFamilia(reader)
            );
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
            WHERE f.id_familia = @idFamilia
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapearFamilia(reader);
    }

    // Crea una familia asociada a un proyecto.
    public async Task<Familia?> CrearAsync(
        int idProyecto,
        string nombre,
        string? descripcion)
    {
        var nombreLimpio =
            nombre.Trim();

        var descripcionLimpia =
            string.IsNullOrWhiteSpace(
                descripcion
            )
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

        var idFamilia =
            Convert.ToInt32(
                command.LastInsertedId
            );

        // Consulta la familia nuevamente
        // para incluir el nombre del proyecto.
        return await ObtenerPorIdAsync(
            idFamilia
        );
    }

    // Actualiza los datos o el estado de una familia.
    public async Task<bool> ActualizarAsync(
        int idFamilia,
        int idProyecto,
        string nombre,
        string? descripcion,
        bool activo)
    {
        var nombreLimpio =
            nombre.Trim();

        var descripcionLimpia =
            string.IsNullOrWhiteSpace(
                descripcion
            )
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

        return filasActualizadas > 0;
    }

    // Elimina una familia y sus registros dependientes.
    // Las solicitudes conservan sus nombres históricos.
    public async Task<bool> EliminarAsync(
        int idFamilia)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            // Desvincula la familia de los racks.
            // Los racks físicos no se eliminan.
            await using (var rackCommand =
                connection.CreateCommand())
            {
                rackCommand.Transaction =
                    transaction;

                rackCommand.CommandText = """
                    UPDATE racks
                    SET id_familia = NULL
                    WHERE id_familia = @idFamilia;
                    """;

                rackCommand.Parameters.AddWithValue(
                    "@idFamilia",
                    idFamilia
                );

                await rackCommand
                    .ExecuteNonQueryAsync();
            }

            // Elimina las estaciones de la familia.
            // Las solicitudes conservarán
            // nombre_estacion_historico.
            await using (var estacionesCommand =
                connection.CreateCommand())
            {
                estacionesCommand.Transaction =
                    transaction;

                estacionesCommand.CommandText = """
                    DELETE FROM estaciones
                    WHERE id_familia = @idFamilia;
                    """;

                estacionesCommand.Parameters.AddWithValue(
                    "@idFamilia",
                    idFamilia
                );

                await estacionesCommand
                    .ExecuteNonQueryAsync();
            }

            // Elimina los arneses pertenecientes
            // a la familia.
            await using (var arnesesCommand =
                connection.CreateCommand())
            {
                arnesesCommand.Transaction =
                    transaction;

                arnesesCommand.CommandText = """
                    DELETE FROM arneses
                    WHERE id_familia = @idFamilia;
                    """;

                arnesesCommand.Parameters.AddWithValue(
                    "@idFamilia",
                    idFamilia
                );

                await arnesesCommand
                    .ExecuteNonQueryAsync();
            }

            int filasEliminadas;

            // Elimina finalmente la familia.
            // MySQL pondrá solicitudes.id_familia
            // en NULL mediante ON DELETE SET NULL.
            await using (var familiaCommand =
                connection.CreateCommand())
            {
                familiaCommand.Transaction =
                    transaction;

                familiaCommand.CommandText = """
                    DELETE FROM familias
                    WHERE id_familia = @idFamilia;
                    """;

                familiaCommand.Parameters.AddWithValue(
                    "@idFamilia",
                    idFamilia
                );

                filasEliminadas =
                    await familiaCommand
                        .ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            return filasEliminadas > 0;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    // Convierte una fila de MySQL
    // en un objeto Familia.
    private static Familia MapearFamilia(
        MySqlDataReader reader)
    {
        return new Familia
        {
            IdFamilia =
                reader.GetInt32(
                    "id_familia"
                ),

            IdProyecto =
                reader.GetInt32(
                    "id_proyecto"
                ),

            NombreProyecto =
                reader.GetString(
                    "nombre_proyecto"
                ),

            Nombre =
                reader.GetString(
                    "nombre"
                ),

            Descripcion = reader.IsDBNull(
                reader.GetOrdinal(
                    "descripcion"
                )
            )
                ? null
                : reader.GetString(
                    "descripcion"
                ),

            Activo =
                reader.GetBoolean(
                    "activo"
                )
        };
    }
}
