using System.Globalization;
using ClosedXML.Excel;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Importa familias, arneses, diseños y planes semanales del 5MF.
public sealed class FiveMfImportService
{
    private readonly FamiliaRepository
        _familiaRepository;

    private readonly ArnesRepository
        _arnesRepository;

    private readonly ImportacionFiveMfRepository
        _importacionRepository;

    public FiveMfImportService(
        FamiliaRepository familiaRepository,
        ArnesRepository arnesRepository,
        ImportacionFiveMfRepository
            importacionRepository)
    {
        _familiaRepository =
            familiaRepository;

        _arnesRepository =
            arnesRepository;

        _importacionRepository =
            importacionRepository;
    }

    // Lee la hoja Data del archivo 5MF.
    public async Task<FiveMfImportResult>
        ImportarAsync(
            Stream archivo,
            string nombreArchivo,
            long idImportacion)
    {
        var resultado =
            new FiveMfImportResult
            {
                NombreArchivo =
                    nombreArchivo
            };

        var familiasEncontradas =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        var familiasSinCoincidencia =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        var arnesesCreados =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        var arnesesExistentes =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        using var workbook =
            new XLWorkbook(archivo);

        var worksheet =
            workbook.Worksheets
                .FirstOrDefault(
                    hoja =>
                        hoja.Name.Equals(
                            "Data",
                            StringComparison.OrdinalIgnoreCase
                        )
                );

        if (worksheet is null)
        {
            throw new InvalidOperationException(
                "El archivo no contiene la hoja Data."
            );
        }

        var filaEncabezados =
            worksheet.FirstRowUsed();

        if (filaEncabezados is null)
        {
            throw new InvalidOperationException(
                "La hoja Data no contiene encabezados."
            );
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
            filaEncabezados.RowNumber();

        for (
            var numeroFila =
                primeraFilaDatos;
            numeroFila <= ultimaFila;
            numeroFila++
        )
        {
            var filaExcel =
                worksheet.Row(
                    numeroFila
                );

            if (filaExcel.IsEmpty())
            {
                continue;
            }

            var fila =
                CrearFila(
                    filaExcel,
                    columnas,
                    numeroFila
                );

            // Ignora filas completamente vacías.
            if (
                string.IsNullOrWhiteSpace(
                    fila.Familia
                ) &&
                string.IsNullOrWhiteSpace(
                    fila.NumeroArnes
                ) &&
                string.IsNullOrWhiteSpace(
                    fila.NivelDiseno
                )
            )
            {
                continue;
            }

            resultado.TotalFilas++;

            int? idFamilia = null;
            int? idArnes = null;

            var esValido = false;
            var tieneAdvertencia = false;
            string? detalleValidacion = null;

            try
            {
                ValidarFila(fila);

                var familia =
                    await _familiaRepository
                        .ObtenerParaFiveMfAsync(
                            fila.Familia
                        );

                if (familia is null)
                {
                    familiasSinCoincidencia.Add(
                        fila.Familia
                    );

                    tieneAdvertencia = true;

                    detalleValidacion =
                        $"La familia \"{fila.Familia}\" no tiene coincidencia ni equivalencia configurada.";

                    resultado
                        .FilasConAdvertencia++;

                    resultado.Advertencias.Add(
                        new FiveMfImportWarning
                        {
                            NumeroFila =
                                numeroFila,

                            Familia =
                                fila.Familia,

                            NumeroArnes =
                                fila.NumeroArnes,

                            NivelDiseno =
                                fila.NivelDiseno,

                            Mensaje =
                                detalleValidacion
                        }
                    );

                    await _importacionRepository
                        .GuardarStagingAsync(
                            idImportacion,
                            fila,
                            null,
                            null,
                            false,
                            true,
                            detalleValidacion
                        );

                    continue;
                }

                idFamilia =
                    familia.IdFamilia;

                familiasEncontradas.Add(
                    fila.Familia
                );

                var claveArnes =
                    CrearClaveArnes(
                        fila.NumeroArnes,
                        fila.NivelDiseno
                    );

                var arnesExistente =
                    await _arnesRepository
                        .ObtenerPorNumeroYDisenoAsync(
                            fila.NumeroArnes,
                            fila.NivelDiseno
                        );

                Arnes? arnes;

                if (arnesExistente is null)
                {
                    arnes =
                        await _arnesRepository
                            .ObtenerOCrearAsync(
                                familia.IdFamilia,
                                fila.NumeroArnes,
                                fila.NivelDiseno
                            );

                    if (arnes is null)
                    {
                        throw new InvalidOperationException(
                            "No se pudo crear el arnés."
                        );
                    }

                    arnesesCreados.Add(
                        claveArnes
                    );
                }
                else
                {
                    if (
                        arnesExistente.IdFamilia !=
                        familia.IdFamilia
                    )
                    {
                        throw new InvalidOperationException(
                            $"El arnés {fila.NumeroArnes} con diseño {fila.NivelDiseno} pertenece a otra familia."
                        );
                    }

                    arnes =
                        arnesExistente;

                    if (
                        !arnesesCreados.Contains(
                            claveArnes
                        )
                    )
                    {
                        arnesesExistentes.Add(
                            claveArnes
                        );
                    }
                }

                idArnes =
                    arnes.IdArnes;

                await _importacionRepository
                    .GuardarPlanSemanalAsync(
                        idImportacion,
                        arnes.IdArnes,
                        fila
                    );

                resultado
                    .PlanesSemanalesGuardados++;

                esValido = true;

                await _importacionRepository
                    .GuardarStagingAsync(
                        idImportacion,
                        fila,
                        idFamilia,
                        idArnes,
                        esValido,
                        tieneAdvertencia,
                        detalleValidacion
                    );

                resultado.FilasCorrectas++;
            }
            catch (Exception ex)
            {
                resultado.FilasConError++;

                detalleValidacion =
                    ex.Message;

                resultado.Errores.Add(
                    new FiveMfImportError
                    {
                        NumeroFila =
                            numeroFila,

                        Familia =
                            fila.Familia,

                        NumeroArnes =
                            fila.NumeroArnes,

                        NivelDiseno =
                            fila.NivelDiseno,

                        Mensaje =
                            ex.Message
                    }
                );

                await _importacionRepository
                    .GuardarStagingAsync(
                        idImportacion,
                        fila,
                        idFamilia,
                        idArnes,
                        false,
                        tieneAdvertencia,
                        detalleValidacion
                    );
            }
        }

        resultado.FamiliasEncontradas =
            familiasEncontradas.Count;

        resultado.FamiliasSinCoincidencia =
            familiasSinCoincidencia.Count;

        resultado.ArnesesCreados =
            arnesesCreados.Count;

        resultado.ArnesesExistentes =
            arnesesExistentes.Count;

        return resultado;
    }

    // Construye una fila del archivo 5MF.
    private static FiveMfRow CrearFila(
        IXLRow fila,
        Dictionary<string, int> columnas,
        int numeroFila)
    {
        return new FiveMfRow
        {
            NumeroFila =
                numeroFila,

            Familia =
                ObtenerTexto(
                    fila,
                    columnas,
                    "CODE"
                ),

            NumeroArnes =
                ObtenerTexto(
                    fila,
                    columnas,
                    "SUPLRPN"
                ),

            NivelDiseno =
                ObtenerTexto(
                    fila,
                    columnas,
                    "DL"
                ),

            ProyectoRivian =
                ObtenerTexto(
                    fila,
                    columnas,
                    "CUST"
                ),

            FechaInicio =
                ObtenerFechaOpcional(
                    fila,
                    columnas,
                    "ASSYSTART"
                ),

            FechaFinal =
                ObtenerFechaOpcional(
                    fila,
                    columnas,
                    "ETADOOR"
                ),

            NumeroRequisicion =
                ObtenerTextoOpcional(
                    fila,
                    columnas,
                    "REQNO"
                ),

            SetsPlaneados =
                ObtenerDecimalOpcional(
                    fila,
                    columnas,
                    "SETS"
                ) ?? 0
        };
    }

    // Valida los datos mínimos de una fila semanal.
    private static void ValidarFila(
        FiveMfRow fila)
    {
        if (
            string.IsNullOrWhiteSpace(
                fila.Familia
            )
        )
        {
            throw new InvalidOperationException(
                "La familia Code está vacía."
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                fila.NumeroArnes
            )
        )
        {
            throw new InvalidOperationException(
                "Suplr_pn está vacío."
            );
        }

        if (
            string.IsNullOrWhiteSpace(
                fila.NivelDiseno
            )
        )
        {
            throw new InvalidOperationException(
                "El nivel de diseño Dl está vacío."
            );
        }

        if (!fila.FechaInicio.HasValue)
        {
            throw new InvalidOperationException(
                "Assy_start no contiene una fecha válida."
            );
        }

        if (!fila.FechaFinal.HasValue)
        {
            throw new InvalidOperationException(
                "Eta_door no contiene una fecha válida."
            );
        }

        if (
            fila.FechaFinal.Value <
            fila.FechaInicio.Value
        )
        {
            throw new InvalidOperationException(
                "Eta_door no puede ser anterior a Assy_start."
            );
        }

        if (fila.SetsPlaneados < 0)
        {
            throw new InvalidOperationException(
                "SETS no puede ser negativo."
            );
        }
    }

    // Obtiene las posiciones de los encabezados.
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

    // Revisa que la hoja Data tenga las columnas necesarias.
    private static void
        ValidarColumnasObligatorias(
            Dictionary<string, int> columnas)
    {
        var obligatorias =
            new[]
            {
                "CODE",
                "SUPLRPN",
                "DL",
                "CUST",
                "ASSYSTART",
                "ETADOOR",
                "REQNO",
                "SETS"
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
                "Faltan columnas obligatorias en la hoja Data: " +
                string.Join(
                    ", ",
                    faltantes
                )
            );
        }
    }

