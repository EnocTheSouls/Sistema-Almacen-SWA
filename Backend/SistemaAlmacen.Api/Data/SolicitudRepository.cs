using MySqlConnector;
using SistemaAlmacen.Api.Dtos;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Data;

// Gestiona las solicitudes de materiales en MySQL.
public sealed class SolicitudRepository
{
    private readonly MySqlConnectionFactory _connectionFactory;

    public SolicitudRepository(
        MySqlConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    // Obtiene todas las solicitudes, comenzando por la más reciente.
    public async Task<List<Solicitud>> ObtenerTodasAsync()
    {
        var solicitudes = new List<Solicitud>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaEncabezado() +
            Environment.NewLine +
            """
            ORDER BY s.fecha_solicitud DESC;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            solicitudes.Add(
                MapearSolicitud(reader)
            );
        }

        await reader.CloseAsync();

        // Obtiene los materiales de cada solicitud.
        foreach (var solicitud in solicitudes)
        {
            solicitud.Materiales =
                await ObtenerDetallesAsync(
                    solicitud.IdSolicitud
                );
        }

        return solicitudes;
    }

    // Obtiene únicamente las solicitudes pendientes.
    public async Task<List<Solicitud>>
        ObtenerPendientesAsync()
    {
        var solicitudes = new List<Solicitud>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaEncabezado() +
            Environment.NewLine +
            """
            WHERE es.nombre = 'Pendiente'
              AND es.activo = TRUE
            ORDER BY s.fecha_solicitud ASC;
            """;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            solicitudes.Add(
                MapearSolicitud(reader)
            );
        }

        await reader.CloseAsync();

        // Obtiene los materiales de cada solicitud.
        foreach (var solicitud in solicitudes)
        {
            solicitud.Materiales =
                await ObtenerDetallesAsync(
                    solicitud.IdSolicitud
                );
        }

        return solicitudes;
    }


    // Obtiene las solicitudes que tienen un estado específico.
    public async Task<List<Solicitud>> ObtenerPorEstadoAsync(
        int idEstado)
    {
        var solicitudes = new List<Solicitud>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaEncabezado() +
            Environment.NewLine +
            """
        WHERE s.id_estado = @idEstado
        ORDER BY s.fecha_solicitud DESC;
        """;

        command.Parameters.AddWithValue(
            "@idEstado",
            idEstado
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            solicitudes.Add(
                MapearSolicitud(reader)
            );
        }

        await reader.CloseAsync();

        // Agrega los materiales de cada solicitud.
        foreach (var solicitud in solicitudes)
        {
            solicitud.Materiales =
                await ObtenerDetallesAsync(
                    solicitud.IdSolicitud
                );
        }

        return solicitudes;
    }

    // Obtiene las solicitudes creadas por un usuario específico.
    public async Task<List<Solicitud>> ObtenerPorUsuarioAsync(
        int idUsuario)
    {
        var solicitudes =
            new List<Solicitud>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaEncabezado() +
            Environment.NewLine +
            """
        WHERE s.usuario_solicitud = @idUsuario
        ORDER BY
            s.fecha_solicitud DESC,
            s.id_solicitud DESC;
        """;

        command.Parameters.AddWithValue(
            "@idUsuario",
            idUsuario
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            solicitudes.Add(
                MapearSolicitud(reader)
            );
        }

        // Cierra el lector antes de consultar los detalles.
        await reader.CloseAsync();

        // Agrega los materiales de cada solicitud.
        foreach (var solicitud in solicitudes)
        {
            solicitud.Materiales =
                await ObtenerDetallesAsync(
                    solicitud.IdSolicitud
                );
        }

        return solicitudes;
    }
    // Obtiene solicitudes utilizando filtros opcionales combinables.
    public async Task<List<Solicitud>>
        ObtenerFiltradasAsync(
            int? idEstado,
            int? idProyecto,
            int? idFamilia,
            int? idEstacion,
            DateTime? fechaDesde,
            DateTime? fechaHasta)
    {
        var solicitudes = new List<Solicitud>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        // Construye las condiciones según los filtros recibidos.
        var condiciones = new List<string>();

        if (idEstado.HasValue)
        {
            condiciones.Add(
                "s.id_estado = @idEstado"
            );

            command.Parameters.AddWithValue(
                "@idEstado",
                idEstado.Value
            );
        }

        if (idProyecto.HasValue)
        {
            condiciones.Add(
                "s.id_proyecto = @idProyecto"
            );

            command.Parameters.AddWithValue(
                "@idProyecto",
                idProyecto.Value
            );
        }

        if (idFamilia.HasValue)
        {
            condiciones.Add(
                "s.id_familia = @idFamilia"
            );

            command.Parameters.AddWithValue(
                "@idFamilia",
                idFamilia.Value
            );
        }

        if (idEstacion.HasValue)
        {
            condiciones.Add(
                "s.id_estacion = @idEstacion"
            );

            command.Parameters.AddWithValue(
                "@idEstacion",
                idEstacion.Value
            );
        }

        if (fechaDesde.HasValue)
        {
            condiciones.Add(
                "s.fecha_solicitud >= @fechaDesde"
            );

            command.Parameters.AddWithValue(
                "@fechaDesde",
                fechaDesde.Value.Date
            );
        }

        if (fechaHasta.HasValue)
        {
            // Utiliza el día siguiente para incluir todo el día final.
            condiciones.Add(
                "s.fecha_solicitud < @fechaHastaExclusiva"
            );

            command.Parameters.AddWithValue(
                "@fechaHastaExclusiva",
                fechaHasta.Value.Date.AddDays(1)
            );
        }

        var consulta =
            CrearConsultaEncabezado();

        if (condiciones.Count > 0)
        {
            consulta +=
                Environment.NewLine +
                "WHERE " +
                string.Join(
                    Environment.NewLine + "  AND ",
                    condiciones
                );
        }

        consulta +=
            Environment.NewLine +
            "ORDER BY s.fecha_solicitud DESC;";

        command.CommandText = consulta;

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            solicitudes.Add(
                MapearSolicitud(reader)
            );
        }

        await reader.CloseAsync();

        // Agrega la lista de materiales de cada solicitud.
        foreach (var solicitud in solicitudes)
        {
            solicitud.Materiales =
                await ObtenerDetallesAsync(
                    solicitud.IdSolicitud
                );
        }

        return solicitudes;
    }



    // Obtiene una solicitud y todos sus materiales.
    public async Task<Solicitud?> ObtenerPorIdAsync(
        long idSolicitud)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText =
            CrearConsultaEncabezado() +
            Environment.NewLine +
            """
            WHERE s.id_solicitud = @idSolicitud
            LIMIT 1;
            """;

        command.Parameters.AddWithValue(
            "@idSolicitud",
            idSolicitud
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        var solicitud =
            MapearSolicitud(reader);

        await reader.CloseAsync();

        solicitud.Materiales =
            await ObtenerDetallesAsync(
                idSolicitud
            );

        return solicitud;
    }

    // Crea el encabezado y los detalles en una transacción.
    public async Task<Solicitud?> CrearAsync(
        int idProyecto,
        int idFamilia,
        int idEstacion,
        int idUsuarioSolicitud,
        string origenSolicitud,
        IReadOnlyCollection<CrearSolicitudDetalleDto>
            materiales)
    {
        var origenLimpio =
            origenSolicitud.Trim().ToUpperInvariant();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        // El encabezado y los detalles se guardan juntos.
        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            int idEstadoPendiente;

            // Busca el estado inicial por nombre.
            await using (var estadoCommand =
                connection.CreateCommand())
            {
                estadoCommand.Transaction = transaction;

                estadoCommand.CommandText = """
                    SELECT id_estado
                    FROM estado_solicitud
                    WHERE nombre = 'Pendiente'
                      AND activo = TRUE
                    LIMIT 1;
                    """;

                var resultado =
                    await estadoCommand.ExecuteScalarAsync();

                if (resultado is null ||
                    resultado is DBNull)
                {
                    throw new InvalidOperationException(
                        "No existe un estado Pendiente activo."
                    );
                }

                idEstadoPendiente =
                    Convert.ToInt32(resultado);
            }

            long idSolicitud;

            // Inserta el encabezado de la solicitud.
            await using (var solicitudCommand =
                connection.CreateCommand())
            {
                solicitudCommand.Transaction = transaction;

                solicitudCommand.CommandText = """
                    INSERT INTO solicitudes (
                        id_estado,
                        fecha_solicitud,
                        id_familia,
                        id_proyecto,
                        id_estacion,
                        usuario_solicitud,
                        origen_solicitud
                    )
                    VALUES (
                        @idEstado,
                        CURRENT_TIMESTAMP,
                        @idFamilia,
                        @idProyecto,
                        @idEstacion,
                        @idUsuarioSolicitud,
                        @origenSolicitud
                    );
                    """;

                solicitudCommand.Parameters.AddWithValue(
                    "@idEstado",
                    idEstadoPendiente
                );

                solicitudCommand.Parameters.AddWithValue(
                    "@idFamilia",
                    idFamilia
                );

                solicitudCommand.Parameters.AddWithValue(
                    "@idProyecto",
                    idProyecto
                );

                solicitudCommand.Parameters.AddWithValue(
                    "@idEstacion",
                    idEstacion
                );

                solicitudCommand.Parameters.AddWithValue(
                    "@idUsuarioSolicitud",
                    idUsuarioSolicitud
                );

                solicitudCommand.Parameters.AddWithValue(
                    "@origenSolicitud",
                    origenLimpio
                );

                await solicitudCommand.ExecuteNonQueryAsync();

                idSolicitud =
                    Convert.ToInt64(
                        solicitudCommand.LastInsertedId
                    );
            }

            // Inserta cada material de la lista.
            foreach (var detalle in materiales)
            {
                await using var detalleCommand =
                    connection.CreateCommand();

                detalleCommand.Transaction = transaction;

                detalleCommand.CommandText = """
                    INSERT INTO solicitud_detalle (
                        id_solicitud,
                        id_material,
                        cantidad_solicitada,
                        cantidad_surtida
                    )
                    VALUES (
                        @idSolicitud,
                        @idMaterial,
                        @cantidadSolicitada,
                        0
                    );
                    """;

                detalleCommand.Parameters.AddWithValue(
                    "@idSolicitud",
                    idSolicitud
                );

                detalleCommand.Parameters.AddWithValue(
                    "@idMaterial",
                    detalle.IdMaterial
                );

                detalleCommand.Parameters.AddWithValue(
                    "@cantidadSolicitada",
                    detalle.CantidadSolicitada
                );

                await detalleCommand.ExecuteNonQueryAsync();
            }

            // Confirma el encabezado y todos los detalles.
            await transaction.CommitAsync();

            return await ObtenerPorIdAsync(
                idSolicitud
            );
        }
        catch
        {
            // Revierte toda la solicitud si algo falla.
            await transaction.RollbackAsync();
            throw;
        }
    }

    // Cambia el estado de una solicitud y devuelve el registro actualizado.
    public async Task<Solicitud?> CambiarEstadoAsync(
        long idSolicitud,
        int idEstado)
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        UPDATE solicitudes
        SET id_estado = @idEstado
        WHERE id_solicitud = @idSolicitud;
        """;

        command.Parameters.AddWithValue(
            "@idSolicitud",
            idSolicitud
        );

        command.Parameters.AddWithValue(
            "@idEstado",
            idEstado
        );

        var filasAfectadas =
            await command.ExecuteNonQueryAsync();

        if (filasAfectadas == 0)
        {
            return null;
        }

        // Consulta y devuelve la solicitud con el nuevo estado.
        return await ObtenerPorIdAsync(
            idSolicitud
        );
    }



    // Obtiene los contadores de solicitudes para el dashboard.
    public async Task<DashboardSolicitudes>
        ObtenerDashboardAsync()
    {
        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
        SELECT
            COUNT(
                CASE
                    WHEN es.nombre = 'Pendiente'
                    THEN 1
                END
            ) AS pendientes,

            COUNT(
                CASE
                    WHEN es.nombre = 'Asignada'
                    THEN 1
                END
            ) AS asignadas,

            COUNT(
                CASE
                    WHEN es.nombre = 'En surtido'
                    THEN 1
                END
            ) AS en_surtido,

            COUNT(
                CASE
                    WHEN es.nombre = 'Parcial'
                    THEN 1
                END
            ) AS parciales,

            COUNT(
                CASE
                    WHEN es.nombre = 'Faltante'
                    THEN 1
                END
            ) AS faltantes,

            COUNT(
                CASE
                    WHEN es.nombre = 'Completada'
                    THEN 1
                END
            ) AS completadas,

            COUNT(
                CASE
                    WHEN es.nombre = 'Entregada'
                    THEN 1
                END
            ) AS entregadas,

            COUNT(
                CASE
                    WHEN es.nombre = 'Cancelada'
                    THEN 1
                END
            ) AS canceladas
        FROM solicitudes AS s
        INNER JOIN estado_solicitud AS es
            ON es.id_estado = s.id_estado;
        """;

        await using var reader =
            await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return new DashboardSolicitudes();
        }

        return new DashboardSolicitudes
        {
            Pendientes =
                Convert.ToInt32(
                    reader.GetInt64("pendientes")
                ),

            Asignadas =
                Convert.ToInt32(
                    reader.GetInt64("asignadas")
                ),

            EnSurtido =
                Convert.ToInt32(
                    reader.GetInt64("en_surtido")
                ),

            Parciales =
                Convert.ToInt32(
                    reader.GetInt64("parciales")
                ),

            Faltantes =
                Convert.ToInt32(
                    reader.GetInt64("faltantes")
                ),

            Completadas =
                Convert.ToInt32(
                    reader.GetInt64("completadas")
                ),

            Entregadas =
                Convert.ToInt32(
                    reader.GetInt64("entregadas")
                ),

            Canceladas =
                Convert.ToInt32(
                    reader.GetInt64("canceladas")
                )
        };
    }
    // Surte un material, descuenta inventario y actualiza la solicitud.
    public async Task<ResultadoSurtidoSolicitud>
        SurtirDetalleAsync(
            long idSolicitud,
            long idDetalle,
            int idUbicacion,
            decimal cantidad,
            int idUsuario,
            string? referencia,
            string? comentarios)
    {
        var referenciaLimpia =
            string.IsNullOrWhiteSpace(referencia)
                ? null
                : referencia.Trim();

        var comentariosLimpios =
            string.IsNullOrWhiteSpace(comentarios)
                ? null
                : comentarios.Trim();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        // Todas las operaciones se confirman o cancelan juntas.
        await using var transaction =
            await connection.BeginTransactionAsync();

        try
        {
            int idEstadoActual;

            // Bloquea la solicitud mientras se procesa.
            await using (var solicitudCommand =
                connection.CreateCommand())
            {
                solicitudCommand.Transaction = transaction;

                solicitudCommand.CommandText = """
                SELECT id_estado
                FROM solicitudes
                WHERE id_solicitud = @idSolicitud
                FOR UPDATE;
                """;

                solicitudCommand.Parameters.AddWithValue(
                    "@idSolicitud",
                    idSolicitud
                );

                var resultado =
                    await solicitudCommand.ExecuteScalarAsync();

                if (resultado is null ||
                    resultado is DBNull)
                {
                    await transaction.RollbackAsync();

                    return new ResultadoSurtidoSolicitud
                    {
                        Exitoso = false,
                        Codigo = "SOLICITUD_NO_EXISTE",
                        Mensaje =
                            "No existe la solicitud indicada."
                    };
                }

                idEstadoActual =
                    Convert.ToInt32(resultado);
            }

            // Solo permite surtir solicitudes en proceso.
            if (idEstadoActual != 3 &&
                idEstadoActual != 4 &&
                idEstadoActual != 5)
            {
                await transaction.RollbackAsync();

                return new ResultadoSurtidoSolicitud
                {
                    Exitoso = false,
                    Codigo = "ESTADO_NO_PERMITIDO",
                    Mensaje =
                        "La solicitud debe estar En surtido, Parcial o Faltante."
                };
            }

            int idMaterial;
            decimal cantidadSolicitada;
            decimal cantidadSurtida;

            // Obtiene y bloquea el detalle específico.
            await using (var detalleCommand =
                connection.CreateCommand())
            {
                detalleCommand.Transaction = transaction;

                detalleCommand.CommandText = """
                SELECT
                    id_material,
                    cantidad_solicitada,
                    cantidad_surtida
                FROM solicitud_detalle
                WHERE id_detalle = @idDetalle
                  AND id_solicitud = @idSolicitud
                FOR UPDATE;
                """;

                detalleCommand.Parameters.AddWithValue(
                    "@idDetalle",
                    idDetalle
                );

                detalleCommand.Parameters.AddWithValue(
                    "@idSolicitud",
                    idSolicitud
                );

                await using var reader =
                    await detalleCommand.ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    await reader.CloseAsync();
                    await transaction.RollbackAsync();

                    return new ResultadoSurtidoSolicitud
                    {
                        Exitoso = false,
                        Codigo = "DETALLE_NO_EXISTE",
                        Mensaje =
                            "El detalle no pertenece a la solicitud indicada."
                    };
                }

                idMaterial =
                    reader.GetInt32("id_material");

                cantidadSolicitada =
                    reader.GetDecimal(
                        "cantidad_solicitada"
                    );

                cantidadSurtida =
                    reader.GetDecimal(
                        "cantidad_surtida"
                    );
            }

            var cantidadPendiente =
                cantidadSolicitada - cantidadSurtida;

            if (cantidad <= 0)
            {
                await transaction.RollbackAsync();

                return new ResultadoSurtidoSolicitud
                {
                    Exitoso = false,
                    Codigo = "CANTIDAD_INVALIDA",
                    Mensaje =
                        "La cantidad a surtir debe ser mayor que cero."
                };
            }

            if (cantidad > cantidadPendiente)
            {
                await transaction.RollbackAsync();

                return new ResultadoSurtidoSolicitud
                {
                    Exitoso = false,
                    Codigo =
                        "CANTIDAD_EXCEDE_PENDIENTE",
                    Mensaje =
                        $"La cantidad pendiente del material es {cantidadPendiente}."
                };
            }

            long idInventario;
            decimal disponible;

            // Bloquea el inventario del material y ubicación.
            await using (var inventarioCommand =
                connection.CreateCommand())
            {
                inventarioCommand.Transaction = transaction;

                inventarioCommand.CommandText = """
                SELECT
                    id_inventario,
                    disponible
                FROM inventario
                WHERE id_material = @idMaterial
                  AND id_ubicacion = @idUbicacion
                FOR UPDATE;
                """;

                inventarioCommand.Parameters.AddWithValue(
                    "@idMaterial",
                    idMaterial
                );

                inventarioCommand.Parameters.AddWithValue(
                    "@idUbicacion",
                    idUbicacion
                );

                await using var reader =
                    await inventarioCommand
                        .ExecuteReaderAsync();

                if (!await reader.ReadAsync())
                {
                    await reader.CloseAsync();
                    await transaction.RollbackAsync();

                    return new ResultadoSurtidoSolicitud
                    {
                        Exitoso = false,
                        Codigo =
                            "INVENTARIO_NO_EXISTE",
                        Mensaje =
                            "El material no tiene inventario en la ubicación indicada."
                    };
                }

                idInventario =
                    reader.GetInt64("id_inventario");

                disponible =
                    reader.GetDecimal("disponible");
            }

            if (disponible < cantidad)
            {
                await transaction.RollbackAsync();

                return new ResultadoSurtidoSolicitud
                {
                    Exitoso = false,
                    Codigo =
                        "INVENTARIO_INSUFICIENTE",
                    Mensaje =
                        $"Disponible: {disponible}. Cantidad solicitada para surtir: {cantidad}."
                };
            }

            // Descuenta la cantidad del inventario disponible.
            await using (var actualizarInventarioCommand =
                connection.CreateCommand())
            {
                actualizarInventarioCommand.Transaction =
                    transaction;

                actualizarInventarioCommand.CommandText = """
                UPDATE inventario
                SET
                    disponible = disponible - @cantidad,
                    ultima_actualizacion =
                        CURRENT_TIMESTAMP
                WHERE id_inventario = @idInventario;
                """;

                actualizarInventarioCommand.Parameters
                    .AddWithValue(
                        "@cantidad",
                        cantidad
                    );

                actualizarInventarioCommand.Parameters
                    .AddWithValue(
                        "@idInventario",
                        idInventario
                    );

                await actualizarInventarioCommand
                    .ExecuteNonQueryAsync();
            }

            // Incrementa la cantidad surtida del detalle.
            await using (var actualizarDetalleCommand =
                connection.CreateCommand())
            {
                actualizarDetalleCommand.Transaction =
                    transaction;

                actualizarDetalleCommand.CommandText = """
                UPDATE solicitud_detalle
                SET cantidad_surtida =
                    cantidad_surtida + @cantidad
                WHERE id_detalle = @idDetalle;
                """;

                actualizarDetalleCommand.Parameters
                    .AddWithValue(
                        "@cantidad",
                        cantidad
                    );

                actualizarDetalleCommand.Parameters
                    .AddWithValue(
                        "@idDetalle",
                        idDetalle
                    );

                await actualizarDetalleCommand
                    .ExecuteNonQueryAsync();
            }

            // Registra el movimiento de surtido.
            await using (var movimientoCommand =
                connection.CreateCommand())
            {
                movimientoCommand.Transaction = transaction;

                movimientoCommand.CommandText = """
                INSERT INTO movimiento_inventario (
                    id_solicitud,
                    id_arnes,
                    fecha_hora,
                    id_material,
                    cantidad,
                    tipo_movimiento,
                    id_ubicacion_origen,
                    id_ubicacion_destino,
                    id_usuario,
                    referencia,
                    comentarios
                )
                VALUES (
                    @idSolicitud,
                    NULL,
                    CURRENT_TIMESTAMP,
                    @idMaterial,
                    @cantidad,
                    'Surtido',
                    @idUbicacion,
                    NULL,
                    @idUsuario,
                    @referencia,
                    @comentarios
                );
                """;

                movimientoCommand.Parameters.AddWithValue(
                    "@idSolicitud",
                    idSolicitud
                );

                movimientoCommand.Parameters.AddWithValue(
                    "@idMaterial",
                    idMaterial
                );

                movimientoCommand.Parameters.AddWithValue(
                    "@cantidad",
                    cantidad
                );

                movimientoCommand.Parameters.AddWithValue(
                    "@idUbicacion",
                    idUbicacion
                );

                movimientoCommand.Parameters.AddWithValue(
                    "@idUsuario",
                    idUsuario
                );

                movimientoCommand.Parameters.AddWithValue(
                    "@referencia",
                    referenciaLimpia is null
                        ? DBNull.Value
                        : referenciaLimpia
                );

                movimientoCommand.Parameters.AddWithValue(
                    "@comentarios",
                    comentariosLimpios is null
                        ? DBNull.Value
                        : comentariosLimpios
                );

                await movimientoCommand.ExecuteNonQueryAsync();
            }

            decimal totalSolicitado;
            decimal totalSurtido;

            // Calcula el avance total de la solicitud.
            await using (var totalesCommand =
                connection.CreateCommand())
            {
                totalesCommand.Transaction = transaction;

                totalesCommand.CommandText = """
                SELECT
                    SUM(cantidad_solicitada)
                        AS total_solicitado,
                    SUM(cantidad_surtida)
                        AS total_surtido
                FROM solicitud_detalle
                WHERE id_solicitud = @idSolicitud;
                """;

                totalesCommand.Parameters.AddWithValue(
                    "@idSolicitud",
                    idSolicitud
                );

                await using var reader =
                    await totalesCommand.ExecuteReaderAsync();

                await reader.ReadAsync();

                totalSolicitado =
                    reader.GetDecimal("total_solicitado");

                totalSurtido =
                    reader.GetDecimal("total_surtido");
            }

            var nombreNuevoEstado =
                totalSurtido >= totalSolicitado
                    ? "Completada"
                    : "Parcial";

            int idNuevoEstado;

            // Obtiene el identificador del estado automático.
            await using (var estadoCommand =
                connection.CreateCommand())
            {
                estadoCommand.Transaction = transaction;

                estadoCommand.CommandText = """
                SELECT id_estado
                FROM estado_solicitud
                WHERE nombre = @nombreEstado
                  AND activo = TRUE
                LIMIT 1;
                """;

                estadoCommand.Parameters.AddWithValue(
                    "@nombreEstado",
                    nombreNuevoEstado
                );

                var resultado =
                    await estadoCommand.ExecuteScalarAsync();

                if (resultado is null ||
                    resultado is DBNull)
                {
                    throw new InvalidOperationException(
                        $"No existe el estado activo {nombreNuevoEstado}."
                    );
                }

                idNuevoEstado =
                    Convert.ToInt32(resultado);
            }

            // Actualiza el estado general de la solicitud.
            await using (var actualizarSolicitudCommand =
                connection.CreateCommand())
            {
                actualizarSolicitudCommand.Transaction =
                    transaction;

                actualizarSolicitudCommand.CommandText = """
                UPDATE solicitudes
                SET id_estado = @idEstado
                WHERE id_solicitud = @idSolicitud;
                """;

                actualizarSolicitudCommand.Parameters
                    .AddWithValue(
                        "@idEstado",
                        idNuevoEstado
                    );

                actualizarSolicitudCommand.Parameters
                    .AddWithValue(
                        "@idSolicitud",
                        idSolicitud
                    );

                await actualizarSolicitudCommand
                    .ExecuteNonQueryAsync();
            }

            await transaction.CommitAsync();

            var solicitudActualizada =
                await ObtenerPorIdAsync(
                    idSolicitud
                );

            return new ResultadoSurtidoSolicitud
            {
                Exitoso = true,
                Codigo = "SURTIDO_CORRECTO",
                Mensaje =
                    "El material se surtió correctamente.",
                Solicitud = solicitudActualizada
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }





    // Obtiene los materiales incluidos en una solicitud.
    private async Task<List<SolicitudDetalle>>
        ObtenerDetallesAsync(
            long idSolicitud)
    {
        var detalles =
            new List<SolicitudDetalle>();

        await using var connection =
            _connectionFactory.CreateConnection();

        await connection.OpenAsync();

        await using var command =
            connection.CreateCommand();

        command.CommandText = """
            SELECT
                sd.id_detalle,
                sd.id_solicitud,
                sd.id_material,
                m.numero_parte_material,
                m.descripcion AS descripcion_material,
                m.unidad_medida,
                m.tipo_empaque,
                m.std_pack,
                sd.cantidad_solicitada,
                sd.cantidad_surtida
            FROM solicitud_detalle AS sd
            INNER JOIN materiales AS m
                ON m.id_material = sd.id_material
            WHERE sd.id_solicitud = @idSolicitud
            ORDER BY m.numero_parte_material;
            """;

        command.Parameters.AddWithValue(
            "@idSolicitud",
            idSolicitud
        );

        await using var reader =
            await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            detalles.Add(
                MapearDetalle(reader)
            );
        }

        return detalles;
    }

    // Define la consulta del encabezado de solicitudes.
    private static string CrearConsultaEncabezado()
    {
        return """
            SELECT
                s.id_solicitud,
                s.id_estado,
                es.nombre AS nombre_estado,
                es.color AS color_estado,
                s.fecha_solicitud,
                s.id_proyecto,
                p.nombre AS nombre_proyecto,
                s.id_familia,
                f.nombre AS nombre_familia,
                s.id_estacion,
                e.nombre AS nombre_estacion,
                s.usuario_solicitud,
                u.nombre AS nombre_usuario_solicitud,
                s.origen_solicitud
            FROM solicitudes AS s
            INNER JOIN estado_solicitud AS es
                ON es.id_estado = s.id_estado
            INNER JOIN proyectos AS p
                ON p.id_proyecto = s.id_proyecto
            INNER JOIN familias AS f
                ON f.id_familia = s.id_familia
            INNER JOIN estaciones AS e
                ON e.id_estacion = s.id_estacion
            INNER JOIN usuarios AS u
                ON u.id_usuario = s.usuario_solicitud
            """;
    }

    // Convierte una fila de MySQL en una solicitud.
    private static Solicitud MapearSolicitud(
        MySqlDataReader reader)
    {
        return new Solicitud
        {
            IdSolicitud =
                reader.GetInt64("id_solicitud"),

            IdEstado =
                reader.GetInt32("id_estado"),

            NombreEstado =
                reader.GetString("nombre_estado"),

            ColorEstado = reader.IsDBNull(
                reader.GetOrdinal("color_estado")
            )
                ? null
                : reader.GetString("color_estado"),

            FechaSolicitud =
                reader.GetDateTime("fecha_solicitud"),

            IdProyecto =
                reader.GetInt32("id_proyecto"),

            NombreProyecto =
                reader.GetString("nombre_proyecto"),

            IdFamilia =
                reader.GetInt32("id_familia"),

            NombreFamilia =
                reader.GetString("nombre_familia"),

            IdEstacion =
                reader.GetInt32("id_estacion"),

            NombreEstacion =
                reader.GetString("nombre_estacion"),

            IdUsuarioSolicitud =
                reader.GetInt32("usuario_solicitud"),

            NombreUsuarioSolicitud =
                reader.GetString(
                    "nombre_usuario_solicitud"
                ),

            OrigenSolicitud =
                reader.GetString("origen_solicitud")
        };
    }

    // Convierte una fila de MySQL en un detalle.
    private static SolicitudDetalle MapearDetalle(
        MySqlDataReader reader)
    {
        return new SolicitudDetalle
        {
            IdDetalle =
                reader.GetInt64("id_detalle"),

            IdSolicitud =
                reader.GetInt64("id_solicitud"),

            IdMaterial =
                reader.GetInt32("id_material"),

            NumeroParteMaterial =
                reader.GetString(
                    "numero_parte_material"
                ),

            DescripcionMaterial =
                reader.GetString(
                    "descripcion_material"
                ),

            UnidadMedida = reader.IsDBNull(
                reader.GetOrdinal("unidad_medida")
            )
                ? null
                : reader.GetString("unidad_medida"),

            TipoEmpaque = reader.IsDBNull(
                reader.GetOrdinal("tipo_empaque")
            )
                ? null
                : reader.GetString("tipo_empaque"),

            StdPack = reader.IsDBNull(
                reader.GetOrdinal("std_pack")
            )
                ? null
                : reader.GetDecimal("std_pack"),

            CantidadSolicitada =
                reader.GetDecimal(
                    "cantidad_solicitada"
                ),

            CantidadSurtida =
                reader.GetDecimal(
                    "cantidad_surtida"
                )
        };
    }
}