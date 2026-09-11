using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Endpoints;

public static class RolEndpoints
{
    public static void MapRolEndpoints(this WebApplication app)
    {
        var grupo = app.MapGroup("/api/roles")
            .WithTags("Roles");

        // Obtener todos los roles
        grupo.MapGet("/", async (RolRepository repository) =>
        {
            var roles = await repository.ObtenerTodosAsync();

            return Results.Ok(roles);
        })
        .WithName("ObtenerRoles");

        // Obtener un rol por identificador
        grupo.MapGet("/{idRol:int}", async (
            int idRol,
            RolRepository repository) =>
        {
            var rol = await repository.ObtenerPorIdAsync(idRol);

            if (rol is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un rol con el identificador {idRol}."
                });
            }

            return Results.Ok(rol);
        })
        .WithName("ObtenerRolPorId");

        // Crear un rol
        grupo.MapPost("/", async (
            CrearRolDto dto,
            RolRepository repository) =>
        {
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre del rol es obligatorio."
                });
            }

            if (dto.Nombre.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre del rol no puede exceder 50 caracteres."
                });
            }

            if (dto.Descripcion?.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La descripción no puede exceder 255 caracteres."
                });
            }

            try
            {
                var rolCreado = await repository.CrearAsync(
                    dto.Nombre,
                    dto.Descripcion
                );

                return Results.Created(
                    $"/api/roles/{rolCreado.IdRol}",
                    rolCreado
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje = "Ya existe un rol con ese nombre."
                });
            }
        })
        .WithName("CrearRol");

        // Actualiza un rol existente
        grupo.MapPut("/{idRol:int}", async (
            int idRol,
            ActualizarRolDto dto,
            RolRepository repository) =>
        {
            // Valida que el nombre sea obligatorio
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre del rol es obligatorio."
                });
            }

            if (dto.Nombre.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre no puede exceder 50 caracteres."
                });
            }

            if (dto.Descripcion?.Trim().Length > 255)
            {
                return Results.BadRequest(new
                {
                    mensaje = "La descripción no puede exceder 255 caracteres."
                });
            }

            try
            {
                var actualizado = await repository.ActualizarAsync(
                    idRol,
                    dto.Nombre,
                    dto.Descripcion
                );

                // Devuelve 404 si el rol no existe
                if (!actualizado)
                {
                    return Results.NotFound(new
                    {
                        mensaje =
                            $"No existe un rol con el identificador {idRol}."
                    });
                }

                var rolActualizado =
                    await repository.ObtenerPorIdAsync(idRol);

                return Results.Ok(rolActualizado);
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                return Results.Conflict(new
                {
                    mensaje = "Ya existe otro rol con ese nombre."
                });
            }
        })
        .WithName("ActualizarRol");
        // Elimina un rol si no esta asignado a usuarios

        grupo.MapDelete("/{idRol:int}", async(
            int idRol,
            RolRepository repository) =>
            {
                //Comprueba que primero exista el Rol
                var rol = await repository.ObtenerPorIdAsync(idRol);

                if (rol is null)
                {
                    return Results.NotFound(new
                    {
                        mensaje = $"No existe un rol con el identificador {idRol}."
                    });
                }
                //Impide eliminar roles utilizados por usuarios.
                var estaAsignado = 
                await repository.EstaAsignadoAUsuariosAsync(idRol);
                if (estaAsignado)
                {
                    return Results.Conflict(new
                    {
                        mensaje = "El rol no puede eliminarse porque se encuentra asignadoa un usuario"
                    });
                }
                var eliminado = 
                await repository.EliminarAsync(idRol);
                if(!eliminado)
                {
                    return Results.Problem(
                        title: "No se pudo eliminar el rol",
                        detail: "Ocurrrio un problema al eliminar el registro",
                        statusCode: StatusCodes.Status500InternalServerError
                    );
                }
                //Devuelve 204 cuando se elimina con exito 
                return Results.NoContent();
            })
            .WithName("EliminarRol");

    }
}