using System.Text;
using SistemaAlmacen.Api.Data;

namespace SistemaAlmacen.Api.Services;

// Genera archivos BOM List usando
// los planes vigentes del 5MF.
public sealed class BomListExportService
{
    private readonly MySqlConnectionFactory
        _connectionFactory;

    public BomListExportService(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory =
            connectionFactory;
    }

    // Genera los archivos de todos
    // los proyectos compatibles.
    public async Task<
        Dictionary<string, byte[]>
    > GenerarTodosAsync()
    {
        var proyectos =
            new[]
            {
                "RIV",
                "WS",
                "DT"
            };

        var archivos =
            new Dictionary<
                string,
                byte[]
            >(
                StringComparer.OrdinalIgnoreCase
            );

        foreach (
            var proyecto
            in proyectos
        )
        {
            var resultado =
                await GenerarPorProyectoAsync(
                    proyecto
                );

            archivos[proyecto] =
                resultado.Contenido;
        }

        return archivos;
    }

    // Genera el CSV y el resumen
    // de revisión de un proyecto.
    public async Task<BomListResultado>
        GenerarPorProyectoAsync(
            string proyecto)
    {
        var proyectoNormalizado =
            NormalizarProyecto(
                proyecto
            );

        if (
            proyectoNormalizado is null
        )
        {
            throw new ArgumentException(
                "El proyecto debe ser RIV, WS o DT.",
                nameof(proyecto)
            );
        }

        var registros =
            await ObtenerArnesesAsync(
                proyectoNormalizado
            );

        var contenido =
            new StringBuilder();

        contenido.AppendLine(
            "Product Number,Product Design"
        );

        var llavesAgregadas =
            new HashSet<string>(
                StringComparer.OrdinalIgnoreCase
            );

        var advertencias =
            new List<
                BomListAdvertencia
            >();

        var totalDuplicados =
            0;

        foreach (
            var registro
            in registros
        )
        {
            var numeroArnes =
                registro.NumeroArnes
                    .Trim()
                    .ToUpperInvariant();

            var disenoOriginal =
                registro.NivelDiseno
                    .Trim()
                    .ToUpperInvariant();

            var nivelDiseno =
                NormalizarDiseno(
                    disenoOriginal
                );

            if (
                string.IsNullOrWhiteSpace(
                    numeroArnes
                )
            )
            {
                advertencias.Add(
                    new BomListAdvertencia
                    {
                        NumeroArnes =
                            "(vacío)",

                        DisenoOriginal =
                            disenoOriginal,

                        Motivo =
                            "El número de arnés está vacío."
                    }
                );

                continue;
            }

            if (
                string.IsNullOrWhiteSpace(
                    nivelDiseno
                )
            )
            {
                advertencias.Add(
                    new BomListAdvertencia
                    {
                        NumeroArnes =
                            numeroArnes,

                        DisenoOriginal =
                            disenoOriginal,

                        Motivo =
                            "El diseño está vacío después de normalizarlo."
                    }
                );

                continue;
            }

            // Informa diseños posiblemente incorrectos.
            // No se exportan hasta ser revisados.
            if (
                !nivelDiseno.StartsWith(
                    "Q",
                    StringComparison.Ordinal
                )
            )
            {
                advertencias.Add(
                    new BomListAdvertencia
                    {
                        NumeroArnes =
                            numeroArnes,

                        DisenoOriginal =
                            disenoOriginal,

                        Motivo =
                            "El diseño normalizado no comienza con Q."
                    }
                );

                continue;
            }

            var clave =
                $"{numeroArnes}|" +
                $"{nivelDiseno}";

            if (
                !llavesAgregadas.Add(
                    clave
                )
            )
            {
                totalDuplicados++;

                continue;
            }

            contenido.Append(
                EscaparCsv(
                    numeroArnes
                )
            );

            contenido.Append(
                ','
            );

            contenido.AppendLine(
                EscaparCsv(
                    nivelDiseno
                )
            );
        }

        // Agrega BOM UTF-8 para que Excel
        // reconozca correctamente el archivo.
        var preambulo =
            Encoding.UTF8.GetPreamble();

        var datos =
            Encoding.UTF8.GetBytes(
                contenido.ToString()
            );

        var archivo =
            new byte[
                preambulo.Length +
                datos.Length
            ];

        Buffer.BlockCopy(
            preambulo,
            0,
            archivo,
            0,
            preambulo.Length
        );

        Buffer.BlockCopy(
            datos,
            0,
            archivo,
            preambulo.Length,
            datos.Length
        );

        return new BomListResultado
        {
            Contenido =
                archivo,

            TotalExportados =
                llavesAgregadas.Count,

            TotalDuplicados =
                totalDuplicados,

            Advertencias =
                advertencias
        };
    }

