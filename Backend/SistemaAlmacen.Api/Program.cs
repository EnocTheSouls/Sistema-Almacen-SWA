using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Endpoints;
using Microsoft.AspNetCore.Identity;
using SistemaAlmacen.Api.Models;
using SistemaAlmacen.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Configuración de OpenAPI
builder.Services.AddOpenApi();
builder.Services.AddSingleton<MySqlConnectionFactory>();
builder.Services.AddScoped<RolRepository>();
builder.Services.AddScoped<UsuarioRepository>();
// Registra la protección de contraseñas.
builder.Services.AddScoped<PasswordHasher<Usuario>>();
builder.Services.AddScoped<PasswordService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Endpoint principal
app.MapGet("/", () => Results.Ok(new
{
    aplicacion = "Sistema de Gestión de Almacén",
    estado = "API funcionando"
}));

// Endpoint temporal para verificar la conexión con MySQL
app.MapGet("/api/database/test", async (MySqlConnectionFactory connectionFactory) =>
{
    try
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText = """
        SELECT
            DATABASE() AS base_datos,
            CURRENT_USER() AS usuario_actual,
            VERSION() AS version_mysql;
        """;
        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return Results.Problem(
                title: "Consulta sin resultados",
                detail: "MySQL no devolvio informacion de la conexion",
                statusCode: StatusCodes.Status500InternalServerError
            );
        }
        return Results.Ok(new
        {
            estado = "Conexion exitosa",
            baseDatos = reader.GetString("base_datos"),
            usuarioActual = reader.GetString("usuario_actual"),
            versionMySql = reader.GetString("version_mysql")
        });
    }
    catch (MySqlException)
    {
        return Results.Problem(
            title: "Error de conexion con MySQL",
            detail: "No fue posible conectar con la base de datos.",
            statusCode:
            StatusCodes.Status500InternalServerError

        );
    }

}
);
app.MapRolEndpoints();
app.MapUsuarioEndpoints();
app.Run();