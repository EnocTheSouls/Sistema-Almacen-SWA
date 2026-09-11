using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;
using SistemaAlmacen.Api.Models;
using SistemaAlmacen.Api.Services;

namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas HTTP del módulo de usuarios.
public static class UsuarioEndpoints
{
    public static void MapUsuarioEndpoints(this WebApplication app)
    {
        // Agrupa las rutas bajo /api/usuarios.
        var grupo = app.MapGroup("/api/usuarios")
            .WithTags("Usuarios");

        // Obtiene todos los usuarios registrados.
        grupo.MapGet("/", async (
            UsuarioRepository repository) =>
        {
            var usuarios =
                await repository.ObtenerTodosAsync();

            return Results.Ok(usuarios);
        })
        .WithName("ObtenerUsuarios");

        // Obtiene un usuario por su identificador.
        grupo.MapGet("/{idUsuario:int}", async (
            int idUsuario,
            UsuarioRepository repository) =>
        {
            var usuario =
                await repository.ObtenerPorIdAsync(idUsuario);

            // Devuelve 404 si el usuario no existe.
            if (usuario is null)
            {
                return Results.NotFound(new
                {
                    mensaje =
                        $"No existe un usuario con el identificador {idUsuario}."
                });
            }

            return Results.Ok(usuario);
        })
        .WithName("ObtenerUsuarioPorId");

        // Crea un usuario con contraseña protegida.
        grupo.MapPost("/", async (
            CrearUsuarioDto dto,
            UsuarioRepository usuarioRepository,
            RolRepository rolRepository,
            PasswordService passwordService) =>
        {
            // Valida los campos obligatorios.
            if (string.IsNullOrWhiteSpace(dto.Nombre))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.NombreUsuario))
            {
                return Results.BadRequest(new
                {
                    mensaje = "El nombre de usuario es obligatorio."
                });
            }

            if (string.IsNullOrWhiteSpace(dto.Password))
            {
                return Results.BadRequest(new
                {
                    mensaje = "La contraseña es obligatoria."
                });
            }

            if (dto.Nombre.Trim().Length > 150)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre no puede exceder 150 caracteres."
                });
            }

            if (dto.NombreUsuario.Trim().Length > 50)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El nombre de usuario no puede exceder 50 caracteres."
                });
            }

            if (dto.Password.Length < 8)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "La contraseña debe contener al menos 8 caracteres."
                });
            }

            // Comprueba que el rol seleccionado exista.
            var rol = await rolRepository.ObtenerPorIdAsync(dto.IdRol);

            if (rol is null)
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        $"No existe un rol con el identificador {dto.IdRol}."
                });
            }

            var usuario = new Usuario
            {
                Nombre = dto.Nombre.Trim(),
                NombreUsuario = dto.NombreUsuario.Trim(),
                IdRol = dto.IdRol,
                Activo = true
            };

            // Convierte la contraseña en un hash seguro.
            usuario.PasswordHash =
                passwordService.CrearHash(
                    usuario,
                    dto.Password
                );

            try
            {
                var idUsuario =
                    await usuarioRepository.CrearAsync(usuario);

                var usuarioCreado =
                    await usuarioRepository.ObtenerPorIdAsync(idUsuario);

                return Results.Created(
                    $"/api/usuarios/{idUsuario}",
                    usuarioCreado
                );
            }
            catch (MySqlException ex) when (ex.Number == 1062)
            {
                // Evita nombres de usuario duplicados.
                return Results.Conflict(new
                {
                    mensaje =
                        "Ya existe un usuario con ese nombre de usuario."
                });
            }
        })
        .WithName("CrearUsuario");
    }
}