    // Obtiene solamente los arneses
    // relacionados con planes vigentes.
    private async Task<
        List<BomListRegistro>
    > ObtenerArnesesAsync(
        string proyecto)
    {
        var registros =
            new List<BomListRegistro>();

        await using var connection =
            _connectionFactory
                .CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT DISTINCT
                a.numero_parte_arnes,
                a.nivel_diseno

            FROM plan_semanal_arnes AS ps

            INNER JOIN arneses AS a
                ON a.id_arnes =
                   ps.id_arnes

            INNER JOIN familias AS f
                ON f.id_familia =
                   a.id_familia

            INNER JOIN proyectos AS p
                ON p.id_proyecto =
                   f.id_proyecto

            INNER JOIN importaciones_5mf AS i
                ON i.id_importacion_5mf =
                   ps.id_importacion_5mf

            WHERE ps.activo = TRUE
              AND a.activo = TRUE
              AND f.activo = TRUE
              AND p.activo = TRUE

              AND i.estado =
                  'Completado'

              AND UPPER(
                    TRIM(p.nombre)
                  ) =
                  @proyecto

            ORDER BY
                a.numero_parte_arnes,
                a.nivel_diseno;
            """;

        command.Parameters.AddWithValue(
            "@proyecto",
            proyecto
        );

        await using var reader =
            await command
                .ExecuteReaderAsync();

        while (
            await reader.ReadAsync()
        )
        {
            registros.Add(
                new BomListRegistro
                {
                    NumeroArnes =
                        reader.GetString(
                            "numero_parte_arnes"
                        ),

                    NivelDiseno =
                        reader.GetString(
                            "nivel_diseno"
                        )
                }
            );
        }

        return registros;
    }

    // Convierte RIVIAN a la clave RIV.
    private static string?
        NormalizarProyecto(
            string? proyecto)
    {
        var valor =
            proyecto
                ?.Trim()
                .ToUpperInvariant();

        return valor switch
        {
            "RIV" =>
                "RIV",

            "RIVIAN" =>
                "RIV",

            "WS" =>
                "WS",

            "DT" =>
                "DT",

            _ =>
                null
        };
    }

    // El BOM List no permite espacios
    // ni separadores dentro del diseño.
    private static string
        NormalizarDiseno(
            string nivelDiseno)
    {
        return new string(
            nivelDiseno
                .Trim()
                .ToUpperInvariant()
                .Where(
                    caracter =>
                        char.IsLetterOrDigit(
                            caracter
                        )
                )
                .ToArray()
        );
    }

    // Protege valores con comas,
    // comillas o saltos de línea.
    private static string
        EscaparCsv(
            string valor)
    {
        if (
            !valor.Contains(',') &&
            !valor.Contains('"') &&
            !valor.Contains('\r') &&
            !valor.Contains('\n')
        )
        {
            return valor;
        }

        return
            "\"" +
            valor.Replace(
                "\"",
                "\"\""
            ) +
            "\"";
    }

    private sealed class
        BomListRegistro
    {
        public string NumeroArnes
        {
            get;
            set;
        } = string.Empty;

        public string NivelDiseno
        {
            get;
            set;
        } = string.Empty;
    }
}

// Contiene el archivo generado
// y el resumen de la revisión.
public sealed class BomListResultado
{
    public byte[] Contenido
    {
        get;
        set;
    } = [];

    public int TotalExportados
    {
        get;
        set;
    }

    public int TotalDuplicados
    {
        get;
        set;
    }

    public List<BomListAdvertencia>
        Advertencias
    {
        get;
        set;
    } = [];
}

// Describe cada registro no exportado.
public sealed class BomListAdvertencia
{
    public string NumeroArnes
    {
        get;
        set;
    } = string.Empty;

    public string DisenoOriginal
    {
        get;
        set;
    } = string.Empty;

    public string Motivo
    {
        get;
        set;
    } = string.Empty;
}