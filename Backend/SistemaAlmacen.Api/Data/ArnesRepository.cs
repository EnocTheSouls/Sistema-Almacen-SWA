using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de arneses en MySQL.
public sealed class ArnesRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public ArnesRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los arneses con su familia y proyecto.
    public async Task<List<Arnes>> ObtenerTodosAsync()
    {
        var arneses = new List<Arnes>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                a.id_arnes,
                a.id_familia,
                f.nombre AS nombre_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                a.numero_parte_arnes,
                a.descripcion,
                a.nivel_diseno,
                a.fecha_vigencia,
                a.activo
            FROM arneses AS a
            INNER JOIN familias AS f
                ON f.id_familia = a.id_familia
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            ORDER BY
                p.nombre,
                f.nombre,
                a.numero_parte_arnes;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        // Convierte cada registro en un objeto Arnes.
        while (await reader.ReadAsync())
        {
            arneses.Add(new Arnes
            {
                IdArnes = reader.GetInt32("id_arnes"),
                IdFamilia = reader.GetInt32("id_familia"),
                NombreFamilia =
                    reader.GetString("nombre_familia"),
                IdProyecto = reader.GetInt32("id_proyecto"),
                NombreProyecto =
                    reader.GetString("nombre_proyecto"),
                NumeroParteArnes =
                    reader.GetString("numero_parte_arnes"),
                Descripcion = reader.IsDBNull(
                    reader.GetOrdinal("descripcion")
                )
                    ? null
                    : reader.GetString("descripcion"),
                NivelDiseno =
                    reader.GetString("nivel_diseno"),
                FechaVigencia = reader.IsDBNull(
                    reader.GetOrdinal("fecha_vigencia")
                )
                    ? null
                    : DateOnly.FromDateTime(
                        reader.GetDateTime("fecha_vigencia")
                    ),
                Activo = reader.GetBoolean("activo")
            });
        }

        return arneses;
    }

    // Obtiene un arnés por su identificador.
    public async Task<Arnes?> ObtenerPorIdAsync(int idArnes)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                a.id_arnes,
                a.id_familia,
                f.nombre AS nombre_familia,
                f.id_proyecto,
                p.nombre AS nombre_proyecto,
                a.numero_parte_arnes,
                a.descripcion,
                a.nivel_diseno,
                a.fecha_vigencia,
                a.activo
            FROM arneses AS a
            INNER JOIN familias AS f
                ON f.id_familia = a.id_familia
            INNER JOIN proyectos AS p
                ON p.id_proyecto = f.id_proyecto
            WHERE a.id_arnes = @idArnes;
            """;

        // Envía el identificador mediante un parámetro seguro.
        command.Parameters.AddWithValue(
            "@idArnes",
            idArnes
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        // Devuelve null cuando el arnés no existe.
        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Arnes
        {
            IdArnes = reader.GetInt32("id_arnes"),
            IdFamilia = reader.GetInt32("id_familia"),
            NombreFamilia =
                reader.GetString("nombre_familia"),
            IdProyecto = reader.GetInt32("id_proyecto"),
            NombreProyecto =
                reader.GetString("nombre_proyecto"),
            NumeroParteArnes =
                reader.GetString("numero_parte_arnes"),
            Descripcion = reader.IsDBNull(
                reader.GetOrdinal("descripcion")
            )
                ? null
                : reader.GetString("descripcion"),
            NivelDiseno =
                reader.GetString("nivel_diseno"),
            FechaVigencia = reader.IsDBNull(
                reader.GetOrdinal("fecha_vigencia")
            )
                ? null
                : DateOnly.FromDateTime(
                    reader.GetDateTime("fecha_vigencia")
                ),
            Activo = reader.GetBoolean("activo")
        };
    }


    // Busca un arnés por número de parte y nivel de diseño.
    public async Task<Arnes?> ObtenerPorNumeroYDisenoAsync(
        string numeroParteArnes,
        string nivelDiseno)
    {
        var numeroParteLimpio =
            numeroParteArnes
                .Trim()
                .ToUpperInvariant();

        var nivelDisenoLimpio =
            nivelDiseno
                .Trim()
                .ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            id_arnes
        FROM arneses
        WHERE UPPER(
            TRIM(
                numero_parte_arnes
            )
        ) = @numeroParteArnes
          AND UPPER(
            TRIM(
                nivel_diseno
            )
        ) = @nivelDiseno
        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@numeroParteArnes",
            numeroParteLimpio
        );

        command.Parameters.AddWithValue(
            "@nivelDiseno",
            nivelDisenoLimpio
        );

        var resultado =
            await command.ExecuteScalarAsync();

        if (
            resultado is null ||
            resultado is DBNull
        )
        {
            return null;
        }

        return await ObtenerPorIdAsync(
            Convert.ToInt32(resultado)
        );
    }
    // Busca un arnés existente o lo crea durante la importación.
    public async Task<Arnes?> ObtenerOCrearAsync(
        int idFamilia,
        string numeroParteArnes,
        string nivelDiseno)
    {
        var numeroParteLimpio =
            numeroParteArnes
                .Trim()
                .ToUpperInvariant();

        var nivelDisenoLimpio =
            nivelDiseno
                .Trim()
                .ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            id_arnes,
            id_familia
        FROM arneses
        WHERE UPPER(numero_parte_arnes) =
              @numeroParteArnes
          AND UPPER(nivel_diseno) =
              @nivelDiseno
        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@numeroParteArnes",
            numeroParteLimpio
        );

        command.Parameters.AddWithValue(
            "@nivelDiseno",
            nivelDisenoLimpio
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (await reader.ReadAsync())
        {
            var idArnes =
                reader.GetInt32("id_arnes");

            var idFamiliaActual =
                reader.GetInt32("id_familia");

            if (idFamiliaActual != idFamilia)
            {
                throw new InvalidOperationException(
                    $"El arnés {numeroParteLimpio} ya pertenece a otra familia."
                );
            }

            await reader.DisposeAsync();

            return await ObtenerPorIdAsync(
                idArnes
            );
        }

        await reader.DisposeAsync();

        return await CrearAsync(
            idFamilia,
            numeroParteLimpio,
            "Creado automáticamente desde importación 5MF",
            nivelDisenoLimpio,
            null
        );
    }



    // Crea un arnés y devuelve el registro completo.
    public async Task<Arnes?> CrearAsync(
        int idFamilia,
        string numeroParteArnes,
        string? descripcion,
        string nivelDiseno,
        DateOnly? fechaVigencia)
    {
        // Limpia los datos antes de guardarlos.
        var numeroParteLimpio =
            numeroParteArnes.Trim();

        var descripcionLimpia =
            string.IsNullOrWhiteSpace(descripcion)
                ? null
                : descripcion.Trim();

        var nivelDisenoLimpio =
            nivelDiseno.Trim();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO arneses (
            id_familia,
            numero_parte_arnes,
            descripcion,
            nivel_diseno,
            fecha_vigencia,
            activo
        )
        VALUES (
            @idFamilia,
            @numeroParteArnes,
            @descripcion,
            @nivelDiseno,
            @fechaVigencia,
            TRUE
        );
        """;

        // Envía los valores mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        command.Parameters.AddWithValue(
            "@numeroParteArnes",
            numeroParteLimpio
        );

        command.Parameters.AddWithValue(
            "@descripcion",
            descripcionLimpia is null
                ? DBNull.Value
                : descripcionLimpia
        );

        command.Parameters.AddWithValue(
            "@nivelDiseno",
            nivelDisenoLimpio
        );

        command.Parameters.AddWithValue(
            "@fechaVigencia",
            fechaVigencia.HasValue
                ? fechaVigencia.Value.ToDateTime(
                    TimeOnly.MinValue
                )
                : DBNull.Value
        );

        await command.ExecuteNonQueryAsync();

        // Recupera el identificador generado por MySQL.
        var idArnes =
            Convert.ToInt32(command.LastInsertedId);

        // Consulta el registro para incluir familia y proyecto.
        return await ObtenerPorIdAsync(idArnes);
    }
    // Actualiza los datos de un arnés existente.
    public async Task<bool> ActualizarAsync(
        int idArnes,
        int idFamilia,
        string numeroParteArnes,
        string? descripcion,
        string nivelDiseno,
        DateOnly? fechaVigencia,
        bool activo)
    {
        // Limpia los datos antes de guardarlos.
        var numeroParteLimpio =
            numeroParteArnes.Trim();

        var descripcionLimpia =
            string.IsNullOrWhiteSpace(descripcion)
                ? null
                : descripcion.Trim();

        var nivelDisenoLimpio =
            nivelDiseno.Trim();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        UPDATE arneses
        SET
            id_familia = @idFamilia,
            numero_parte_arnes = @numeroParteArnes,
            descripcion = @descripcion,
            nivel_diseno = @nivelDiseno,
            fecha_vigencia = @fechaVigencia,
            activo = @activo
        WHERE id_arnes = @idArnes;
        """;

        // Envía los valores mediante parámetros seguros.
        command.Parameters.AddWithValue(
            "@idArnes",
            idArnes
        );

        command.Parameters.AddWithValue(
            "@idFamilia",
            idFamilia
        );

        command.Parameters.AddWithValue(
            "@numeroParteArnes",
            numeroParteLimpio
        );

        command.Parameters.AddWithValue(
            "@descripcion",
            descripcionLimpia is null
                ? DBNull.Value
                : descripcionLimpia
        );

        command.Parameters.AddWithValue(
            "@nivelDiseno",
            nivelDisenoLimpio
        );

        command.Parameters.AddWithValue(
            "@fechaVigencia",
            fechaVigencia.HasValue
                ? fechaVigencia.Value.ToDateTime(
                    TimeOnly.MinValue
                )
                : DBNull.Value
        );

        command.Parameters.AddWithValue(
            "@activo",
            activo
        );

        var filasActualizadas =
            await command.ExecuteNonQueryAsync();

        // Indica si el arnés fue actualizado.
        return filasActualizadas > 0;
    }

    // Obtiene los arneses activos agrupables por proyecto
    // para generar las listas de carga de IPS.
    public async Task<List<IpsProductRow>>
        ObtenerProductosParaIpsAsync()
    {
        var productos =
            new List<IpsProductRow>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT DISTINCT
            UPPER(
                TRIM(
                    p.nombre
                )
            ) AS proyecto,

            UPPER(
                TRIM(
                    a.numero_parte_arnes
                )
            ) AS product_number,

            UPPER(
                TRIM(
                    a.nivel_diseno
                )
            ) AS product_design
        FROM arneses AS a
        INNER JOIN familias AS f
            ON f.id_familia =
               a.id_familia
        INNER JOIN proyectos AS p
            ON p.id_proyecto =
               f.id_proyecto
        WHERE a.activo = TRUE
          AND f.activo = TRUE
          AND p.activo = TRUE
          AND TRIM(
              a.numero_parte_arnes
          ) <> ''
          AND TRIM(
              a.nivel_diseno
          ) <> ''
        ORDER BY
            proyecto,
            product_number,
            product_design;
        """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            productos.Add(
                new IpsProductRow
                {
                    Proyecto =
                        reader.GetString(
                            "proyecto"
                        ),

                    ProductNumber =
                        reader.GetString(
                            "product_number"
                        ),

                    ProductDesign =
                        reader.GetString(
                            "product_design"
                        )
                }
            );
        }

        return productos;
    }




    public async Task<Arnes?>
    ObtenerUnicoPorNumeroAsync(
        string numeroArnes)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            id_arnes,
            id_familia,
            numero_parte_arnes,
            nivel_diseno,
            activo
        FROM arneses
        WHERE UPPER(
            TRIM(numero_parte_arnes)
        ) = @numeroArnes
          AND activo = TRUE
        ORDER BY id_arnes;
        """;

        command.Parameters.AddWithValue(
            "@numeroArnes",
            numeroArnes
                .Trim()
                .ToUpperInvariant()
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        var encontrados =
            new List<Arnes>();

        while (await reader.ReadAsync())
        {
            encontrados.Add(
                new Arnes
                {
                    IdArnes =
                        reader.GetInt32(
                            "id_arnes"
                        ),

                    IdFamilia =
                        reader.GetInt32(
                            "id_familia"
                        ),

                    NumeroParteArnes =
                        reader.GetString(
                            "numero_parte_arnes"
                        ),

                    NivelDiseno =
                        reader.GetString(
                            "nivel_diseno"
                        ),

                    Activo =
                        reader.GetBoolean(
                            "activo"
                        )
                }
            );
        }

        // Si no existe o tiene varios diseños,
        // no se puede decidir automáticamente.
        return encontrados.Count == 1
            ? encontrados[0]
            : null;
    }
}