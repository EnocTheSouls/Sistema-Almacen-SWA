using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las operaciones de materiales en MySQL.
public sealed class MaterialRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public MaterialRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todos los materiales ordenados por número de parte.
    public async Task<List<Material>> ObtenerTodosAsync()
    {
        var materiales = new List<Material>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_material,
                numero_parte_material,
                descripcion,
                unidad_medida,
                codigo_barras,
                serial_kits,
                generic_code,
                tipo_empaque,
                std_pack,
                activo
            FROM materiales
            ORDER BY numero_parte_material;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            materiales.Add(MapearMaterial(reader));
        }

        return materiales;
    }

    // Obtiene un material por su identificador.
    public async Task<Material?> ObtenerPorIdAsync(
        int idMaterial)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_material,
                numero_parte_material,
                descripcion,
                unidad_medida,
                codigo_barras,
                serial_kits,
                generic_code,
                tipo_empaque,
                std_pack,
                activo
            FROM materiales
            WHERE id_material = @idMaterial;
            """;

        command.Parameters.AddWithValue(
            "@idMaterial",
            idMaterial
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return MapearMaterial(reader);
    }

    // Obtiene un material por número de parte.
    public async Task<Material?> ObtenerPorNumeroParteAsync(
        string numeroParteMaterial)
    {
        var numeroParteLimpio =
            numeroParteMaterial.Trim().ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                id_material,
                numero_parte_material,
                descripcion,
                unidad_medida,
                codigo_barras,
                serial_kits,
                generic_code,
                tipo_empaque,
                std_pack,
                activo
            FROM materiales
            WHERE numero_parte_material = @numeroParteMaterial
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@numeroParteMaterial",
            numeroParteLimpio
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }


        return MapearMaterial(reader);
    }
    // Crea un material y devuelve el registro creado.
    public async Task<Material?> CrearAsync(
        string numeroParteMaterial,
        string descripcion,
        string? unidadMedida,
        string? codigoBarras,
        string? serialKits,
        string genericCode,
        string? tipoEmpaque,
        decimal? stdPack)
    {
        // Limpia y normaliza los datos.
        var numeroParteLimpio =
            numeroParteMaterial.Trim().ToUpperInvariant();

        var descripcionLimpia =
            descripcion.Trim();

        var unidadMedidaLimpia =
            string.IsNullOrWhiteSpace(unidadMedida)
                ? null
                : unidadMedida.Trim().ToUpperInvariant();

        var codigoBarrasLimpio =
            string.IsNullOrWhiteSpace(codigoBarras)
                ? null
                : codigoBarras.Trim();

        var serialKitsLimpio =
            string.IsNullOrWhiteSpace(serialKits)
                ? null
                : serialKits.Trim();

        var genericCodeLimpio =
            genericCode.Trim().ToUpperInvariant();

        var tipoEmpaqueLimpio =
            string.IsNullOrWhiteSpace(tipoEmpaque)
                ? null
                : tipoEmpaque.Trim().ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        INSERT INTO materiales (
            numero_parte_material,
            descripcion,
            unidad_medida,
            codigo_barras,
            serial_kits,
            generic_code,
            tipo_empaque,
            std_pack,
            activo
        )
        VALUES (
            @numeroParteMaterial,
            @descripcion,
            @unidadMedida,
            @codigoBarras,
            @serialKits,
            @genericCode,
            @tipoEmpaque,
            @stdPack,
            TRUE
        );
        """;

        command.Parameters.AddWithValue(
            "@numeroParteMaterial",
            numeroParteLimpio
        );

        command.Parameters.AddWithValue(
            "@descripcion",
            descripcionLimpia
        );

        command.Parameters.AddWithValue(
            "@unidadMedida",
            unidadMedidaLimpia is null
                ? DBNull.Value
                : unidadMedidaLimpia
        );

        command.Parameters.AddWithValue(
            "@codigoBarras",
            codigoBarrasLimpio is null
                ? DBNull.Value
                : codigoBarrasLimpio
        );

        command.Parameters.AddWithValue(
            "@serialKits",
            serialKitsLimpio is null
                ? DBNull.Value
                : serialKitsLimpio
        );

        command.Parameters.AddWithValue(
            "@genericCode",
            genericCodeLimpio
        );

        command.Parameters.AddWithValue(
            "@tipoEmpaque",
            tipoEmpaqueLimpio is null
                ? DBNull.Value
                : tipoEmpaqueLimpio
        );

        command.Parameters.AddWithValue(
            "@stdPack",
            stdPack.HasValue
                ? stdPack.Value
                : DBNull.Value
        );

        await command.ExecuteNonQueryAsync();

        var idMaterial =
            Convert.ToInt32(command.LastInsertedId);

        // Consulta el registro con los datos normalizados.
        return await ObtenerPorIdAsync(idMaterial);
    }


    // Convierte una fila de MySQL en un material.
    private static Material MapearMaterial(
        MySqlConnector.MySqlDataReader reader)
    {
        return new Material
        {
            IdMaterial =
                reader.GetInt32("id_material"),

            NumeroParteMaterial =
                reader.GetString("numero_parte_material"),

            Descripcion =
                reader.GetString("descripcion"),

            UnidadMedida = reader.IsDBNull(
                reader.GetOrdinal("unidad_medida")
            )
                ? null
                : reader.GetString("unidad_medida"),

            CodigoBarras = reader.IsDBNull(
                reader.GetOrdinal("codigo_barras")
            )
                ? null
                : reader.GetString("codigo_barras"),

            SerialKits = reader.IsDBNull(
                reader.GetOrdinal("serial_kits")
            )
                ? null
                : reader.GetString("serial_kits"),

            GenericCode =
                reader.GetString("generic_code"),

            TipoEmpaque = reader.IsDBNull(
                reader.GetOrdinal("tipo_empaque")
            )
                ? null
                : reader.GetString("tipo_empaque"),

            StdPack = reader.IsDBNull(
                reader.GetOrdinal("std_pack")
            )
                ? null
                : reader.GetDecimal("std_pack"),

            Activo =
                reader.GetBoolean("activo")
        };
    }
}
