using System.Linq;
using System.IO.Compression;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Models;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Spreadsheet;
using DocumentFormat.OpenXml;

namespace SistemaAlmacen.Api.Services;

// Genera las listas de arneses para cargar en IPS.
public sealed class IpsExportService
{
    private readonly ArnesRepository
        _arnesRepository;

    private readonly IWebHostEnvironment
        _environment;

    public IpsExportService(
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
                .ObtenerProductosParaIpsAsync();

        if (productos.Count == 0)
        {
            throw new InvalidOperationException(
                "No existen arneses activos para generar las listas Ips."
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

                var archivoCsv =
                    GenerarCsvProyecto(
                        productosProyecto
                );

                var nombreArchivo =
                    $"BOM_LIST_{proyecto}.csv";

                var entradaZip =
                    zip.CreateEntry(
                        nombreArchivo,
                        CompressionLevel.Optimal
                    );

                await using var entradaStream =
                    entradaZip.Open();

                await entradaStream.WriteAsync(
                    archivoCsv
                );
            }
        }

        return zipStream.ToArray();
    }

    private static byte[] GenerarCsvProyecto(
    List<IpsProductRow> productos)
    {
        var lineas =
            new List<string>
            {
            "Product Number,Product Design"
            };

        foreach (var producto in productos)
        {
            lineas.Add(
                $"{producto.ProductNumber.Trim().ToUpperInvariant()},{producto.ProductDesign.Trim().ToUpperInvariant()}"
            );
        }

        return System.Text.Encoding.UTF8.GetBytes(
            string.Join(
                Environment.NewLine,
                lineas
            )
        );
    }

    // Valida los límites establecidos por IPS.
    private static void ValidarProductos(
        string proyecto,
        List<IpsProductRow> productos)
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