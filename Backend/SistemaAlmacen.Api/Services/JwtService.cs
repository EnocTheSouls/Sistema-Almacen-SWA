using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SistemaAlmacen.Api.Dtos;

namespace SistemaAlmacen.Api.Services;

// Genera los tokens JWT para los usuarios autenticados.
public sealed class JwtService
{
    private readonly JwtSettings _settings;

    public JwtService(IOptions<JwtSettings> options)
    {
        _settings = options.Value;
    }

    // Genera un token con los datos y el rol del usuario.
    public (string Token, DateTime ExpiraEn) GenerarToken(
        UsuarioLoginDto usuario)
    {
        // Define la información incluida dentro del token.
        var claims = new List<Claim>
        {
            new(
                JwtRegisteredClaimNames.Sub,
                usuario.IdUsuario.ToString()
            ),
            new(
                JwtRegisteredClaimNames.UniqueName,
                usuario.NombreUsuario
            ),
            new(
                ClaimTypes.NameIdentifier,
                usuario.IdUsuario.ToString()
            ),
            new(
                ClaimTypes.Name,
                usuario.Nombre
            ),
            new(
                ClaimTypes.Role,
                usuario.NombreRol
            ),
            new(
                "idRol",
                usuario.IdRol.ToString()
            )
        };

        // Convierte la clave secreta para firmar el token.
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_settings.Key)
        );

        var credentials = new SigningCredentials(
            key,
            SecurityAlgorithms.HmacSha256
        );

        var fechaExpiracion =
            DateTime.UtcNow.AddMinutes(
                _settings.DuracionMinutos
            );

        // Construye el token con su emisor y duración.
        var token = new JwtSecurityToken(
            issuer: _settings.Issuer,
            audience: _settings.Audience,
            claims: claims,
            expires: fechaExpiracion,
            signingCredentials: credentials
        );

        var tokenGenerado = new JwtSecurityTokenHandler().WriteToken(token);

        // Devuelve el token y su fecha de vencimiento.
        return (tokenGenerado, fechaExpiracion);
    }
}