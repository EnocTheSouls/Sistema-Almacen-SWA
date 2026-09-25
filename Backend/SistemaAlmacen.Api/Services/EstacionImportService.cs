using ClosedXML.Excel;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Importa estaciones oficiales y las asigna
// a los detalles BOM de una familia.
public sealed class EstacionImportService
{
    private readonly ArnesRepository
        _arnesRepository;

    private readonly MaterialRepository
        _materialRepository;

    private readonly EstacionRepository
        _estacionRepository;

    private readonly BomRepository
        _bomRepository;

    public EstacionImportService(
        ArnesRepository arnesRepository,
        MaterialRepository materialRepository,
        EstacionRepository estacionRepository,
        BomRepository bomRepository)
    {
        _arnesRepository =
            arnesRepository;

        _materialRepository =
            materialRepository;

        _estacionRepository =
            estacionRepository;

        _bomRepository =
            bomRepository;
    }
    // Importa únicamente estaciones únicas
    // en la familia seleccionada.
    public async Task<EstacionImportResult>
        ImportarCatalogoAsync(
            Stream archivo,
            string nombreArchivo,
            int idFamilia)
    {
        var resultado =
            new EstacionImportResult
            {
                NombreArchivo =
                    nombreArchivo
            };

        using var workbook =
            new XLWorkbook(archivo);

        var worksheet =
            workbook.Worksheets
                .FirstOrDefault();

        if (worksheet is null)
        {
            throw new InvalidOperationException(
                "El archivo no contiene hojas."
            );
        }

        var filaEncabezados =
            worksheet.FirstRowUsed();

        if (filaEncabezados is null)
        {
            throw new InvalidOperationException(
                "El archivo no contiene encabezados."
            );
        }

        var columnas =
            ObtenerColumnas(
                filaEncabezados
            );

        if (!columnas.ContainsKey("ESTACION"))
        {
            throw new InvalidOperationException(
                "El archivo debe contener la columna Estacion."
            );
        }

        var numeroFilaEncabezados =
            filaEncabezados.RowNumber();

        var ultimaFila =
            worksheet.LastRowUsed()
                ?.RowNumber() ??
            numeroFilaEncabezados;

        var estacionesProcesadas =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        for (
            var numeroFila =
                numeroFilaEncabezados + 1;
            numeroFila <= ultimaFila;
            numeroFila++
        )
        {
            var fila =
                worksheet.Row(numeroFila);

            if (fila.IsEmpty())
            {
                continue;
            }

            resultado.TotalFilas++;

            try
            {
                var nombreEstacion =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "ESTACION"
                    )
                    .ToUpperInvariant();

                if (
                    string.IsNullOrWhiteSpace(
                        nombreEstacion
                    )
                )
                {
                    resultado
                        .FilasConAdvertencia++;

                    resultado.Advertencias.Add(
                        new AdvertenciaImportacionEstacion
                        {
                            NumeroFila =
                                numeroFila,

                            Mensaje =
                                "La fila no tiene estación y fue omitida."
                        }
                    );

                    continue;
                }

                // Omite estaciones repetidas en el archivo.
                if (
                    !estacionesProcesadas.Add(
                        nombreEstacion
                    )
                )
                {
                    continue;
                }

                if (
                    nombreEstacion.Equals(
                        "1710",
                        StringComparison.OrdinalIgnoreCase
                    ) ||
                    nombreEstacion.Equals(
                        "0919",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    throw new InvalidOperationException(
                        $"El valor {nombreEstacion} no es una estación oficial."
                    );
                }

                var estacionExistente =
                    await _estacionRepository
                        .ObtenerPorFamiliaYNombreAsync(
                            idFamilia,
                            nombreEstacion
                        );

                var estacion =
                    await _estacionRepository
                        .ObtenerOCrearAsync(
                            idFamilia,
                            nombreEstacion
                        );

                if (estacion is null)
                {
                    throw new InvalidOperationException(
                        $"No se pudo crear o localizar la estación {nombreEstacion}."
                    );
                }

                if (estacionExistente is null)
                {
                    resultado
                        .EstacionesCreadas++;

                    resultado
                        .EstacionesCreadasDetalle
                        .Add(estacion.Nombre);
                }
                else
                {
                    resultado
                        .EstacionesExistentes++;

                    resultado
                        .EstacionesExistentesDetalle
                        .Add(estacion.Nombre);
                }

                resultado
                    .FilasCorrectas++;
            }
            catch (Exception ex)
            {
                resultado
                    .FilasConError++;

                resultado.Errores.Add(
                    new ErrorImportacionEstacion
                    {
                        NumeroFila =
                            numeroFila,

                        Mensaje =
                            ex.Message
                    }
                );
            }
        }

        return resultado;
    }

