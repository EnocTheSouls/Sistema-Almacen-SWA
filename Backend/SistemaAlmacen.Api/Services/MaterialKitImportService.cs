using ClosedXML.Excel;
using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Importa cajas o kits desde
// el reporte PICSFR010.
public sealed class MaterialKitImportService
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public MaterialKitImportService(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    public async Task<MaterialKitImportResult>
        ImportarAsync(
            Stream archivo,
            string nombreArchivo)
    {
        var resultado =
            new MaterialKitImportResult
            {
                NombreArchivo =
                    nombreArchivo
            };

        using var workbook =
            new XLWorkbook(archivo);

        var hojas =
            workbook.Worksheets
                .Where(
                    hoja =>
                        hoja.Name.Equals(
                            "PICSFR010",
                            StringComparison
                                .OrdinalIgnoreCase
                        ) ||
                        hoja.Name.Equals(
                            "PICSFR010_1",
                            StringComparison
                                .OrdinalIgnoreCase
                        )
                )
                .ToList();

        if (hojas.Count == 0)
        {
            throw new InvalidOperationException(
                "El archivo no contiene las hojas PICSFR010 o PICSFR010_1."
            );
        }

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var transaction =
            await connection
                .BeginTransactionAsync();

        try
        {
            // Localiza el material usando
            // el número de parte importado.
            await using var buscarMaterialCommand =
                connection.CreateCommand();

            buscarMaterialCommand.Transaction =
                transaction;

            buscarMaterialCommand.CommandText = """
            SELECT
                id_material
            FROM materiales
            WHERE UPPER(
                TRIM(
                    numero_parte_material
                )
            ) = @numeroMaterial
              AND activo = TRUE
            LIMIT 1;
            """;

            buscarMaterialCommand.Parameters
                .Add(
                    "@numeroMaterial",
                    MySqlDbType.VarChar
                );

            // Consulta si el serial ya existe.
            await using var buscarKitCommand =
                connection.CreateCommand();

            buscarKitCommand.Transaction =
                transaction;

            buscarKitCommand.CommandText = """
            SELECT
                id_material_kit,
                id_material,
                cantidad_inicial,
                cantidad_disponible,

                EXISTS (
                    SELECT 1
                    FROM material_kit_movimiento
                    WHERE id_material_kit =
                          material_kit.id_material_kit
                    LIMIT 1
                ) AS tiene_movimientos

            FROM material_kit
            WHERE UPPER(
                TRIM(
                    serial_caja
                )
            ) = @serialCaja
            LIMIT 1;
            """;

            buscarKitCommand.Parameters.Add(
                "@serialCaja",
                MySqlDbType.VarChar
            );

            // Inserta un kit nuevo.
            await using var insertarKitCommand =
                connection.CreateCommand();

            insertarKitCommand.Transaction =
                transaction;

            insertarKitCommand.CommandText = """
            INSERT INTO material_kit (
                id_material,
                serial_caja,
                numero_asn,
                numero_camion,
                numero_pallet,
                localidad,
                rack,
                cantidad_inicial,
                cantidad_disponible,
                estado_origen,
                ship_from,
                estado_kit,
                activo
            )
            VALUES (
                @idMaterial,
                @serialCaja,
                @numeroAsn,
                @numeroCamion,
                @numeroPallet,
                @localidad,
                @rack,
                @cantidadInicial,
                @cantidadDisponible,
                @estadoOrigen,
                @shipFrom,
                'DISPONIBLE',
                TRUE
            );
            """;

            AgregarParametrosKit(
                insertarKitCommand
            );

            // Actualiza información general.
            // No restaura la cantidad disponible.
            await using var actualizarKitCommand =
                connection.CreateCommand();

            actualizarKitCommand.Transaction =
                transaction;

            actualizarKitCommand.CommandText = """
            UPDATE material_kit
            SET
                numero_asn =
                    @numeroAsn,

                numero_camion =
                    @numeroCamion,

                numero_pallet =
                    @numeroPallet,

                localidad =
                    @localidad,

                rack =
                    @rack,

                estado_origen =
                    @estadoOrigen,

                ship_from =
                    @shipFrom,

                activo =
                    TRUE

            WHERE id_material_kit =
                  @idMaterialKit;
            """;

            actualizarKitCommand.Parameters.Add(
                "@idMaterialKit",
                MySqlDbType.Int64
            );

            actualizarKitCommand.Parameters.Add(
                "@numeroAsn",
                MySqlDbType.VarChar
            );

            actualizarKitCommand.Parameters.Add(
                "@numeroCamion",
                MySqlDbType.VarChar
            );

            actualizarKitCommand.Parameters.Add(
                "@numeroPallet",
                MySqlDbType.VarChar
            );

            actualizarKitCommand.Parameters.Add(
                "@localidad",
                MySqlDbType.VarChar
            );

            actualizarKitCommand.Parameters.Add(
                "@rack",
                MySqlDbType.VarChar
            );

            actualizarKitCommand.Parameters.Add(
                "@estadoOrigen",
                MySqlDbType.VarChar
            );

            actualizarKitCommand.Parameters.Add(
                "@shipFrom",
                MySqlDbType.VarChar
            );
            // Evita consultar repetidamente
            // el mismo material en MySQL.
            var cacheMateriales =
                new Dictionary<string, int?>(
                    StringComparer.OrdinalIgnoreCase
                );

            foreach (var worksheet in hojas)
            {
                await ProcesarHojaAsync(
                    worksheet,
                    resultado,
                    buscarMaterialCommand,
                    buscarKitCommand,
                    insertarKitCommand,
                    actualizarKitCommand,
                    cacheMateriales
                );
                            }

            await transaction.CommitAsync();

            return resultado;
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    private static async Task
    ProcesarHojaAsync(
        IXLWorksheet worksheet,
        MaterialKitImportResult resultado,
        MySqlCommand buscarMaterialCommand,
        MySqlCommand buscarKitCommand,
        MySqlCommand insertarKitCommand,
        MySqlCommand actualizarKitCommand,
        Dictionary<string, int?>
            cacheMateriales)
    {
        var filaEncabezados =
            worksheet.FirstRowUsed();

        if (filaEncabezados is null)
        {
            return;
        }

        var columnas =
            ObtenerColumnas(
                filaEncabezados
            );

        ValidarColumnasObligatorias(
            columnas
        );

        var primeraFilaDatos =
            filaEncabezados.RowNumber() + 1;

        var ultimaFila =
            worksheet.LastRowUsed()
                ?.RowNumber() ??
            primeraFilaDatos - 1;

        for (
            var numeroFila =
                primeraFilaDatos;

            numeroFila <= ultimaFila;

            numeroFila++
        )
        {
            var fila =
                worksheet.Row(
                    numeroFila
                );

            if (fila.IsEmpty())
            {
                continue;
            }

            resultado.TotalFilas++;
            if (
                resultado.TotalFilas % 1000 == 0
)
            {
                Console.WriteLine(
                    $"Kits procesados: " +
                    $"{resultado.TotalFilas:N0}"
                );
            }

            try
            {
                var serialCaja =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "SERIALDECAJA"
                    )
                    .ToUpperInvariant();

                var numeroMaterial =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "MATERIALNO"
                    )
                    .ToUpperInvariant();

                var cantidad =
                    ObtenerDecimal(
                        fila,
                        columnas,
                        "CANTIDAD"
                    );

                if (
                    string.IsNullOrWhiteSpace(
                        serialCaja
                    )
                )
                {
                    throw new InvalidOperationException(
                        "Serial de Caja está vacío."
                    );
                }

                if (
                    serialCaja.Length > 100
                )
                {
                    throw new InvalidOperationException(
                        "Serial de Caja excede 100 caracteres."
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        numeroMaterial
                    )
                )
                {
                    throw new InvalidOperationException(
                        "Material No. está vacío."
                    );
                }

                if (cantidad <= 0)
                {
                    throw new InvalidOperationException(
                        "Cantidad debe ser mayor que cero."
                    );
                }
                // Primero revisa la memoria para evitar
                // consultar repetidamente el mismo material.
                if (
                    !cacheMateriales.TryGetValue(
                        numeroMaterial,
                        out var idMaterial
                    )
                )
                {
                    idMaterial =
                        await ObtenerIdMaterialAsync(
                            buscarMaterialCommand,
                            numeroMaterial
                        );

                    cacheMateriales[
                        numeroMaterial
                    ] =
                        idMaterial;
                }
                if (!idMaterial.HasValue)
                {
                    throw new InvalidOperationException(
                        $"El material {numeroMaterial} no existe en el catálogo."
                    );
                }

                var kitExistente =
                    await ObtenerKitExistenteAsync(
                        buscarKitCommand,
                        serialCaja
                    );

                var datos =
                    new DatosMaterialKit
                    {
                        IdMaterial =
                            idMaterial.Value,

                        SerialCaja =
                            serialCaja,

                        NumeroAsn =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "NOASN"
                            ),

                        NumeroCamion =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "NODECAMION"
                            ),

                        NumeroPallet =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "NODEPALLET"
                            ),

                        Localidad =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "LOCALIDAD"
                            ),

                        Rack =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "RACK"
                            ),

                        Cantidad =
                            cantidad,

                        EstadoOrigen =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "ESTADO"
                            ),

                        ShipFrom =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "SHIPFROM"
                            )
                    };

                if (kitExistente is null)
                {
                    AsignarParametrosInsercion(
                        insertarKitCommand,
                        datos
                    );

                    await insertarKitCommand
                        .ExecuteNonQueryAsync();

                    resultado.KitsCreados++;
                    resultado.FilasCorrectas++;

                    continue;
                }

                if (
                    kitExistente.IdMaterial !=
                    idMaterial.Value
                )
                {
                    throw new InvalidOperationException(
                        $"El serial {serialCaja} ya está relacionado con otro material."
                    );
                }

                // La importación nunca vuelve a colocar
                // la cantidad disponible al valor inicial.
                AsignarParametrosActualizacion(
                    actualizarKitCommand,
                    kitExistente.IdMaterialKit,
                    datos
                );

                var filasActualizadas =
                    await actualizarKitCommand
                        .ExecuteNonQueryAsync();

                if (filasActualizadas > 0)
                {
                    resultado.KitsActualizados++;
                }
                else
                {
                    resultado.KitsSinCambios++;
                }

                resultado.FilasCorrectas++;
            }
            catch (Exception ex)
            {
                resultado.FilasConError++;

                // Evita una respuesta demasiado grande.
                if (resultado.Errores.Count < 500)
                {
                    resultado.Errores.Add(
                        new ErrorImportacionMaterialKit
                        {
                            Hoja =
                                worksheet.Name,

                            NumeroFila =
                                numeroFila,

                            Mensaje =
                                ex.Message
                        }
                    );
                }
            }
        }
    }

    private static async Task<int?>
        ObtenerIdMaterialAsync(
            MySqlCommand command,
            string numeroMaterial)
    {
        command.Parameters[
            "@numeroMaterial"
        ].Value =
            numeroMaterial;

        var resultado =
            await command
                .ExecuteScalarAsync();

        if (
            resultado is null ||
            resultado is DBNull
        )
        {
            return null;
        }

        return Convert.ToInt32(
            resultado
        );
    }

    private static async Task<KitExistente?>
        ObtenerKitExistenteAsync(
            MySqlCommand command,
            string serialCaja)
    {
        command.Parameters[
            "@serialCaja"
        ].Value =
            serialCaja;

        await using var reader =
            await command
                .ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new KitExistente
        {
            IdMaterialKit =
                reader.GetInt64(
                    "id_material_kit"
                ),

            IdMaterial =
                reader.GetInt32(
                    "id_material"
                ),

            TieneMovimientos =
                reader.GetBoolean(
                    "tiene_movimientos"
                )
        };
    }

    private static void AgregarParametrosKit(
        MySqlCommand command)
    {
        command.Parameters.Add(
            "@idMaterial",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@serialCaja",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@numeroAsn",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@numeroCamion",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@numeroPallet",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@localidad",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@rack",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@cantidadInicial",
            MySqlDbType.Decimal
        );

        command.Parameters.Add(
            "@cantidadDisponible",
            MySqlDbType.Decimal
        );

        command.Parameters.Add(
            "@estadoOrigen",
            MySqlDbType.VarChar
        );

        command.Parameters.Add(
            "@shipFrom",
            MySqlDbType.VarChar
        );
    }

    private static void
        AsignarParametrosInsercion(
            MySqlCommand command,
            DatosMaterialKit datos)
    {
        command.Parameters[
            "@idMaterial"
        ].Value =
            datos.IdMaterial;

        command.Parameters[
            "@serialCaja"
        ].Value =
            datos.SerialCaja;

        command.Parameters[
            "@numeroAsn"
        ].Value =
            ConvertirDbNull(
                datos.NumeroAsn
            );

        command.Parameters[
            "@numeroCamion"
        ].Value =
            ConvertirDbNull(
                datos.NumeroCamion
            );

        command.Parameters[
            "@numeroPallet"
        ].Value =
            ConvertirDbNull(
                datos.NumeroPallet
            );

        command.Parameters[
            "@localidad"
        ].Value =
            ConvertirDbNull(
                datos.Localidad
            );

        command.Parameters[
            "@rack"
        ].Value =
            ConvertirDbNull(
                datos.Rack
            );

        command.Parameters[
            "@cantidadInicial"
        ].Value =
            datos.Cantidad;

        command.Parameters[
            "@cantidadDisponible"
        ].Value =
            datos.Cantidad;

        command.Parameters[
            "@estadoOrigen"
        ].Value =
            ConvertirDbNull(
                datos.EstadoOrigen
            );

        command.Parameters[
            "@shipFrom"
        ].Value =
            ConvertirDbNull(
                datos.ShipFrom
            );
    }

    private static void
        AsignarParametrosActualizacion(
            MySqlCommand command,
            long idMaterialKit,
            DatosMaterialKit datos)
    {
        command.Parameters[
            "@idMaterialKit"
        ].Value =
            idMaterialKit;

        command.Parameters[
            "@numeroAsn"
        ].Value =
            ConvertirDbNull(
                datos.NumeroAsn
            );

        command.Parameters[
            "@numeroCamion"
        ].Value =
            ConvertirDbNull(
                datos.NumeroCamion
            );

        command.Parameters[
            "@numeroPallet"
        ].Value =
            ConvertirDbNull(
                datos.NumeroPallet
            );

        command.Parameters[
            "@localidad"
        ].Value =
            ConvertirDbNull(
                datos.Localidad
            );

        command.Parameters[
            "@rack"
        ].Value =
            ConvertirDbNull(
                datos.Rack
            );

        command.Parameters[
            "@estadoOrigen"
        ].Value =
            ConvertirDbNull(
                datos.EstadoOrigen
            );

        command.Parameters[
            "@shipFrom"
        ].Value =
            ConvertirDbNull(
                datos.ShipFrom
            );
    }

    private static Dictionary<string, int>
        ObtenerColumnas(
            IXLRow filaEncabezados)
    {
        var columnas =
            new Dictionary<string, int>();

        foreach (
            var celda in
            filaEncabezados.CellsUsed()
        )
        {
            var encabezado =
                NormalizarEncabezado(
                    celda.GetString()
                );

            if (
                !string.IsNullOrWhiteSpace(
                    encabezado
                )
            )
            {
                columnas[encabezado] =
                    celda.Address
                        .ColumnNumber;
            }
        }

        return columnas;
    }

    private static void
        ValidarColumnasObligatorias(
            Dictionary<string, int> columnas)
    {
        var obligatorias =
            new[]
            {
                "NOASN",
                "NODECAMION",
                "NODEPALLET",
                "SERIALDECAJA",
                "MATERIALNO",
                "LOCALIDAD",
                "RACK",
                "CANTIDAD",
                "ESTADO",
                "SHIPFROM"
            };

        var faltantes =
            obligatorias
                .Where(
                    columna =>
                        !columnas.ContainsKey(
                            columna
                        )
                )
                .ToList();

        if (faltantes.Count > 0)
        {
            throw new InvalidOperationException(
                "Faltan columnas obligatorias: " +
                string.Join(
                    ", ",
                    faltantes
                )
            );
        }
    }

    private static string ObtenerTexto(
        IXLRow fila,
        Dictionary<string, int> columnas,
        string nombreColumna)
    {
        return fila
            .Cell(
                columnas[nombreColumna]
            )
            .GetFormattedString()
            .Trim();
    }

    private static string?
        ObtenerTextoOpcional(
            IXLRow fila,
            Dictionary<string, int> columnas,
            string nombreColumna)
    {
        var texto =
            ObtenerTexto(
                fila,
                columnas,
                nombreColumna
            );

        return string.IsNullOrWhiteSpace(
            texto
        )
            ? null
            : texto.Trim();
    }

    private static decimal ObtenerDecimal(
        IXLRow fila,
        Dictionary<string, int> columnas,
        string nombreColumna)
    {
        var celda =
            fila.Cell(
                columnas[nombreColumna]
            );

        if (
            celda.TryGetValue<decimal>(
                out var valor
            )
        )
        {
            return valor;
        }

        var texto =
            celda.GetFormattedString()
                .Trim()
                .Replace(",", "");

        if (
            decimal.TryParse(
                texto,
                out valor
            )
        )
        {
            return valor;
        }

        throw new InvalidOperationException(
            $"{nombreColumna} no contiene un número válido."
        );
    }

    private static string
        NormalizarEncabezado(
            string encabezado)
    {
        return encabezado
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "")
            .Replace(".", "")
            .Replace("_", "")
            .Replace("-", "");
    }

    private static object ConvertirDbNull(
        string? texto)
    {
        return string.IsNullOrWhiteSpace(
            texto
        )
            ? DBNull.Value
            : texto.Trim();
    }

    private sealed class DatosMaterialKit
    {
        public int IdMaterial
        {
            get;
            set;
        }

        public string SerialCaja
        {
            get;
            set;
        } = string.Empty;

        public string? NumeroAsn
        {
            get;
            set;
        }

        public string? NumeroCamion
        {
            get;
            set;
        }

        public string? NumeroPallet
        {
            get;
            set;
        }

        public string? Localidad
        {
            get;
            set;
        }

        public string? Rack
        {
            get;
            set;
        }

        public decimal Cantidad
        {
            get;
            set;
        }

        public string? EstadoOrigen
        {
            get;
            set;
        }

        public string? ShipFrom
        {
            get;
            set;
        }
    }

    private sealed class KitExistente
    {
        public long IdMaterialKit
        {
            get;
            set;
        }

        public int IdMaterial
        {
            get;
            set;
        }

        public bool TieneMovimientos
        {
            get;
            set;
        }
    }
}