    // Obtiene texto de una columna obligatoria.
    private static string ObtenerTexto(
        IXLRow fila,
        Dictionary<string, int> columnas,
        string nombreColumna)
    {
        var numeroColumna =
            columnas[nombreColumna];

        return fila
            .Cell(numeroColumna)
            .GetString()
            .Trim()
            .ToUpperInvariant();
    }

    // Obtiene texto permitiendo celdas vacías.
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

        return string.IsNullOrWhiteSpace(texto)
            ? null
            : texto;
    }

    // Obtiene una fecha de Excel.
    private static DateOnly?
        ObtenerFechaOpcional(
            IXLRow fila,
            Dictionary<string, int> columnas,
            string nombreColumna)
    {
        var celda =
            fila.Cell(
                columnas[nombreColumna]
            );

        if (celda.IsEmpty())
        {
            return null;
        }

        if (
            celda.TryGetValue<DateTime>(
                out var fecha
            )
        )
        {
            return DateOnly.FromDateTime(
                fecha
            );
        }

        var texto =
            celda.GetString().Trim();

        if (
            DateTime.TryParse(
                texto,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None,
                out fecha
            ) ||
            DateTime.TryParse(
                texto,
                CultureInfo.GetCultureInfo(
                    "en-US"
                ),
                DateTimeStyles.None,
                out fecha
            )
        )
        {
            return DateOnly.FromDateTime(
                fecha
            );
        }

        return null;
    }

    // Obtiene un decimal de Excel.
    private static decimal?
        ObtenerDecimalOpcional(
            IXLRow fila,
            Dictionary<string, int> columnas,
            string nombreColumna)
    {
        var celda =
            fila.Cell(
                columnas[nombreColumna]
            );

        if (celda.IsEmpty())
        {
            return null;
        }

        if (
            celda.TryGetValue<decimal>(
                out var valor
            )
        )
        {
            return valor;
        }

        var texto =
            celda.GetString()
                .Trim()
                .Replace(
                    ",",
                    ""
                );

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

        return null;
    }

    // Construye la llave lógica de un diseño de arnés.
    private static string CrearClaveArnes(
        string numeroArnes,
        string nivelDiseno)
    {
        return
            $"{numeroArnes.Trim().ToUpperInvariant()}|" +
            $"{nivelDiseno.Trim().ToUpperInvariant()}";
    }

    // Normaliza nombres como Suplr_pn o Assy_start.
    private static string NormalizarEncabezado(
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
}
