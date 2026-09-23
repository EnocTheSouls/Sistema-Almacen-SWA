using System.Linq;
using System.IO.Compression;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml;

namespace SistemaAlmacen.Api.Services;

// Genera las listas de arneses para cargar en PICS.
public sealed class PicsExportService
{
    private readonly ArnesRepository
        _arnesRepository;

    private readonly IWebHostEnvironment
        _environment;

    public PicsExportService(
        ArnesRepository arnesRepository,
        IWebHostEnvironment environment)
    {
        _arnesRepository =
            arnesRepository;

        _environment =
            environment;
    }

    // Genera un ZIP con un archivo Excel
    // separado para cada proyecto.
    public async Task<byte[]>
        GenerarListasAsync()
    {
        var productos =
            await _arnesRepository
                .ObtenerProductosParaPicsAsync();

        if (productos.Count == 0)
        {
            throw new InvalidOperationException(
                "No existen arneses activos para generar las listas PICS."
            );
        }

        var rutaPlantilla =
            Path.Combine(
                _environment.ContentRootPath,
                "Templates",
                "BOM_LIST_COMBINED_UPLOAD.XLSX"
            );

        if (!File.Exists(rutaPlantilla))
        {
            throw new FileNotFoundException(
                "No se encontró la plantilla BOM_LIST_COMBINED_UPLOAD.XLSX.",
                rutaPlantilla
            );
        }

        var informacionPlantilla =
            new FileInfo(
                rutaPlantilla
            );

        if (informacionPlantilla.Length == 0)
        {
            throw new InvalidOperationException(
                "La plantilla BOM_LIST_COMBINED_UPLOAD.XLSX está vacía."
            );
        }

        var productosPorProyecto =
            productos
                .GroupBy(
                    producto =>
                        producto.Proyecto,
                    StringComparer.OrdinalIgnoreCase
                )
                .OrderBy(
                    grupo =>
                        grupo.Key
                )
                .ToList();

        using var zipStream =
            new MemoryStream();

        using (
            var zip =
                new ZipArchive(
                    zipStream,
                    ZipArchiveMode.Create,
                    true
                )
        )
        {
            foreach (
                var grupoProyecto in
                productosPorProyecto
            )
            {
                var proyecto =
                    LimpiarNombreProyecto(
                        grupoProyecto.Key
                    );

                var productosProyecto =
                    grupoProyecto
                        .OrderBy(
                            producto =>
                                producto.ProductNumber,
                            StringComparer.OrdinalIgnoreCase
                        )
                        .ThenBy(
                            producto =>
                                producto.ProductDesign,
                            StringComparer.OrdinalIgnoreCase
                        )
                        .ToList();

                ValidarProductos(
                    proyecto,
                    productosProyecto
                );

                var archivoExcel =
                    GenerarExcelProyecto(
                        rutaPlantilla,
                        proyecto,
                        productosProyecto
                    );

                var nombreArchivo =
                    $"BOM_LIST_{proyecto}_UPLOAD.xlsx";

                var entradaZip =
                    zip.CreateEntry(
                        nombreArchivo,
                        CompressionLevel.Optimal
                    );

                await using var entradaStream =
                    entradaZip.Open();

                await entradaStream.WriteAsync(
                    archivoExcel
                );
            }
        }

        return zipStream.ToArray();
    }
    private static byte[] GenerarExcelProyecto(
    string rutaPlantilla,
    string proyecto,
    List<PicsProductRow> productos)
    {
        var rutaTemporal =
            Path.Combine(
                Path.GetTempPath(),
                $"{Guid.NewGuid()}.xlsx"
            );

        File.Copy(
            rutaPlantilla,
            rutaTemporal,
            true
        );

        using (
            var document =
                SpreadsheetDocument.Open(
                    rutaTemporal,
                    true
                )
        )
        {
            var workbookPart =
                document.WorkbookPart!;

            var sheet =
                workbookPart.Workbook
                    .Descendants<Sheet>()
                    .FirstOrDefault(
                        s =>
                            s.Name?.Value ==
                            "PRODUCTS"
                    );

            if (sheet is null)
            {
                throw new InvalidOperationException(
                    "La plantilla no contiene la hoja PRODUCTS."
                );
            }

            var worksheetPart =
                (WorksheetPart)
                workbookPart.GetPartById(
                    sheet.Id!
                );

            var sheetData =
                worksheetPart.Worksheet
                    .GetFirstChild<SheetData>();

            var fila2 =
                sheetData!.Elements<Row>()
                .First(r => r.RowIndex == 2);

            var celdasFila2 =
                fila2.Elements<Cell>().ToList();

            Console.WriteLine(
                $"Fila2 celdas: {celdasFila2.Count}"
            );

            foreach (var celda in celdasFila2)
            {
                Console.WriteLine(
                    $"Celda: {celda.CellReference}"
                );
            }





            uint fila = 2;

            foreach (var producto in productos)
            {
                var row =
     sheetData!
         .Elements<Row>()
         .FirstOrDefault(
             r =>
                 r.RowIndex?.Value == fila
         );

                if (row == null)
                {
                    break;
                }

                var celdas =
                    row.Elements<Cell>()
                        .ToList();

                if (celdas.Count >= 2)
                {
                    celdas[0].CellValue =
                        new CellValue(
                            producto.ProductNumber
                                .Trim()
                                .ToUpperInvariant()
         );

                    celdas[1].CellValue =
                        new CellValue(
                            producto.ProductDesign
                                .Trim()
                                .ToUpperInvariant()
                        );
                }
                fila++;
            }



            worksheetPart.Worksheet.Save();


        }

        var bytes =
            File.ReadAllBytes(
                rutaTemporal
            );

        File.Delete(
            rutaTemporal
        );

        return bytes;
    }
    // Valida los límites establecidos por PICS.
    private static void ValidarProductos(
        string proyecto,
        List<PicsProductRow> productos)
    {
        foreach (
            var producto in productos
        )
        {
            if (
                string.IsNullOrWhiteSpace(
                    producto.ProductNumber
                )
            )
            {
                throw new InvalidOperationException(
                    $"El proyecto {proyecto} contiene un arnés sin Product Number."
                );
            }

            if (
                producto.ProductNumber
                    .Trim()
                    .Length > 18
            )
            {
                throw new InvalidOperationException(
                    $"El Product Number {producto.ProductNumber} del proyecto {proyecto} excede 18 caracteres."
                );
            }

            if (
                string.IsNullOrWhiteSpace(
                    producto.ProductDesign
                )
            )
            {
                throw new InvalidOperationException(
                    $"El arnés {producto.ProductNumber} del proyecto {proyecto} no tiene Product Design."
                );
            }

            if (
                producto.ProductDesign
                    .Trim()
                    .Length > 8
            )
            {
                throw new InvalidOperationException(
                    $"El Product Design {producto.ProductDesign} del arnés {producto.ProductNumber} excede 8 caracteres."
                );
            }
        }
    }

    // Limpia el nombre utilizado en el archivo.
    private static string LimpiarNombreProyecto(
        string proyecto)
    {
        var nombreLimpio =
            proyecto
                .Trim()
                .ToUpperInvariant();

        foreach (
            var caracterInvalido in
            Path.GetInvalidFileNameChars()
        )
        {
            nombreLimpio =
                nombreLimpio.Replace(
                    caracterInvalido,
                    '_'
                );
        }

        return nombreLimpio;
    }
}