    public async Task<EstacionImportResult>
        ImportarAsync(
            Stream archivo,
            string nombreArchivo,
            int idFamilia)
    {
        var resultado =
            new EstacionImportResult
            {
                NombreArchivo =
                    nombreArchivo
            };

        using var workbook =
            new XLWorkbook(archivo);

        var worksheet =
            workbook.Worksheets
                .FirstOrDefault();

        if (worksheet is null)
        {
            throw new InvalidOperationException(
                "El archivo no contiene hojas."
            );
        }

        var filaEncabezados =
            worksheet.FirstRowUsed();

        if (filaEncabezados is null)
        {
            throw new InvalidOperationException(
                "El archivo no contiene encabezados."
            );
        }

        var columnas =
            ObtenerColumnas(
                filaEncabezados
            );

        ValidarColumnas(
            columnas
        );

        var numeroFilaEncabezados =
            filaEncabezados.RowNumber();

        var ultimaFila =
            worksheet.LastRowUsed()
                ?.RowNumber() ??
            numeroFilaEncabezados;

        for (
            var numeroFila =
                numeroFilaEncabezados + 1;
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

            try
            {
                var numeroArnes =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "PRODUCTNUMBER"
                    );

                var custDsg1 =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "CUSTDSG1"
                    )
                    .ToUpperInvariant();

                var custDsg2 =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "CUSTDSG2"
                    )
                    .ToUpperInvariant();

