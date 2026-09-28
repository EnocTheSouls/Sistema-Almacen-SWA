using ClosedXML.Excel;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Importa la estación asignada a cada material
// y actualiza la relación correspondiente del BOM.
public sealed class MaterialStationImportService
{
    private readonly MaterialRepository
        _materialRepository;

    private readonly ArnesRepository
        _arnesRepository;

    private readonly EstacionRepository
        _estacionRepository;

    private readonly BomRepository
        _bomRepository;

    public MaterialStationImportService(
        MaterialRepository materialRepository,
        ArnesRepository arnesRepository,
        EstacionRepository estacionRepository,
        BomRepository bomRepository)
    {
        _materialRepository =
            materialRepository;

        _arnesRepository =
            arnesRepository;

        _estacionRepository =
            estacionRepository;

        _bomRepository =
            bomRepository;
    }

    public async Task<MaterialStationImportResult>
        ImportarAsync(
            Stream archivo,
            string nombreArchivo)
    {
        var resultado =
            new MaterialStationImportResult
            {
                NombreArchivo =
                    nombreArchivo
            };

        using var workbook =
            new XLWorkbook(
                archivo
            );

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

        var ultimaFila =
            worksheet.LastRowUsed()
                ?.RowNumber() ?? 1;

        for (
            var numeroFila = 2;
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

            var numeroArnes =
                ObtenerTextoOpcional(
                    fila,
                    columnas,
                    "PRODUCTNUMBER"
                );

            var numeroMaterial =
                ObtenerTextoOpcional(
                    fila,
                    columnas,
                    "MATERIALNUMBER"
                );

            var nombreEstacion =
                ObtenerTextoOpcional(
                    fila,
                    columnas,
                    "ESTACION"
                );

            try
            {
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
                        numeroMaterial
                    )
                )
                {
                    throw new InvalidOperationException(
                        "Material Number está vacío."
                    );
                }

                // Las filas sin estación se omiten.
                if (
                    string.IsNullOrWhiteSpace(
                        nombreEstacion
                    )
                )
                {
                    resultado.FilasSinEstacion++;
                    continue;
                }

                var custDsg1 =
                    ObtenerTextoOpcional(
                        fila,
                        columnas,
                        "CUSTDSG1"
                    )
                    .ToUpperInvariant();

                var custDsg2 =
                    ObtenerTextoOpcional(
                        fila,
                        columnas,
                        "CUSTDSG2"
                    )
                    .ToUpperInvariant();

                var intDsg =
                    ObtenerTextoOpcional(
                        fila,
                        columnas,
                        "INTDSG"
                    )
                    .ToUpperInvariant();

                var nivelDiseno =
                    $"{custDsg1}{custDsg2}{intDsg}";

                if (
                    string.IsNullOrWhiteSpace(
                        nivelDiseno
                    )
                )
                {
                    throw new InvalidOperationException(
                        "No fue posible formar el diseño del arnés."
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
                        $"No existe el arnés {numeroArnes} con diseño {nivelDiseno}."
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
                        $"No existe el material {numeroMaterial}."
                    );
                }

                var estacion =
                    await _estacionRepository
                        .ObtenerPorFamiliaYNombreAsync(
                            arnes.IdFamilia,
                            nombreEstacion
                        );

                if (estacion is null)
                {
                    throw new InvalidOperationException(
                        $"La estación {nombreEstacion} no existe en la familia del arnés {numeroArnes}."
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
                        $"No existe una relación BOM para el arnés {numeroArnes} y el material {numeroMaterial}."
                    );
                }

                var stdPack =
                    ObtenerDecimalOpcional(
                        fila,
                        columnas,
                        "STDPACK"
                    );

                var asignado =
                    await _bomRepository
                        .AsignarEstacionAsync(
                            idDetalle.Value,
                            estacion.IdEstacion,
                            estacion.Nombre,
                            stdPack
                        );

                if (!asignado)
                {
                    throw new InvalidOperationException(
                        "No se pudo actualizar el detalle del BOM."
                    );
                }

                resultado.FilasCorrectas++;
                resultado.AsignacionesRealizadas++;
            }
            catch (Exception ex)
            {
                resultado.FilasConError++;

                resultado.Errores.Add(
                    new MaterialStationImportError
                    {
                        NumeroFila =
                            numeroFila,

                        NumeroArnes =
                            numeroArnes,

                        NumeroMaterial =
                            numeroMaterial,

                        Estacion =
                            nombreEstacion,

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
            new Dictionary<string, int>(
                StringComparer.OrdinalIgnoreCase
            );

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
                string.IsNullOrWhiteSpace(
                    encabezado
                )
            )
            {
                continue;
            }

            // Conserva la primera columna
            // cuando hay encabezados repetidos.
            if (
                !columnas.ContainsKey(
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

    private static string
        ObtenerTextoOpcional(
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
            return string.Empty;
        }

        return fila
            .Cell(numeroColumna)
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
            return valor > 0
                ? valor
                : null;
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
            return valor > 0
                ? valor
                : null;
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