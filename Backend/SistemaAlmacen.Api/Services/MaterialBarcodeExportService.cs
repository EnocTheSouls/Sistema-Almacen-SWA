using ClosedXML.Excel;
using SkiaSharp;
using SistemaAlmacen.Api.Data;
using ZXing;
using ZXing.Common;
using ZXing.SkiaSharp.Rendering;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Genera un Excel con los códigos de barras
// de todos los materiales del catálogo.
public sealed class MaterialBarcodeExportService
{
    private readonly BomRepository
    _bomRepository;



    public MaterialBarcodeExportService(
    BomRepository bomRepository)
    {
        _bomRepository =
            bomRepository;
    }





    public async Task<byte[]>
    GenerarExcelAsync()
    {
        var relaciones =
            await _bomRepository
                .ObtenerRelacionesCodigosBarrasAsync();

        var relacionesConEstacion =
            relaciones
                .Where(
                    relacion =>
                        relacion.IdEstacion.HasValue
                )
                .ToList();

        if (relacionesConEstacion.Count == 0)
        {
            throw new InvalidOperationException(
                "No existen materiales relacionados con una estación para generar etiquetas QR."
            );
        }

        using var workbook =
    new XLWorkbook();

        CrearHojaDatosQr(
            workbook,
            relacionesConEstacion
        );

        CrearHojaEtiquetasQr(
            workbook,
            relacionesConEstacion
        );








        using var archivo =
            new MemoryStream();

        workbook.SaveAs(
            archivo
        );

        return archivo.ToArray();
    }

    private static void CrearHojaDatosQr(
     XLWorkbook workbook,
     List<MaterialBarcodeRelationRow> relaciones)
    {
        var worksheet =
            workbook.Worksheets.Add(
                "QR_DATA"
     );

        var encabezados =
            new[]
            {
            "Proyecto",
            "Familia",
            "Arnés",
            "Diseño",
            "Estación",
            "Número de parte",
            "Descripción",
            "ID detalle BOM",
            "ID material",
            "Contenido QR",
            "Etiqueta QR"
            };

        for (
            var columna = 1;
            columna <= encabezados.Length;
            columna++
        )
        {
            worksheet.Cell(
                1,
                columna
            ).Value =
                encabezados[
                    columna - 1
                ];
        }

        var encabezado =
            worksheet.Range(
                1,
                1,
                1,
                encabezados.Length
            );

        encabezado.Style.Font.Bold =
            true;

        encabezado.Style.Font.FontColor =
            XLColor.White;

        encabezado.Style.Fill.BackgroundColor =
            XLColor.FromHtml(
                "#102957"
            );

        encabezado.Style.Alignment.Horizontal =
            XLAlignmentHorizontalValues.Center;

        encabezado.Style.Alignment.Vertical =
            XLAlignmentVerticalValues.Center;

        worksheet.Row(1).Height = 28;

        // Solo exporta relaciones con estación asignada.
        var filasExportables =
            relaciones
                .Where(
                    relacion =>
                        relacion.IdEstacion.HasValue
                )
                .GroupBy(
                    relacion =>
                        relacion.IdBomDetalle
                )
                .Select(
                    grupo =>
                        grupo.First()
                )
                .OrderBy(
                    relacion =>
                        relacion.Proyecto
                )
                .ThenBy(
                    relacion =>
                        relacion.Familia
                )
                .ThenBy(
                    relacion =>
                        relacion.Estacion
                )
                .ThenBy(
                    relacion =>
                        relacion.NumeroArnes
                )
                .ThenBy(
                    relacion =>
                        relacion.NumeroParteMaterial
                )
                .ToList();

        var numeroFila = 2;

        foreach (
            var relacion in filasExportables
        )
        {
            worksheet.Cell(
                numeroFila,
                1
            ).Value =
                relacion.Proyecto;

            worksheet.Cell(
                numeroFila,
                2
            ).Value =
                relacion.Familia;

            worksheet.Cell(
                numeroFila,
                3
            ).Value =
                relacion.NumeroArnes;

            worksheet.Cell(
                numeroFila,
                4
            ).Value =
                relacion.DisenoArnes;

            worksheet.Cell(
                numeroFila,
                5
            ).Value =
                relacion.Estacion;

            worksheet.Cell(
                numeroFila,
                6
            ).Value =
                relacion.NumeroParteMaterial;

            worksheet.Cell(
                numeroFila,
                7
            ).Value =
                relacion.Descripcion;

            worksheet.Cell(
                numeroFila,
                8
            ).Value =
                relacion.IdBomDetalle;

            worksheet.Cell(
                numeroFila,
                9
            ).Value =
                relacion.IdMaterial;

            worksheet.Cell(
                numeroFila,
                10
            ).Value =
                relacion.ContenidoQr;

            var imagenQr =
                GenerarQr(
                    relacion.ContenidoQr
                );

            using var imagenStream =
                new MemoryStream(
                    imagenQr
                );

            worksheet
                .AddPicture(
                    imagenStream,
                    $"QR_{relacion.IdBomDetalle}"
                )
                .MoveTo(
                    worksheet.Cell(
                        numeroFila,
                        11
                    )
                )
                .WithSize(
                    82,
                    82
                );

            worksheet.Row(
                numeroFila
            ).Height = 66;

            numeroFila++;
        }

        worksheet.SheetView
            .FreezeRows(1);

        worksheet.Column(1).Width = 18;
        worksheet.Column(2).Width = 24;
        worksheet.Column(3).Width = 22;
        worksheet.Column(4).Width = 12;
        worksheet.Column(5).Width = 20;
        worksheet.Column(6).Width = 24;
        worksheet.Column(7).Width = 38;
        worksheet.Column(8).Width = 16;
        worksheet.Column(9).Width = 14;
        worksheet.Column(10).Width = 68;
        worksheet.Column(11).Width = 15;

        if (numeroFila > 2)
        {
            worksheet.Range(
                1,
                1,
                numeroFila - 1,
                11
            ).SetAutoFilter();

            worksheet.Range(
                2,
                1,
                numeroFila - 1,
                11
            ).Style.Alignment.Vertical =
                XLAlignmentVerticalValues.Center;

            worksheet.Range(
                2,
                6,
                numeroFila - 1,
                6
            ).Style.NumberFormat.Format =
                "@";

            worksheet.Range(
                2,
                10,
                numeroFila - 1,
                10
            ).Style.NumberFormat.Format =
                "@";

            worksheet.Range(
                2,
                7,
                numeroFila - 1,
                7
            ).Style.Alignment.WrapText =
                true;

            worksheet.Range(
                2,
                10,
                numeroFila - 1,
                10
            ).Style.Alignment.WrapText =
                true;
        }
    }

