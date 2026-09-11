using Microsoft.AspNetCore.Identity;
using SistemaAlmacen.Api.Models;

namespace SistemaAlmacen.Api.Services;

// Protege y verifica las contraseñas de los usuarios.
public sealed class PasswordService
{
    private readonly PasswordHasher<Usuario> _passwordHasher;

    public PasswordService(
        PasswordHasher<Usuario> passwordHasher)
    {
        _passwordHasher = passwordHasher;
    }

    // Convierte una contraseña en un hash seguro.
    public string CrearHash(
        Usuario usuario,
        string password)
    {
        return _passwordHasher.HashPassword(
            usuario,
            password
        );
    }

    // Verifica una contraseña contra el hash almacenado.
    public bool VerificarPassword(
        Usuario usuario,
        string passwordHash,
        string password)
    {
        var resultado =
            _passwordHasher.VerifyHashedPassword(
                usuario,
                passwordHash,
                password
            );

        return resultado is
            PasswordVerificationResult.Success or
            PasswordVerificationResult.SuccessRehashNeeded;
    }
}