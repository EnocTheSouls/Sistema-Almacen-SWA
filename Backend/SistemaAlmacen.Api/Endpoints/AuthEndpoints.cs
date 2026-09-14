using System.Security.Claims;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Dtos;
using SistemaAlmacen.Api.Models;
using SistemaAlmacen.Api.Services;


namespace SistemaAlmacen.Api.Endpoints;

// Define las rutas para autenticar usuarios.
public static class AuthEndpoints
{
    public static void MapAuthEndpoints(
        this WebApplication app)
    {
        // Agrupa las rutas bajo /api/auth.
        var grupo = app.MapGroup("/api/auth")
            .WithTags("Autenticación");

        // Valida las credenciales y genera un token JWT.
        grupo.MapPost("/login", async (
            LoginDto dto,
            UsuarioRepository usuarioRepository,
            PasswordService passwordService,
            JwtService jwtService) =>
        {
            // Valida que las credenciales tengan contenido.
            if (string.IsNullOrWhiteSpace(dto.NombreUsuario) ||
                string.IsNullOrWhiteSpace(dto.Password))
            {
                return Results.BadRequest(new
                {
                    mensaje =
                        "El usuario y la contraseña son obligatorios."
                });
            }

            // Busca al usuario y obtiene su hash internamente.
            var usuarioLogin =
                await usuarioRepository.ObtenerParaLoginAsync(
                    dto.NombreUsuario
                );

            // Evita revelar si el usuario específico existe.
            if (usuarioLogin is null)
            {
                return Results.Unauthorized();
            }

            // Impide el acceso a usuarios desactivados.
            if (!usuarioLogin.Activo)
            {
                return Results.Json(
                    new
                    {
                        mensaje =
                            "El usuario se encuentra desactivado."
                    },
                    statusCode:
                        StatusCodes.Status403Forbidden
                );
            }

            // Crea un modelo interno para verificar el hash.
            var usuario = new Usuario
            {
                IdUsuario = usuarioLogin.IdUsuario,
                Nombre = usuarioLogin.Nombre,
                NombreUsuario = usuarioLogin.NombreUsuario,
                PasswordHash = usuarioLogin.PasswordHash,
                IdRol = usuarioLogin.IdRol,
                Activo = usuarioLogin.Activo
            };

            // Compara la contraseña con el hash almacenado.
            var passwordValido =
                passwordService.VerificarPassword(
                    usuario,
                    usuarioLogin.PasswordHash,
                    dto.Password
                );

            if (!passwordValido)
            {
                return Results.Unauthorized();
            }

            // Genera un token firmado para el usuario.
            var resultadoToken =
                jwtService.GenerarToken(usuarioLogin);

            var respuesta = new LoginRespuestaDto
            {
                Token = resultadoToken.Token,
                ExpiraEn = resultadoToken.ExpiraEn,
                IdUsuario = usuarioLogin.IdUsuario,
                Nombre = usuarioLogin.Nombre,
                NombreUsuario = usuarioLogin.NombreUsuario,
                IdRol = usuarioLogin.IdRol,
                NombreRol = usuarioLogin.NombreRol
            };

            return Results.Ok(respuesta);
        })
        .WithName("IniciarSesion")
        .AllowAnonymous();

        // Cambia la contraseña del usuario autenticado.
grupo.MapPut("/cambiar-password", async (
    CambiarPasswordDto dto,
    ClaimsPrincipal principal,
    UsuarioRepository usuarioRepository,
    PasswordService passwordService) =>
{
    // Valida que ambas contraseñas tengan contenido.
    if (string.IsNullOrWhiteSpace(dto.PasswordActual) ||
        string.IsNullOrWhiteSpace(dto.PasswordNueva))
    {
        return Results.BadRequest(new
        {
            mensaje =
                "La contraseña actual y la nueva son obligatorias."
        });
    }

    // Valida la longitud mínima de la contraseña nueva.
    if (dto.PasswordNueva.Length < 8)
    {
        return Results.BadRequest(new
        {
            mensaje =
                "La contraseña nueva debe contener al menos 8 caracteres."
        });
    }

    // Obtiene el identificador desde el token JWT.
    var idUsuarioTexto =
        principal.FindFirstValue(
            ClaimTypes.NameIdentifier
        );

    if (!int.TryParse(idUsuarioTexto, out var idUsuario))
    {
        return Results.Unauthorized();
    }

    // Obtiene el usuario y su hash desde MySQL.
    var usuarioLogin =
        await usuarioRepository.ObtenerParaLoginPorIdAsync(
            idUsuario
        );

    if (usuarioLogin is null || !usuarioLogin.Activo)
    {
        return Results.Unauthorized();
    }

    // Construye el modelo requerido por PasswordService.
    var usuario = new Usuario
    {
        IdUsuario = usuarioLogin.IdUsuario,
        Nombre = usuarioLogin.Nombre,
        NombreUsuario = usuarioLogin.NombreUsuario,
        PasswordHash = usuarioLogin.PasswordHash,
        IdRol = usuarioLogin.IdRol,
        Activo = usuarioLogin.Activo
    };

    // Comprueba que la contraseña actual sea correcta.
    var passwordActualValido =
        passwordService.VerificarPassword(
            usuario,
            usuarioLogin.PasswordHash,
            dto.PasswordActual
        );

    if (!passwordActualValido)
    {
        return Results.BadRequest(new
        {
            mensaje = "La contraseña actual es incorrecta."
        });
    }

    // Evita reutilizar la misma contraseña.
    if (dto.PasswordActual == dto.PasswordNueva)
    {
        return Results.BadRequest(new
        {
            mensaje =
                "La contraseña nueva debe ser diferente de la actual."
        });
    }

    // Genera y guarda el nuevo hash.
    var passwordHashNuevo =
        passwordService.CrearHash(
            usuario,
            dto.PasswordNueva
        );

    var actualizado =
        await usuarioRepository.ActualizarPasswordAsync(
            idUsuario,
            passwordHashNuevo
        );

    if (!actualizado)
    {
        return Results.Problem(
            title: "No se actualizó la contraseña",
            detail:
                "No fue posible guardar la contraseña nueva.",
            statusCode:
                StatusCodes.Status500InternalServerError
        );
    }

    return Results.Ok(new
    {
        mensaje = "La contraseña se actualizó correctamente."
    });
})
.WithName("CambiarPassword")
.RequireAuthorization();
    }
}
