namespace SistemaAlmacen.Api.Data;

// Administra la relación directa
// entre materiales y estaciones.
public sealed class MaterialEstacionRepository
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public MaterialEstacionRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Obtiene las estaciones activas
    // relacionadas directamente con un material.
    public async Task<
        List<MaterialEstacionRelacionDto>>
        ObtenerPorMaterialAsync(
            int idMaterial)
    {
        var relaciones =
            new List<
                MaterialEstacionRelacionDto
            >();

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            me.id_material_estacion,

            me.id_material,

            UPPER(
                TRIM(
                    m.numero_parte_material
                )
            ) AS numero_material,

            TRIM(
                m.descripcion
            ) AS descripcion,

            me.id_estacion,

            UPPER(
                TRIM(
                    e.nombre
                )
            ) AS estacion,

            e.id_familia,

            UPPER(
                TRIM(
                    f.nombre
                )
            ) AS familia,

            me.activo

        FROM material_estacion AS me

        INNER JOIN materiales AS m
            ON m.id_material =
               me.id_material

        INNER JOIN estaciones AS e
            ON e.id_estacion =
               me.id_estacion

        INNER JOIN familias AS f
            ON f.id_familia =
               e.id_familia

        WHERE me.id_material =
              @idMaterial

          AND me.activo =
              TRUE

          AND m.activo =
              TRUE

          AND e.activo =
              TRUE

        ORDER BY
            estacion;
        """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            relaciones.Add(
                CrearRelacionDesdeReader(
                    reader
                )
            );
        }

        return relaciones;
    }

    // Obtiene una relación usando
    // su identificador único.
    public async Task<
        MaterialEstacionRelacionDto?>
        ObtenerPorIdAsync(
            int idMaterialEstacion)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            me.id_material_estacion,

            me.id_material,

            UPPER(
                TRIM(
                    m.numero_parte_material
                )
            ) AS numero_material,

            TRIM(
                m.descripcion
            ) AS descripcion,

            me.id_estacion,

            UPPER(
                TRIM(
                    e.nombre
                )
            ) AS estacion,

            e.id_familia,

            UPPER(
                TRIM(
                    f.nombre
                )
            ) AS familia,

            me.activo

        FROM material_estacion AS me

        INNER JOIN materiales AS m
            ON m.id_material =
               me.id_material

        INNER JOIN estaciones AS e
            ON e.id_estacion =
               me.id_estacion

        INNER JOIN familias AS f
            ON f.id_familia =
               e.id_familia

        WHERE me.id_material_estacion =
              @idMaterialEstacion

          AND me.activo =
              TRUE

          AND m.activo =
              TRUE

          AND e.activo =
              TRUE

        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@idMaterialEstacion",
            idMaterialEstacion
        );

        await using var reader =
            await command
                .ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return CrearRelacionDesdeReader(
            reader
        );
    }

    // Agrega o reactiva una estación
    // para el material seleccionado.
    public async Task<
        MaterialEstacionRelacionDto?>
        AgregarAsync(
            int idMaterial,
            int idEstacion)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO material_estacion (
            id_material,
            id_estacion,
            activo
        )
        SELECT
            m.id_material,
            e.id_estacion,
            TRUE

        FROM materiales AS m

        INNER JOIN estaciones AS e
            ON e.id_estacion =
               @idEstacion

        WHERE m.id_material =
              @idMaterial

          AND m.activo =
              TRUE

          AND e.activo =
              TRUE

        ON DUPLICATE KEY UPDATE
            activo =
                TRUE,

            fecha_actualizacion =
                CURRENT_TIMESTAMP;
        """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        var filasAfectadas =
            await command
                .ExecuteNonQueryAsync();

        if (filasAfectadas <= 0)
        {
            return null;
        }

        return await ObtenerPorMaterialYEstacionAsync(
            idMaterial,
            idEstacion
        );
    }

    // Desactiva la relación sin eliminar
    // el material ni la estación.
    public async Task<bool>
        QuitarAsync(
            int idMaterial,
            int idEstacion)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        UPDATE material_estacion
        SET
            activo =
                FALSE,

            fecha_actualizacion =
                CURRENT_TIMESTAMP

        WHERE id_material =
              @idMaterial

          AND id_estacion =
              @idEstacion

          AND activo =
              TRUE;
        """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        command.Parameters.AddWithValue(
            "@idEstacion",
            idEstacion
        );

        var filasAfectadas =
            await command
                .ExecuteNonQueryAsync();

        return filasAfectadas > 0;
    }

    // Consulta una combinación concreta.
    private async Task<
        MaterialEstacionRelacionDto?>
        ObtenerPorMaterialYEstacionAsync(
            int idMaterial,
            int idEstacion)
    {
        var relaciones =
            await ObtenerPorMaterialAsync(
                idMaterial
            );

        return relaciones.FirstOrDefault(
            relacion =>
                relacion.IdEstacion ==
                idEstacion
        );
    }

    // Convierte una fila de MySQL
    // en la respuesta del sistema.
    private static
        MaterialEstacionRelacionDto
        CrearRelacionDesdeReader(
            MySqlConnector.MySqlDataReader reader)
    {
        var idMaterialEstacion =
            reader.GetInt32(
                "id_material_estacion"
            );

        return new MaterialEstacionRelacionDto
        {
            IdMaterialEstacion =
                idMaterialEstacion,

            IdMaterial =
                reader.GetInt32(
                    "id_material"
                ),

            NumeroParteMaterial =
                reader.GetString(
                    "numero_material"
                ),

            Descripcion =
                reader.GetString(
                    "descripcion"
                ),

            IdEstacion =
                reader.GetInt32(
                    "id_estacion"
                ),

            Estacion =
                reader.GetString(
                    "estacion"
                ),

            IdFamilia =
                reader.GetInt32(
                    "id_familia"
                ),

            Familia =
                reader.GetString(
                    "familia"
                ),

            Activo =
                reader.GetBoolean(
                    "activo"
                ),

            // QR nuevo basado en la relación
            // directa material-estación.
            ContenidoQr =
                $"SWA|V=2|ME={idMaterialEstacion}"
        };
    }
}

// Información de una relación
// directa material-estación.
public sealed class MaterialEstacionRelacionDto
{
    public int IdMaterialEstacion
    {
        get;
        set;
    }

    public int IdMaterial
    {
        get;
        set;
    }

    public string NumeroParteMaterial
    {
        get;
        set;
    } = string.Empty;

    public string Descripcion
    {
        get;
        set;
    } = string.Empty;

    public int IdEstacion
    {
        get;
        set;
    }

    public string Estacion
    {
        get;
        set;
    } = string.Empty;

    public int IdFamilia
    {
        get;
        set;
    }

    public string Familia
    {
        get;
        set;
    } = string.Empty;

    public bool Activo
    {
        get;
        set;
    }

    public string ContenidoQr
    {
        get;
        set;
    } = string.Empty;
}