using Microsoft.AspNetCore.Mvc;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Controllers;

[ApiController]
[Route("api/estaciones")]
public sealed class EstacionesController
    : ControllerBase
{
    private readonly EstacionRepository
        _estacionRepository;

    private readonly EstacionImportService
        _estacionImportService;

    public EstacionesController(
        EstacionRepository estacionRepository,
        EstacionImportService estacionImportService)
    {
        _estacionRepository =
            estacionRepository;

        _estacionImportService =
            estacionImportService;
    }
    // Importa estaciones oficiales para una familia.
    [HttpPost("importar/{idFamilia:int}")]
    public async Task<IActionResult>
        ImportarEstacionesAsync(
            int idFamilia,
            [FromForm] IFormFile archivo)
    {
        if (idFamilia <= 0)
        {
            return BadRequest(
                new
                {
                    mensaje =
                        "La familia seleccionada no es válida."
                }
            );
        }

        if (
            archivo is null ||
            archivo.Length == 0
        )
        {
            return BadRequest(
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
            return BadRequest(
                new
                {
                    mensaje =
                        "El archivo debe tener extensión .xlsx."
                }
            );
        }

        try
        {
            await using var stream =
                archivo.OpenReadStream();

            var resultado =
        await _estacionImportService
        .ImportarCatalogoAsync(
            stream,
            archivo.FileName,
            idFamilia
        );
            return Ok(
                new
                {
                    mensaje =
                        "La importación de estaciones terminó correctamente.",

                    resultado
                }
            );
        }
        catch (
            InvalidOperationException ex
        )
        {
            return BadRequest(
                new
                {
                    mensaje =
                        ex.Message
                }
            );
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine(
                "Error al importar estaciones:"
            );

            Console.Error.WriteLine(ex);

            return StatusCode(
                StatusCodes
                    .Status500InternalServerError,
                new
                {
                    mensaje =
                        "Ocurrió un error al importar las estaciones."
                }
            );
        }
    }
}