using System.Globalization;
using System.Text.RegularExpressions;
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

        var fechaReporte =
            ObtenerFechaReporte(
                nombreArchivo
            );

        // La importación comienza el lunes
        // de la semana del archivo.
        var periodoInicio =
            ObtenerLunesSemana(
                fechaReporte
            );

        // Se usa la fecha del reporte como
        // cierre de la información importada.
        var periodoFin =
            fechaReporte;

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var transaction =
            await connection
                .BeginTransactionAsync();

        try
        {
            // Crea la cabecera de la
            // importación semanal.
            var idImportacionPics =
                await CrearImportacionAsync(
                    connection,
                    transaction,
                    nombreArchivo,
                    periodoInicio,
                    periodoFin
                );

            // Localiza el material, pero permite
            // continuar cuando todavía no existe.
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

            buscarMaterialCommand.Parameters.Add(
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
                mk.id_material_kit,
                mk.id_material,

                EXISTS (
                    SELECT 1
                    FROM material_kit_movimiento AS mkm
                    WHERE mkm.id_material_kit =
                          mk.id_material_kit
                    LIMIT 1
                ) AS tiene_movimientos

            FROM material_kit AS mk
            WHERE UPPER(
                TRIM(
                    mk.serial_caja
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
                id_importacion_pics,
                numero_fila_origen,
                id_material,
                numero_material_origen,
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
                @idImportacionPics,
                @numeroFilaOrigen,
                @idMaterial,
                @numeroMaterialOrigen,
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
                @estadoKit,
                TRUE
            );
            """;

            AgregarParametrosKit(
                insertarKitCommand
            );

            // Actualiza un serial existente.
            await using var actualizarKitCommand =
                connection.CreateCommand();

            actualizarKitCommand.Transaction =
                transaction;

            actualizarKitCommand.CommandText = """
            UPDATE material_kit
            SET
                id_importacion_pics =
                    @idImportacionPics,

                numero_fila_origen =
                    @numeroFilaOrigen,

                id_material =
                    @idMaterial,

                numero_material_origen =
                    @numeroMaterialOrigen,

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

                cantidad_inicial =
                    CASE
                        WHEN @tieneMovimientos = FALSE
                        THEN @cantidadInicial
                        ELSE cantidad_inicial
                    END,

                cantidad_disponible =
                    CASE
                        WHEN @tieneMovimientos = FALSE
                        THEN @cantidadDisponible
                        ELSE cantidad_disponible
                    END,

                estado_kit =
                    CASE
                        WHEN @tieneMovimientos = FALSE
                        THEN @estadoKit
                        ELSE estado_kit
                    END,

                activo =
                    TRUE

            WHERE id_material_kit =
                  @idMaterialKit;
            """;

            AgregarParametrosKit(
                actualizarKitCommand
            );

            actualizarKitCommand.Parameters.Add(
                "@idMaterialKit",
                MySqlDbType.Int64
            );

            actualizarKitCommand.Parameters.Add(
                "@tieneMovimientos",
                MySqlDbType.Bool
            );

            // Evita consultar repetidamente
            // el mismo material.
            var cacheMateriales =
                new Dictionary<string, int?>(
                    StringComparer.OrdinalIgnoreCase
                );

            var totalRecibidos = 0;
            var totalPorRecibir = 0;

            foreach (var worksheet in hojas)
            {
                await ProcesarHojaAsync(
                    worksheet,
                    resultado,
                    idImportacionPics,
                    buscarMaterialCommand,
                    buscarKitCommand,
                    insertarKitCommand,
                    actualizarKitCommand,
                    cacheMateriales,
                    contadorRecibido:
                        () => totalRecibidos++,
                    contadorPorRecibir:
                        () => totalPorRecibir++
                );
            }

            await ActualizarImportacionAsync(
                connection,
                transaction,
                idImportacionPics,
                resultado,
                totalRecibidos,
                totalPorRecibir
            );

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
            long idImportacionPics,
            MySqlCommand buscarMaterialCommand,
            MySqlCommand buscarKitCommand,
            MySqlCommand insertarKitCommand,
            MySqlCommand actualizarKitCommand,
            Dictionary<string, int?>
                cacheMateriales,
            Action contadorRecibido,
            Action contadorPorRecibir)
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

                var estadoOrigen =
                    ObtenerTextoOpcional(
                        fila,
                        columnas,
                        "ESTADO"
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

                if (serialCaja.Length > 100)
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

                if (numeroMaterial.Length > 100)
                {
                    throw new InvalidOperationException(
                        "Material No. excede 100 caracteres."
                    );
                }

                if (cantidad <= 0)
                {
                    throw new InvalidOperationException(
                        "Cantidad debe ser mayor que cero."
                    );
                }

                var estadoKit =
                    ConvertirEstadoKit(
                        estadoOrigen
                    );

                if (
                    estadoKit ==
                    "DISPONIBLE"
                )
                {
                    contadorRecibido();
                }
                else
                {
                    contadorPorRecibir();
                }

                // Busca una relación con materiales.
                // Si no existe, almacena NULL.
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

                var kitExistente =
                    await ObtenerKitExistenteAsync(
                        buscarKitCommand,
                        serialCaja
                    );

                var datos =
                    new DatosMaterialKit
                    {
                        IdImportacionPics =
                            idImportacionPics,

                        NumeroFilaOrigen =
                            numeroFila,

                        IdMaterial =
                            idMaterial,

                        NumeroMaterialOrigen =
                            numeroMaterial,

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
                            estadoOrigen,

                        EstadoKit =
                            estadoKit,

                        ShipFrom =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "SHIPFROM"
                            )
                    };

                if (kitExistente is null)
                {
                    AsignarParametrosKit(
                        insertarKitCommand,
                        datos
                    );
                    await insertarKitCommand
    .ExecuteNonQueryAsync();

                    resultado.KitsCreados++;
                    resultado.FilasCorrectas++;

                    continue;
                }

                // Si el serial ya tuvo movimientos,
                // no puede cambiarse a otro material.
                if (
                    kitExistente.TieneMovimientos &&
                    kitExistente.IdMaterial.HasValue &&
                    idMaterial.HasValue &&
                    kitExistente.IdMaterial.Value !=
                    idMaterial.Value
                )
                {
                    throw new InvalidOperationException(
                        $"El serial {serialCaja} ya tiene movimientos y está relacionado con otro material."
                    );
                }

                AsignarParametrosKit(
                    actualizarKitCommand,
                    datos
                );

                actualizarKitCommand.Parameters[
                    "@idMaterialKit"
                ].Value =
                    kitExistente.IdMaterialKit;

                actualizarKitCommand.Parameters[
                    "@tieneMovimientos"
                ].Value =
                    kitExistente.TieneMovimientos;

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

                // Limita el tamaño de la respuesta.
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

    // Crea el registro de la importación semanal.
    private static async Task<long>
        CrearImportacionAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            string nombreArchivo,
            DateTime periodoInicio,
            DateTime periodoFin)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;

        command.CommandText = """
        INSERT INTO importacion_pics (
            nombre_archivo,
            periodo_inicio,
            periodo_fin,
            id_usuario,
            total_filas,
            total_correctas,
            total_errores,
            total_recibidos,
            total_por_recibir,
            activo
        )
        VALUES (
            @nombreArchivo,
            @periodoInicio,
            @periodoFin,
            NULL,
            0,
            0,
            0,
            0,
            0,
            TRUE
        );

        SELECT LAST_INSERT_ID();
        """;

        command.Parameters.AddWithValue(
            "@nombreArchivo",
            nombreArchivo
        );

        command.Parameters.AddWithValue(
            "@periodoInicio",
            periodoInicio.Date
        );

        command.Parameters.AddWithValue(
            "@periodoFin",
            periodoFin.Date
        );

        var id =
            await command.ExecuteScalarAsync();

        return Convert.ToInt64(id);
    }

    // Actualiza los resultados finales
    // de la importación semanal.
    private static async Task
        ActualizarImportacionAsync(
            MySqlConnection connection,
            MySqlTransaction transaction,
            long idImportacionPics,
            MaterialKitImportResult resultado,
            int totalRecibidos,
            int totalPorRecibir)
    {
        await using var command =
            connection.CreateCommand();

        command.Transaction =
            transaction;

        command.CommandText = """
        UPDATE importacion_pics
        SET
            total_filas =
                @totalFilas,

            total_correctas =
                @totalCorrectas,

            total_errores =
                @totalErrores,

            total_recibidos =
                @totalRecibidos,

            total_por_recibir =
                @totalPorRecibir

        WHERE id_importacion_pics =
              @idImportacionPics;
        """;

        command.Parameters.AddWithValue(
            "@totalFilas",
            resultado.TotalFilas
        );

        command.Parameters.AddWithValue(
            "@totalCorrectas",
            resultado.FilasCorrectas
        );

        command.Parameters.AddWithValue(
            "@totalErrores",
            resultado.FilasConError
        );

        command.Parameters.AddWithValue(
            "@totalRecibidos",
            totalRecibidos
        );

        command.Parameters.AddWithValue(
            "@totalPorRecibir",
            totalPorRecibir
        );

        command.Parameters.AddWithValue(
            "@idImportacionPics",
            idImportacionPics
        );

        await command.ExecuteNonQueryAsync();
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

        var indiceIdMaterial =
            reader.GetOrdinal(
                "id_material"
            );

        return new KitExistente
        {
            IdMaterialKit =
                reader.GetInt64(
                    "id_material_kit"
                ),

            IdMaterial =
                reader.IsDBNull(
                    indiceIdMaterial
                )
                    ? null
                    : reader.GetInt32(
                        indiceIdMaterial
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
            "@idImportacionPics",
            MySqlDbType.Int64
        );

        command.Parameters.Add(
            "@numeroFilaOrigen",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@idMaterial",
            MySqlDbType.Int32
        );

        command.Parameters.Add(
            "@numeroMaterialOrigen",
            MySqlDbType.VarChar
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

        command.Parameters.Add(
            "@estadoKit",
            MySqlDbType.VarChar
        );
    }

    private static void AsignarParametrosKit(
        MySqlCommand command,
        DatosMaterialKit datos)
    {
        command.Parameters[
            "@idImportacionPics"
        ].Value =
            datos.IdImportacionPics;

        command.Parameters[
            "@numeroFilaOrigen"
        ].Value =
            datos.NumeroFilaOrigen;

        command.Parameters[
            "@idMaterial"
        ].Value =
            datos.IdMaterial.HasValue
                ? datos.IdMaterial.Value
                : DBNull.Value;

        command.Parameters[
            "@numeroMaterialOrigen"
        ].Value =
            datos.NumeroMaterialOrigen;

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

        command.Parameters[
            "@estadoKit"
        ].Value =
            datos.EstadoKit;
    }

    // Convierte el estado de PICS al
    // estado operativo del sistema.
    private static string ConvertirEstadoKit(
        string? estadoOrigen)
    {
        var estado =
            estadoOrigen?
                .Trim()
                .ToUpperInvariant() ??
            string.Empty;

        return estado switch
        {
            "RECIBIDO" =>
                "DISPONIBLE",

            "SIN RECIBIR" =>
                "POR_RECIBIR",

            _ =>
                "BLOQUEADO"
        };
    }

    // Obtiene la fecha incluida en
    // el nombre del archivo.
    private static DateTime ObtenerFechaReporte(
        string nombreArchivo)
    {
        var coincidencias =
            Regex.Matches(
                nombreArchivo,
                @"(?<!\d)(20\d{6})(?!\d)"
            );

        foreach (
            Match coincidencia in
            coincidencias
                .Cast<Match>()
                .Reverse()
        )
        {
            if (
                DateTime.TryParseExact(
                    coincidencia.Value,
                    "yyyyMMdd",
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var fecha
                )
            )
            {
                return fecha;
            }
        }

        return DateTime.Today;
    }

    // Calcula el lunes correspondiente
    // a la fecha del reporte.
    private static DateTime ObtenerLunesSemana(
        DateTime fecha)
    {
        var diferencia =
            (
                7 +
                (
                    fecha.DayOfWeek -
                    DayOfWeek.Monday
                )
            ) % 7;

        return fecha.Date.AddDays(
            -diferencia
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
                NumberStyles.Number,
                CultureInfo.InvariantCulture,
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
        public long IdImportacionPics
        {
            get;
            set;
        }

        public int NumeroFilaOrigen
        {
            get;
            set;
        }

        public int? IdMaterial
        {
            get;
            set;
        }

        public string NumeroMaterialOrigen
        {
            get;
            set;
        } = string.Empty;

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

        public string EstadoKit
        {
            get;
            set;
        } = string.Empty;

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

        public int? IdMaterial
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

