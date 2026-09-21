using ClosedXML.Excel;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Lee el Excel y crea materiales, arneses y estaciones.
public sealed class BomImportService
{
    private readonly MaterialRepository
        _materialRepository;

    private readonly ArnesRepository
        _arnesRepository;

    private readonly EstacionRepository
        _estacionRepository;

    private readonly BomRepository
    _bomRepository;

    public BomImportService(
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
    public async Task<BomImportResult> ImportarAsync(
        Stream archivo,
        string nombreArchivo,
        int idFamilia,
        string nivelDiseno,
        string version,
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
    workbook.Worksheets.First();

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

        var estacion =
            ObtenerTexto(
                fila,
                columnas,
                "ESTACION"
            );

        var bomQty =
            ObtenerDecimal(
                fila,
                columnas,
                "BOMQTY"
            );

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
            throw new InvalidOperationException(
                "Material Name está vacío."
            );
        }

        if (bomQty <= 0)
        {
            throw new InvalidOperationException(
                "BOM Qty debe ser mayor que cero."
            );
        }

        if (
            stdPack.HasValue &&
            stdPack.Value <= 0
        )
        {
            stdPack = null;

            resultado.Advertencias.Add(
                new AdvertenciaImportacionBom
                {
                    NumeroFila =
                        numeroFila,

                    Mensaje =
                        "STD Pack no es válido. El material se importó sin STD Pack."
                }
            );

            resultado
                .FilasConAdvertencia++;
        }

        var arnes =
            await _arnesRepository
                .ObtenerOCrearAsync(
                    idFamilia,
                    numeroArnes,
                    nivelDiseno
                );

        if (arnes is null)
        {
            throw new InvalidOperationException(
                "No se pudo crear o localizar el arnés."
            );
        }

        var material =
            await _materialRepository
                .ObtenerOCrearDesdeBomAsync(
                    numeroMaterial,
                    nombreMaterial,
                    stdPack
                );

        if (material is null)
        {
            throw new InvalidOperationException(
                "No se pudo crear o actualizar el material."
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

        if (
            !string.IsNullOrWhiteSpace(
                estacion
            )
        )
        {
            var estacionResultado =
                await _estacionRepository
                    .ObtenerOCrearAsync(
                        idFamilia,
                        estacion
                    );

            if (
                estacionResultado is null
            )
            {
                resultado.Advertencias.Add(
                    new AdvertenciaImportacionBom
                    {
                        NumeroFila =
                            numeroFila,

                        Mensaje =
                            "No se pudo crear o identificar la estación."
                    }
                );

                resultado
                    .FilasConAdvertencia++;
            }
        }
        else
        {
            resultado.Advertencias.Add(
                new AdvertenciaImportacionBom
                {
                    NumeroFila =
                        numeroFila,

                    Mensaje =
                        "La estación está vacía."
                }
            );

            resultado
                .FilasConAdvertencia++;
        }

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
                "MATERIALNUMBER",
                "MATERIALNAME",
                "BOMQTY",
                "ESTACION",
                "STDPACK"
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

private static decimal?
    ObtenerDecimalOpcional(
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
        string.IsNullOrWhiteSpace(
            texto
        ) ||
        texto.Equals(
            "#N/D",
            StringComparison
                .OrdinalIgnoreCase
        ) ||
        texto.Equals(
            "#N/A",
            StringComparison
                .OrdinalIgnoreCase
        )
    )
    {
        return null;
    }

    if (
        decimal.TryParse(
            texto,
            out var valor
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