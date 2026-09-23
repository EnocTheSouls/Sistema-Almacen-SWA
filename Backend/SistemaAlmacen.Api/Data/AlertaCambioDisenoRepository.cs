using MySqlConnector;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

public sealed class AlertaCambioDisenoRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public AlertaCambioDisenoRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<List<AlertaCambioDiseno>>
        ObtenerAlertasAsync()
    {
        var alertas =
            new List<AlertaCambioDiseno>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            p.nombre AS proyecto,
            f.nombre AS familia,
            a.numero_parte_arnes,
            a.nivel_diseno,
            MIN(psa.fecha_inicio) AS primera_fecha,
            MAX(psa.fecha_inicio) AS ultima_fecha
        FROM plan_semanal_arnes psa
        INNER JOIN arneses a
            ON a.id_arnes = psa.id_arnes
        INNER JOIN familias f
            ON f.id_familia = a.id_familia
        INNER JOIN proyectos p
            ON p.id_proyecto = f.id_proyecto
        WHERE psa.activo = TRUE
        GROUP BY
            p.nombre,
            f.nombre,
            a.numero_parte_arnes,
            a.nivel_diseno
        ORDER BY
            f.nombre,
            a.numero_parte_arnes,
            primera_fecha;
        """;

        await using var reader =
            await command.ExecuteReaderAsync();

        var registros =
            new List<dynamic>();

        while (await reader.ReadAsync())
        {
            registros.Add(new
            {
                Proyecto =
                    reader.GetString("proyecto"),

                Familia =
                    reader.GetString("familia"),

                Arnes =
                    reader.GetString(
                        "numero_parte_arnes"
                    ),

                Diseno =
                    reader.GetString(
                        "nivel_diseno"
                    ),

                PrimeraFecha =
                    DateOnly.FromDateTime(
                        reader.GetDateTime(
                            "primera_fecha"
                        )
                    ),

                UltimaFecha =
                    DateOnly.FromDateTime(
                        reader.GetDateTime(
                            "ultima_fecha"
                        )
                    )
            });
        }

        foreach (
            var grupo in registros
                .GroupBy(x =>
                    $"{x.Familia}|{x.Arnes}")
        )
        {
            var lista =
                grupo
                    .OrderBy(x => x.PrimeraFecha)
                    .ToList();

            for (
                var i = 0;
                i < lista.Count - 1;
                i++)
            {
                var actual = lista[i];
                var siguiente = lista[i + 1];

                var diasRestantes =
                    (siguiente.PrimeraFecha
                        .ToDateTime(
                            TimeOnly.MinValue
                        ) - DateTime.Today)
                    .Days;

                if (diasRestantes < 0)
                {
                    continue;
                }

                var nivel =
                    diasRestantes <= 14
                        ? "Critica"
                        : diasRestantes <= 30
                            ? "Alta"
                            : diasRestantes <= 60
                                ? "Media"
                                : "Informativa";

                alertas.Add(
                    new AlertaCambioDiseno
                    {
                        Proyecto =
                            actual.Proyecto,

                        Familia =
                            actual.Familia,

                        ArnesActual =
                            actual.Arnes,

                        DisenoActual =
                            actual.Diseno,

                        ArnesSiguiente =
                            siguiente.Arnes,

                        DisenoSiguiente =
                            siguiente.Diseno,

                        UltimaFechaActual =
                            actual.UltimaFecha,

                        FechaCambio =
                            siguiente.PrimeraFecha,

                        DiasRestantes =
                            diasRestantes,

                        NivelAlerta =
                            nivel
                    });
            }
        }

        return alertas;
    }
}