                var intDsg =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "INTDSG"
                    )
                    .ToUpperInvariant();

                var nivelDiseno =
                    $"{custDsg1}{custDsg2}{intDsg}";

                var numeroMaterial =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "MATERIALNUMBER"
                    );

                var nombreEstacion =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "ESTACION"
                    )
                    .ToUpperInvariant();

                var stdPack =
                    ObtenerDecimalOpcional(
                        fila,
                        columnas,
                        "STDPACK"
                    );

                if (
                    string.IsNullOrWhiteSpace(
                        numeroArnes
                    )
                )
                {
                    throw new InvalidOperationException(
                        "Product Number está vacío."
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        custDsg1
                    ) ||
                    string.IsNullOrWhiteSpace(
                        custDsg2
                    ) ||
                    string.IsNullOrWhiteSpace(
                        intDsg
                    )
                )
                {
                    throw new InvalidOperationException(
                        "No fue posible formar el diseño."
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        numeroMaterial
                    )
                )
                {
                    throw new InvalidOperationException(
                        "Material Number está vacío."
                    );
                }

                if (
                    string.IsNullOrWhiteSpace(
                        nombreEstacion
                    )
                )
                {
                    resultado
                        .FilasConAdvertencia++;

                    resultado.Advertencias.Add(
                        new AdvertenciaImportacionEstacion
                        {
                            NumeroFila =
                                numeroFila,

                            Mensaje =
                                "La fila no tiene estación y fue omitida."
                        }
                    );

                    continue;
                }

                // Bloquea valores procedentes de MRP Flag Section.
                if (
                    nombreEstacion.Equals(
                        "1710",
                        StringComparison
                            .OrdinalIgnoreCase
                    ) ||
                    nombreEstacion.Equals(
                        "0919",
                        StringComparison
                            .OrdinalIgnoreCase
                    )
                )
                {
                    throw new InvalidOperationException(
                        $"El valor {nombreEstacion} no es una estación oficial."
                    );
                }

                if (
                    stdPack.HasValue &&
                    stdPack.Value <= 0
                )
                {
                    stdPack = null;

                    resultado
                        .FilasConAdvertencia++;

                    resultado.Advertencias.Add(
                        new AdvertenciaImportacionEstacion
                        {
                            NumeroFila =
                                numeroFila,

                            Mensaje =
                                "STD Pack no válido. La estación se asignará sin STD Pack."
                        }
                    );
                }

                var arnes =
                    await _arnesRepository
                        .ObtenerPorNumeroYDisenoAsync(
                            numeroArnes,
                            nivelDiseno
                        );

                if (arnes is null)
                {
                    throw new InvalidOperationException(
                        $"El arnés {numeroArnes} con diseño {nivelDiseno} no existe."
                    );
                }

                if (
                    arnes.IdFamilia !=
                    idFamilia
                )
                {
                    throw new InvalidOperationException(
                        $"El arnés {numeroArnes} no pertenece a la familia seleccionada."
                    );
                }

                var material =
                    await _materialRepository
                        .ObtenerPorNumeroParteAsync(
                            numeroMaterial
                        );

                if (material is null)
                {
                    throw new InvalidOperationException(
                        $"El material {numeroMaterial} no existe en el catálogo."
                    );
                }

                var idDetalle =
                    await _bomRepository
                        .ObtenerIdDetalleAsync(
                            arnes.IdArnes,
                            material.IdMaterial
                        );

                if (!idDetalle.HasValue)
                {
                    throw new InvalidOperationException(
                        $"El material {numeroMaterial} no está relacionado con el BOM del arnés {numeroArnes} diseño {nivelDiseno}."
                    );
                }

                var estacionExistente =
                    await _estacionRepository
                        .ObtenerPorFamiliaYNombreAsync(
                            idFamilia,
                            nombreEstacion
                        );

                var estacion =
                    await _estacionRepository
                        .ObtenerOCrearAsync(
                            idFamilia,
                            nombreEstacion
                        );

                if (estacion is null)
                {
                    throw new InvalidOperationException(
                        $"No se pudo crear o localizar la estación {nombreEstacion}."
                    );
                }
                if (estacionExistente is null)
                {
                    resultado
                        .EstacionesCreadas++;

                    resultado
                        .EstacionesCreadasDetalle
                        .Add(estacion.Nombre);
                }
                else
                {
                    resultado
                        .EstacionesExistentes++;

                    resultado
                        .EstacionesExistentesDetalle
                        .Add(estacion.Nombre);
                }


                var asignada =
                    await _bomRepository
                        .AsignarEstacionAsync(
                            idDetalle.Value,
                            estacion.IdEstacion,
                            estacion.Nombre,
                            stdPack
                        );

                if (!asignada)
                {
                    throw new InvalidOperationException(
                        "No se pudo asignar la estación al detalle BOM."
                    );
                }

                resultado
                    .AsignacionesRealizadas++;

                resultado
                    .FilasCorrectas++;
            }
            catch (Exception ex)
            {
                resultado
                    .FilasConError++;

                resultado.Errores.Add(
                    new ErrorImportacionEstacion
                    {
                        NumeroFila =
                            numeroFila,

                        Mensaje =
                            ex.Message
                    }
                );
            }
        }

        return resultado;
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

    private static void ValidarColumnas(
        Dictionary<string, int> columnas)
    {
        var columnasObligatorias =
            new[]
            {
                "PRODUCTNUMBER",
                "CUSTDSG1",
                "CUSTDSG2",
                "INTDSG",
                "MATERIALNUMBER",
                "ESTACION"
            };

        var faltantes =
            columnasObligatorias
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
            .GetString()
            .Trim();
    }

    private static decimal?
        ObtenerDecimalOpcional(
            IXLRow fila,
            Dictionary<string, int> columnas,
            string nombreColumna)
    {
        if (
            !columnas.TryGetValue(
                nombreColumna,
                out var numeroColumna
            )
        )
        {
            return null;
        }

        var celda =
            fila.Cell(
                numeroColumna
            );

        if (
            celda.IsEmpty()
        )
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
                .Trim();

        if (
            decimal.TryParse(
                texto,
                out valor
            )
        )
        {
            return valor;
        }

        return null;
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
}