using ClosedXML.Excel;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Lee el BOM, identifica arneses existentes
// y crea materiales y relaciones BOM.
public sealed class BomImportService
{
    private readonly MaterialRepository
        _materialRepository;

    private readonly ArnesRepository
        _arnesRepository;

    private readonly BomRepository
        _bomRepository;

    public BomImportService(
        MaterialRepository materialRepository,
        ArnesRepository arnesRepository,
        BomRepository bomRepository)
    {
        _materialRepository =
            materialRepository;

        _arnesRepository =
            arnesRepository;

        _bomRepository =
            bomRepository;
    }


    public async Task<BomImportResult> ImportarAsync(
     Stream archivo,
     string nombreArchivo,
     long idImportacion,
     int idUsuario)


    {
        var resultado =
            new BomImportResult
            {
                NombreArchivo =
                    nombreArchivo
            };

        using var workbook =
            new XLWorkbook(archivo);

        var worksheet =
      workbook.Worksheets
          .FirstOrDefault(
              hoja =>
                  hoja.Name.Equals(
                      "Bill of Material List (Multi)",
                      StringComparison.OrdinalIgnoreCase
                  )
          );

        if (worksheet is null)
        {
            throw new InvalidOperationException(
                "El archivo no contiene la hoja Bill of Material List (Multi)."
            );
        }
        var filaEncabezados =
            worksheet.FirstRowUsed();

        if (filaEncabezados is null)
        {
            throw new InvalidOperationException(
                "El archivo Excel no contiene encabezados."
            );
        }

        var columnas =
            ObtenerColumnas(
                filaEncabezados
            );

        ValidarColumnasObligatorias(
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
.Trim()
.ToUpperInvariant();

                var custDsg2 =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "CUSTDSG2"
                    )
                    .Trim()
                    .ToUpperInvariant();

                var intDsg =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "INTDSG"
                    )
                    .Trim()
                    .ToUpperInvariant();

                var nivelDiseno =
                    $"{custDsg1}{custDsg2}{intDsg}";



                var numeroMaterial =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "MATERIALNUMBER"
                    );

                var nombreMaterial =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "MATERIALNAME"
                    );

                var genericCode =
                    ObtenerTexto(
                        fila,
                        columnas,
                        "GENERICCODE"
                    )
                    .Trim()
                    .ToUpperInvariant();

                // La estación se asignará posteriormente
                // con información proporcionada por la empresa.
                string? estacion = null;

                var bomQty =
                    ObtenerDecimal(
                        fila,
                        columnas,
                        "BOMQTY"
                    );
                decimal? stdPack = null;


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

                if (
    string.IsNullOrWhiteSpace(
        nombreMaterial
             )
            )
                {
                    if (
    genericCode.Equals(
        "W",
        StringComparison.OrdinalIgnoreCase
    )
)
                    {
                        nombreMaterial =
                            numeroMaterial;
                    }
                    else
                    {
                        throw new InvalidOperationException(
                            "Material Name está vacío."
                        );
                    }
                }



                if (bomQty <= 0)
                {
                    throw new InvalidOperationException(
                        "BOM Qty debe ser mayor que cero."
                    );
                }

                // Verifica que las tres partes del diseño existan.
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
                        $"No fue posible formar el diseño del arnés {numeroArnes}."
                    );
                }

                // Busca el arnés exacto por número y diseño.
                var arnes =
                    await _arnesRepository
                        .ObtenerPorNumeroYDisenoAsync(
                            numeroArnes,
                            nivelDiseno
                        );

                if (arnes is null)
                {
                    throw new InvalidOperationException(
                        $"El arnés {numeroArnes} con diseño {nivelDiseno} no existe en el 5MF."
                    );
                }


                // La versión se obtiene automáticamente
                // del nombre del archivo BOM.
                var version =
                    Path.GetFileNameWithoutExtension(
                        nombreArchivo
                    )
                    .Trim()
                    .ToUpperInvariant();

                var material =
       await _materialRepository
           .ObtenerOCrearDesdeBomAsync(
               numeroMaterial,
               nombreMaterial,
               genericCode,
               stdPack
           );

                if (material is null)
                {
                    throw new InvalidOperationException(
                        "No se pudo crear o localizar el material."
                    );
                }
                var idBom =
    await _bomRepository
        .ObtenerOCrearAsync(
            idImportacion,
            arnes.IdArnes,
            version,
            nombreArchivo,
            idUsuario
        );

                await _bomRepository
                    .GuardarDetalleAsync(
                        idBom,
                        material.IdMaterial,
                        numeroFila,
                        bomQty,
                        estacion,
                        stdPack
                    );

                resultado.FilasCorrectas++;
            }
            catch (Exception ex)
            {
                resultado.FilasConError++;

                resultado.Errores.Add(
                    new ErrorImportacionBom
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

    private static void
        ValidarColumnasObligatorias(
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
        "MATERIALNAME",
        "GENERICCODE",
        "BOMQTY"
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
        var numeroColumna =
            columnas[nombreColumna];

        return fila
            .Cell(numeroColumna)
            .GetString()
            .Trim();
    }

    private static decimal ObtenerDecimal(
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

        if (
            decimal.TryParse(
                texto,
                out var valor
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
}