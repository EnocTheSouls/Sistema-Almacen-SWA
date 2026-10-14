using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Data;

// Consulta las cajas o kits
// relacionados con los materiales.
public sealed class MaterialKitRepository
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public MaterialKitRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Busca un kit mediante
    // el serial escaneado.
    public async Task<MaterialKitDto?>
        ObtenerPorSerialAsync(
            string serialCaja)
    {
        var serialLimpio =
            serialCaja
                .Trim()
                .ToUpperInvariant();

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            mk.id_material_kit,
            mk.id_material,

            UPPER(
                TRIM(
                    m.numero_parte_material
                )
            ) AS numero_material,

            UPPER(
                TRIM(
                    mk.serial_caja
                )
            ) AS serial_caja,

            mk.numero_asn,
            mk.numero_camion,
            mk.numero_pallet,
            mk.localidad,
            mk.rack,
            mk.cantidad_inicial,
            mk.cantidad_disponible,
            mk.estado_origen,
            mk.ship_from,
            mk.estado_kit,
            mk.activo

        FROM material_kit AS mk

        INNER JOIN materiales AS m
            ON m.id_material =
               mk.id_material

        WHERE UPPER(
            TRIM(
                mk.serial_caja
            )
        ) = @serialCaja

          AND mk.activo = TRUE
          AND m.activo = TRUE

        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@serialCaja",
            serialLimpio
        );

        await using var reader =
            await command
                .ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return CrearDesdeReader(
            reader
        );
    }

    // Busca un kit por su
    // identificador interno.
    public async Task<MaterialKitDto?>
        ObtenerPorIdAsync(
            long idMaterialKit)
    {
        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            mk.id_material_kit,
            mk.id_material,

            UPPER(
                TRIM(
                    m.numero_parte_material
                )
            ) AS numero_material,

            UPPER(
                TRIM(
                    mk.serial_caja
                )
            ) AS serial_caja,

            mk.numero_asn,
            mk.numero_camion,
            mk.numero_pallet,
            mk.localidad,
            mk.rack,
            mk.cantidad_inicial,
            mk.cantidad_disponible,
            mk.estado_origen,
            mk.ship_from,
            mk.estado_kit,
            mk.activo

        FROM material_kit AS mk

        INNER JOIN materiales AS m
            ON m.id_material =
               mk.id_material

        WHERE mk.id_material_kit =
              @idMaterialKit

        LIMIT 1;
        """;

        command.Parameters.AddWithValue(
            "@idMaterialKit",
            idMaterialKit
        );

        await using var reader =
            await command
                .ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return CrearDesdeReader(
            reader
        );
    }

    // Convierte una fila de MySQL
    // en la respuesta del sistema.
    private static MaterialKitDto
        CrearDesdeReader(
            MySqlConnector.MySqlDataReader reader)
    {
        return new MaterialKitDto
        {
            IdMaterialKit =
                reader.GetInt64(
                    "id_material_kit"
                ),

            IdMaterial =
                reader.GetInt32(
                    "id_material"
                ),

            NumeroParteMaterial =
                reader.GetString(
                    "numero_material"
                ),

            SerialCaja =
                reader.GetString(
                    "serial_caja"
                ),

            NumeroAsn =
                ObtenerTextoOpcional(
                    reader,
                    "numero_asn"
                ),

            NumeroCamion =
                ObtenerTextoOpcional(
                    reader,
                    "numero_camion"
                ),

            NumeroPallet =
                ObtenerTextoOpcional(
                    reader,
                    "numero_pallet"
                ),

            Localidad =
                ObtenerTextoOpcional(
                    reader,
                    "localidad"
                ),

            Rack =
                ObtenerTextoOpcional(
                    reader,
                    "rack"
                ),

            CantidadInicial =
                reader.GetDecimal(
                    "cantidad_inicial"
                ),

            CantidadDisponible =
                reader.GetDecimal(
                    "cantidad_disponible"
                ),

            EstadoOrigen =
                ObtenerTextoOpcional(
                    reader,
                    "estado_origen"
                ),

            ShipFrom =
                ObtenerTextoOpcional(
                    reader,
                    "ship_from"
                ),

            EstadoKit =
                reader.GetString(
                    "estado_kit"
                ),

            Activo =
                reader.GetBoolean(
                    "activo"
                )
        };
    }

    private static string?
        ObtenerTextoOpcional(
            MySqlConnector.MySqlDataReader reader,
            string columna)
    {
        var indice =
            reader.GetOrdinal(
                columna
            );

        return reader.IsDBNull(indice)
            ? null
            : reader.GetString(indice);
    }
}