    private static void CrearHojaEtiquetasQr(
    XLWorkbook workbook,
    List<MaterialBarcodeRelationRow> relaciones)
    {
        var worksheet =
            workbook.Worksheets.Add(
                "ETIQUETAS_QR"
            );

        var filasExportables =
            relaciones
                .Where(x => x.IdEstacion.HasValue)
                .GroupBy(x => x.IdBomDetalle)
                .Select(x => x.First())
                .OrderBy(x => x.Estacion)
                .ThenBy(x => x.NumeroParteMaterial)
                .ToList();

        int indice = 0;

        foreach (var relacion in filasExportables)
        {
            var pagina =
                indice / 9;

            var posicionPagina =
                indice % 9;

            var filaPagina =
                posicionPagina / 3;

            var columnaPagina =
                posicionPagina % 3;

            var filaBloque =
                pagina * 20 +
                filaPagina * 6 +
                2;

            var columnaBloque =
                columnaPagina * 4 +
                2;

            var bloque =
                worksheet.Range(
                    filaBloque,
                    columnaBloque,
                    filaBloque + 4,
                    columnaBloque + 3
                );

            bloque.Style.Border.OutsideBorder =
                XLBorderStyleValues.Thick;

            bloque.Style.Alignment.Horizontal =
                XLAlignmentHorizontalValues.Center;

            bloque.Style.Alignment.Vertical =
                XLAlignmentVerticalValues.Center;

            var qr =
                GenerarQr(
                    relacion.ContenidoQr
                );

            using var stream =
                new MemoryStream(qr);

            worksheet
                .AddPicture(
                    stream,
                    $"ETIQ_{relacion.IdBomDetalle}"
                )
                .MoveTo(
                    worksheet.Cell(
                        filaBloque,
                        columnaBloque
                    )
                )
                .WithSize(
                    70,
                    70
                );

            var celdaEstacion =
                worksheet.Cell(
                    filaBloque + 1,
                    columnaBloque + 2
                );

            celdaEstacion.Value =
                relacion.Estacion;

            celdaEstacion.Style.Font.Bold =
                true;

            celdaEstacion.Style.Alignment.Horizontal =
                XLAlignmentHorizontalValues.Center;

            var celdaMaterial =
                worksheet.Cell(
                    filaBloque + 2,
                    columnaBloque + 2
                );

            celdaMaterial.Value =
                relacion.NumeroParteMaterial;

            celdaMaterial.Style.Font.Bold =
                true;

            celdaMaterial.Style.Alignment.Horizontal =
                XLAlignmentHorizontalValues.Center;

            indice++;
        }

        // Columnas para plantilla 3 x 3
        for (int c = 1; c <= 15; c++)
        {
            worksheet.Column(c).Width = 10;
        }

        // Separadores
        worksheet.Column(1).Width = 2;
        worksheet.Column(5).Width = 2;
        worksheet.Column(9).Width = 2;
        worksheet.Column(13).Width = 2;

        // Altura fija para impresión
        for (int r = 1; r <= 200; r++)
        {
            worksheet.Row(r).Height = 22;
        }

        worksheet.PageSetup.PageOrientation =
            XLPageOrientation.Portrait;

        worksheet.PageSetup.FitToPages(
            1,
            0
        );
    }






    // Genera el QR contextual del material.
    private static byte[]
        GenerarQr(
            string contenido)
    {
        var opciones =
            new EncodingOptions
            {
                Width = 320,
                Height = 320,
                Margin = 2,
                PureBarcode = true
            };

        var generador =
            new BarcodeWriter<SKBitmap>
            {
                Format =
                    BarcodeFormat.QR_CODE,

                Options =
                    opciones,

                Renderer =
                    new SKBitmapRenderer()
            };

        using var bitmap =
            generador.Write(
                contenido
            );

        using var imagen =
            SKImage.FromBitmap(
                bitmap
            );

        using var datos =
            imagen.Encode(
                SKEncodedImageFormat.Png,
                100
            );

        return datos.ToArray();
    }

    private static byte[]
        GenerarCodigoBarras(
            string codigo)
    {
        var opciones =
            new EncodingOptions
            {
                Width = 660,
                Height = 88,
                Margin = 12,
                PureBarcode = true
            };

        var generador =
       new BarcodeWriter<SKBitmap>
       {
           Format =
               BarcodeFormat.CODE_128,

           Options =
               opciones,

           Renderer =
               new SKBitmapRenderer()
       };

        using var bitmap =
            generador.Write(
                codigo
            );

        using var imagen =
            SKImage.FromBitmap(
                bitmap
            );

        using var datos =
            imagen.Encode(
                SKEncodedImageFormat.Png,
                100
            );

        return datos.ToArray();
    }
}