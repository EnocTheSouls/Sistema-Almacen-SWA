using System.Globalization;
using System.Security.Claims;
using ClosedXML.Excel;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models.Mrp;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas para importar y consultar
// el plan semanal MRP.
public static class MrpEndpoints
{
    public static void MapMrpEndpoints(
        this WebApplication app)
    {
        var grupo =
            app.MapGroup("/api/mrp")
                .WithTags("MRP")
                .RequireAuthorization();

        // Importa el archivo semanal MRP.
        grupo.MapPost(
            "/importar",
            async (
                IFormFile archivo,
                ClaimsPrincipal principal,
                MrpRepository repository) =>
            {
                if (
                    archivo is null ||
                    archivo.Length == 0
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "Selecciona un archivo Excel."
                        }
                    );
                }

                var extension =
                    Path.GetExtension(
                        archivo.FileName
                    );

                if (
                    !extension.Equals(
                        ".xlsx",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El archivo debe tener formato .xlsx."
                        }
                    );
                }

                // Limita el tamaño del archivo a 20 MB.
                const long tamanoMaximo =
                    20 * 1024 * 1024;

                if (
                    archivo.Length >
                    tamanoMaximo
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "El archivo supera el límite de 20 MB."
                        }
                    );
                }

                var idUsuarioTexto =
                    principal.FindFirstValue(
                        ClaimTypes.NameIdentifier
                    );

                if (
                    !int.TryParse(
                        idUsuarioTexto,
                        out var idUsuario
                    )
                )
                {
                    return Results.Unauthorized();
                }

                try
                {
                    await using var memoria =
                        new MemoryStream();

                    await archivo.CopyToAsync(
                        memoria
                    );

                    memoria.Position = 0;

                    using var workbook =
                        new XLWorkbook(memoria);

                    var worksheet =
                        workbook.Worksheets
                            .FirstOrDefault(
                                hoja =>
                                    hoja.Name.Equals(
                                        "MRPFI230",
                                        StringComparison.OrdinalIgnoreCase
                                    )
                            );

                    if (worksheet is null)
                    {
                        return Results.BadRequest(
                            new
                            {
                                mensaje =
                                    "El archivo no contiene la hoja MRPFI230."
                            }
                        );
                    }

                    var filaEncabezados =
                        worksheet.FirstRowUsed();

                    if (filaEncabezados is null)
                    {
                        return Results.BadRequest(
                            new
                            {
                                mensaje =
                                    "La hoja MRPFI230 está vacía."
                            }
                        );
                    }

                    var columnas =
                        ObtenerColumnas(
                            filaEncabezados
                        );

                    // Solo estas columnas son indispensables.
                    // Las demás columnas del Excel se ignoran
                    // o se leen como opcionales.
                    var columnasObligatorias =
                        new[]
                        {
        "Material Number",
        "Due Date (ETA)",
        "Reqd. Qty.",
        "Pack Size"
                        };
                    var columnasFaltantes =
                        columnasObligatorias
                            .Where(
                                encabezado =>
                                    !columnas.ContainsKey(
                                        NormalizarEncabezado(
                                            encabezado
                                        )
                                    )
                            )
                            .ToList();

                    if (
                        columnasFaltantes.Count > 0
                    )
                    {
                        return Results.BadRequest(
                            new
                            {
                                mensaje =
                                    "El archivo no contiene todas las columnas requeridas.",

                                columnasFaltantes
                            }
                        );
                    }

                    var requerimientos =
                        new List<
                            RequerimientoMrpImportacion
                        >();

                    var errores =
                        new List<string>();

                    var fechaMinima =
                        (DateTime?)null;

                    var fechaMaxima =
                        (DateTime?)null;

                    var primeraFilaDatos =
                        filaEncabezados.RowNumber() +
                        1;

                    var ultimaFila =
                        worksheet.LastRowUsed()
                            ?.RowNumber() ?? 0;

                    for (
                        var numeroFila =
                            primeraFilaDatos;

                        numeroFila <=
                            ultimaFila;

                        numeroFila++
                    )
                    {
                        var fila =
                            worksheet.Row(
                                numeroFila
                            );

                        if (FilaVacia(fila))
                        {
                            continue;
                        }

                        var numeroMaterial =
                            ObtenerTexto(
                                fila,
                                columnas,
                                "Material Number"
                            );

                        var nombreMaterial =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "Material Name"
                            );

                        var familia =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "Product No. / Family"
                            );

                        var proyecto =
                            ObtenerTextoOpcional(
                                fila,
                                columnas,
                                "Short Plant Code"
                            );

                        var numeroRequisicion =
                            columnas.ContainsKey(
                                NormalizarEncabezado(
                                    "Req. No."
                                )
                            )
                                ? ObtenerTextoOpcional(
                                    fila,
                                    columnas,
                                    "Req. No."
                                )
                                : null;

                        if (
                            string.IsNullOrWhiteSpace(
                                numeroMaterial
                            )
                        )
                        {
                            errores.Add(
                                $"Fila {numeroFila}: Material Number está vacío."
                            );

                            continue;
                        }

                        if (
                            !IntentarObtenerFecha(
                                fila,
                                columnas,
                                "Due Date (ETA)",
                                out var fechaEta
                            )
                        )
                        {
                            errores.Add(
                                $"Fila {numeroFila}: Due Date (ETA) no es válida."
                            );

                            continue;
                        }

                        if (
                            !IntentarObtenerDecimal(
                                fila,
                                columnas,
                                "Reqd. Qty.",
                                out var cantidadRequerida
                            ) ||
                            cantidadRequerida < 0
                        )
                        {
                            errores.Add(
                                $"Fila {numeroFila}: Reqd. Qty. no es válida."
                            );

                            continue;
                        }

                        if (
                            !IntentarObtenerDecimal(
                                fila,
                                columnas,
                                "Pack Size",
                                out var packSize
                            ) ||
                            packSize <= 0
                        )
                        {
                            errores.Add(
                                $"Fila {numeroFila}: Pack Size debe ser mayor que cero."
                            );

                            continue;
                        }

                        var bolsasNecesarias =
                            cantidadRequerida <= 0
                                ? 0
                                : (int)Math.Ceiling(
                                    cantidadRequerida /
                                    packSize
                                );

                        requerimientos.Add(
                            new RequerimientoMrpImportacion
                            {
                                NumeroRequisicion =
                                    numeroRequisicion,

                                NumeroMaterial =
                                    numeroMaterial.Trim(),

                                NombreMaterial =
                                    LimpiarTexto(
                                        nombreMaterial
                                    ),

                                Familia =
                                    LimpiarTexto(
                                        familia
                                    ),

                                Proyecto =
                                    LimpiarTexto(
                                        proyecto
                                    ),

                                FechaEta =
                                    fechaEta.Date,

                                CantidadRequerida =
                                    cantidadRequerida,

                                PackSize =
                                    packSize,

                                BolsasNecesarias =
                                    bolsasNecesarias
                            }
                        );

                        if (
                            !fechaMinima.HasValue ||
                            fechaEta.Date <
                            fechaMinima.Value.Date
                        )
                        {
                            fechaMinima =
                                fechaEta.Date;
                        }

                        if (
                            !fechaMaxima.HasValue ||
                            fechaEta.Date >
                            fechaMaxima.Value.Date
                        )
                        {
                            fechaMaxima =
                                fechaEta.Date;
                        }
                    }

                    if (
                        requerimientos.Count == 0 ||
                        !fechaMinima.HasValue ||
                        !fechaMaxima.HasValue
                    )
                    {
                        return Results.BadRequest(
                            new
                            {
                                mensaje =
                                    "El archivo no contiene registros válidos para importar.",

                                totalErrores =
                                    errores.Count,

                                errores =
                                    errores.Take(50)
                            }
                        );
                    }

                    var idImportacion =
                        await repository
                            .ImportarSemanaAsync(
                                Path.GetFileName(
                                    archivo.FileName
                                ),
                                fechaMinima.Value,
                                fechaMaxima.Value,
                                idUsuario,
                                requerimientos,
                                errores.Count
                            );

                    return Results.Ok(
                        new
                        {
                            mensaje =
                                "El archivo semanal MRP se importó correctamente.",

                            idImportacion,

                            nombreArchivo =
                                Path.GetFileName(
                                    archivo.FileName
                                ),

                            fechaInicio =
                                fechaMinima.Value,

                            fechaFin =
                                fechaMaxima.Value,

                            totalRegistros =
                                requerimientos.Count +
                                errores.Count,

                            registrosImportados =
                                requerimientos.Count,

                            registrosRechazados =
                                errores.Count,

                            errores =
                                errores.Take(50)
                        }
                    );
                }

                catch (InvalidDataException ex)
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "No se pudo leer el archivo Excel.",

                            detalle =
                                ex.Message
                        }
                    );
                }
                catch (Exception ex)
                {
                    return Results.Problem(
                        title:
                            "No se completó la importación MRP",

                        detail:
                            ex.Message,

                        statusCode:
                            StatusCodes
                                .Status500InternalServerError
                    );
                }
            }
        )
        .WithName("ImportarArchivoMrp")
        .DisableAntiforgery()
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador",
                    "Supervisor"
                )
        );

        // Consulta el plan vigente con filtros.
        grupo.MapGet(
            "/requerimientos",
            async (
                string? busqueda,
                string? proyecto,
                string? familia,
                DateTime? fechaDesde,
                DateTime? fechaHasta,
                int? pagina,
                int? tamanoPagina,
                MrpRepository repository) =>
            {
                if (
                    fechaDesde.HasValue &&
                    fechaHasta.HasValue &&
                    fechaDesde.Value.Date >
                    fechaHasta.Value.Date
                )
                {
                    return Results.BadRequest(
                        new
                        {
                            mensaje =
                                "La fecha inicial no puede ser posterior a la fecha final."
                        }
                    );
                }

                var resultado =
                    await repository
                        .ObtenerRequerimientosAsync(
                            busqueda,
                            proyecto,
                            familia,
                            fechaDesde,
                            fechaHasta,
                            pagina ?? 1,
                            tamanoPagina ?? 50
                        );

                return Results.Ok(
                    resultado
                );
            }
        )
        .WithName("ObtenerRequerimientosMrp")
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador",
                    "Supervisor",
                    "Materialista",
                    "Surtidor"
                )
        );

        // Devuelve proyectos, familias y periodo vigente.
        grupo.MapGet(
            "/filtros",
            async (
                MrpRepository repository) =>
            {
                var filtros =
                    await repository
                        .ObtenerFiltrosAsync();

                return Results.Ok(
                    filtros
                );
            }
        )
        .WithName("ObtenerFiltrosMrp")
        .RequireAuthorization(
            policy =>
                policy.RequireRole(
                    "Administrador",
                    "Supervisor",
                    "Materialista",
                    "Surtidor"
                )
        );
    }

    // Asocia cada encabezado con su número de columna.
    private static Dictionary<string, int>
        ObtenerColumnas(
            IXLRow filaEncabezados)
    {
        var columnas =
            new Dictionary<string, int>(
                StringComparer.OrdinalIgnoreCase
            );

        foreach (
            var celda
            in filaEncabezados.CellsUsed()
        )
        {
            var encabezado =
                NormalizarEncabezado(
                    celda.GetString()
                );

            if (
                !string.IsNullOrWhiteSpace(
                    encabezado
                ) &&
                !columnas.ContainsKey(
                    encabezado
                )
            )
            {
                columnas[
                    encabezado
                ] = celda.Address
                    .ColumnNumber;
            }
        }

        return columnas;
    }

    private static bool FilaVacia(
        IXLRow fila)
    {
        return !fila.CellsUsed()
            .Any(
                celda =>
                    !celda.IsEmpty()
            );
    }

    private static string ObtenerTexto(
        IXLRow fila,
        IReadOnlyDictionary<
            string,
            int
        > columnas,
        string encabezado)
    {
        var columna =
            columnas[
                NormalizarEncabezado(
                    encabezado
                )
            ];

        return fila
            .Cell(columna)
            .GetFormattedString()
            .Trim();
    }

    private static string?
        ObtenerTextoOpcional(
            IXLRow fila,
            IReadOnlyDictionary<
                string,
                int
            > columnas,
            string encabezado)
    {
        var encabezadoNormalizado =
            NormalizarEncabezado(
                encabezado
            );

        if (
            !columnas.TryGetValue(
                encabezadoNormalizado,
                out var columna
            )
        )
        {
            return null;
        }

        var valor =
            fila.Cell(columna)
                .GetFormattedString()
                .Trim();

        return string.IsNullOrWhiteSpace(
            valor
        )
            ? null
            : valor;
    }

    private static bool IntentarObtenerFecha(
        IXLRow fila,
        IReadOnlyDictionary<
            string,
            int
        > columnas,
        string encabezado,
        out DateTime fecha)
    {
        fecha =
            default;

        var columna =
            columnas[
                NormalizarEncabezado(
                    encabezado
                )
            ];

        var celda =
            fila.Cell(columna);

        if (
            celda.TryGetValue<DateTime>(
                out var fechaExcel
            )
        )
        {
            fecha =
                fechaExcel.Date;

            return true;
        }

        var texto =
            celda.GetFormattedString()
                .Trim();

        var culturas =
            new[]
            {
                CultureInfo.GetCultureInfo(
                    "en-US"
                ),
                CultureInfo.GetCultureInfo(
                    "es-MX"
                ),
                CultureInfo.InvariantCulture
            };

        foreach (
            var cultura
            in culturas
        )
        {
            if (
                DateTime.TryParse(
                    texto,
                    cultura,
                    DateTimeStyles.None,
                    out var fechaTexto
                )
            )
            {
                fecha =
                    fechaTexto.Date;

                return true;
            }
        }

        return false;
    }

    private static bool
        IntentarObtenerDecimal(
            IXLRow fila,
            IReadOnlyDictionary<
                string,
                int
            > columnas,
            string encabezado,
            out decimal valor)
    {
        valor = 0;

        var columna =
            columnas[
                NormalizarEncabezado(
                    encabezado
                )
            ];

        var celda =
            fila.Cell(columna);

        if (
            celda.TryGetValue<decimal>(
                out var valorNumerico
            )
        )
        {
            valor =
                valorNumerico;

            return true;
        }

        var texto =
            celda.GetFormattedString()
                .Trim();

        return (
            decimal.TryParse(
                texto,
                NumberStyles.Any,
                CultureInfo.GetCultureInfo(
                    "en-US"
                ),
                out valor
            ) ||
            decimal.TryParse(
                texto,
                NumberStyles.Any,
                CultureInfo.GetCultureInfo(
                    "es-MX"
                ),
                out valor
            )
        );
    }
    private static string NormalizarEncabezado(
        string? texto)
    {
        if (string.IsNullOrWhiteSpace(
            texto))
        {
            return string.Empty;
        }

        // Elimina saltos de línea y espacios duplicados.
        return string.Join(
            " ",
            texto
                .Replace(
                    "\r",
                    " "
                )
                .Replace(
                    "\n",
                    " "
                )
                .Split(
                    ' ',
                    StringSplitOptions
                        .RemoveEmptyEntries
                )
        );
    }



    private static string?
        LimpiarTexto(
            string? texto)
    {
        return string.IsNullOrWhiteSpace(
            texto
        )
            ? null
            : texto.Trim();
    }
}