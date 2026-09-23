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
    // Busca una familia utilizando el nombre recibido del 5MF.
    public async Task<Familia?> ObtenerParaFiveMfAsync(
        string nombreFamilia,
        string? nombreProyecto)
    {
        var nombreLimpio =
            nombreFamilia
                .Trim()
                .ToUpperInvariant();

        var proyectoLimpio =
            string.IsNullOrWhiteSpace(
                nombreProyecto
            )
                ? null
                : nombreProyecto
                    .Trim()
                    .ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        // Busca equivalencia o coincidencia exacta.
        // Si se detectó proyecto, limita la búsqueda
        // a las familias de ese proyecto.
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
            ON p.id_proyecto =
               f.id_proyecto
        LEFT JOIN equivalencia_familia_5mf AS ef
            ON ef.id_familia =
               f.id_familia
           AND ef.activo = TRUE
        WHERE
            (
                UPPER(
                    TRIM(
                        ef.nombre_familia_5mf
                    )
                ) = @nombreFamilia
                OR
                UPPER(
                    TRIM(
                        f.nombre
                    )
                ) = @nombreFamilia
            )
            AND
            (
                @nombreProyecto IS NULL
                OR
                UPPER(
                    TRIM(
                        p.nombre
                    )
                ) = @nombreProyecto
            )
            AND f.activo = TRUE
        ORDER BY
            CASE
                WHEN UPPER(
                    TRIM(
                        ef.nombre_familia_5mf
                    )
                ) = @nombreFamilia
                THEN 1
                ELSE 2
            END,
            f.id_familia
        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@nombreFamilia",
            nombreLimpio
        );

        command.Parameters.AddWithValue(
            "@nombreProyecto",
            proyectoLimpio is null
                ? DBNull.Value
                : proyectoLimpio
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapearFamilia(reader);
    }

    // Busca una familia del 5MF o la crea
    // dentro del proyecto detectado.
    public async Task<Familia?>
        ObtenerOCrearParaFiveMfAsync(
            string nombreFamilia,
            string? nombreProyecto)
    {
        if (
            string.IsNullOrWhiteSpace(
                nombreProyecto
            )
        )
        {
            throw new InvalidOperationException(
                "No fue posible determinar el proyecto del 5MF."
            );
        }

        var nombreFamiliaLimpio =
            nombreFamilia
                .Trim()
                .ToUpperInvariant();

        var nombreProyectoLimpio =
            nombreProyecto
                .Trim()
                .ToUpperInvariant();

        // Primero busca una familia o equivalencia existente.
        var familiaExistente =
            await ObtenerParaFiveMfAsync(
                nombreFamiliaLimpio,
                nombreProyectoLimpio
            );

        if (familiaExistente is not null)
        {
            return familiaExistente;
        }

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        // Localiza el proyecto por su nombre.
        command.CommandText = """
        SELECT id_proyecto
        FROM proyectos
        WHERE UPPER(
            TRIM(nombre)
        ) = @nombreProyecto
          AND activo = TRUE
        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@nombreProyecto",
            nombreProyectoLimpio
        );

        var idProyectoResultado =
            await command.ExecuteScalarAsync();

        if (
            idProyectoResultado is null ||
            idProyectoResultado is DBNull
        )
        {
            throw new InvalidOperationException(
                $"El proyecto {nombreProyectoLimpio} no existe o está inactivo."
            );
        }

        var idProyecto =
            Convert.ToInt32(
                idProyectoResultado
            );

        // Crea la familia usando Code como nombre.
        return await CrearAsync(
            idProyecto,
            nombreFamiliaLimpio,
            "Familia creada automáticamente desde el archivo 5MF."
        );
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
