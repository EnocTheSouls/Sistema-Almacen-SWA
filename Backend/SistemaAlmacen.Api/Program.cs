using System.Linq;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using SistemaAlmacen.Api.Data;
using SistemaAlmacen.Api.Endpoints;
using SistemaAlmacen.Api.Models;
using SistemaAlmacen.Api.Services;


var builder = WebApplication.CreateBuilder(args);

// Configura la documentación OpenAPI.
builder.Services.AddOpenApi();

// Registra la conexión y los repositorios.
builder.Services.AddSingleton<MySqlConnectionFactory>();
builder.Services.AddScoped<RolRepository>();
builder.Services.AddScoped<UsuarioRepository>();
builder.Services.AddScoped<ProyectoRepository>();
builder.Services.AddScoped<FamiliaRepository>();
builder.Services.AddScoped<ArnesRepository>();
builder.Services.AddScoped<ZonaRepository>();
builder.Services.AddScoped<RackRepository>();
builder.Services.AddScoped<UbicacionRepository>();
builder.Services.AddScoped<MaterialRepository>();
builder.Services.AddScoped<InventarioRepository>();
builder.Services.AddScoped<EstacionRepository>();
builder.Services.AddScoped<SolicitudRepository>();
builder.Services.AddScoped<MovimientoInventarioRepository>();
builder.Services.AddScoped<ImportacionBomRepository>();
builder.Services.AddScoped<ImportacionFiveMfRepository>();
builder.Services.AddScoped<BomRepository>();
builder.Services.AddScoped<BomImportService>();
builder.Services.AddScoped<FiveMfImportService>();



// Registra la protección de contraseñas.
builder.Services.AddScoped<PasswordHasher<Usuario>>();
builder.Services.AddScoped<PasswordService>();

// Carga la configuración JWT desde User Secrets.
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("Jwt")
);

// Registra el servicio que genera los tokens.
builder.Services.AddScoped<JwtService>();

// Obtiene la clave JWT desde User Secrets.
var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "No se encontró la clave JWT."
    );

// Obtiene el emisor autorizado.
var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "No se encontró el emisor JWT."
    );

// Obtiene la audiencia autorizada.
var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "No se encontró la audiencia JWT."
    );

// Configura la validación de los tokens recibidos.
builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    ),

                // Rechaza el token inmediatamente al vencer.
                ClockSkew = TimeSpan.Zero
            };
    });

// Habilita las reglas de autorización.
builder.Services.AddAuthorization();
// Permite que el frontend local consuma la API.
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendLocal", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Permite temporalmente solicitudes desde la red local.
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "RedLocal",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

var app = builder.Build();

app.UseCors("RedLocal");

// Aplica CORS antes de validar el JWT.
app.UseCors("FrontendLocal");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// Redirige las solicitudes HTTP hacia HTTPS.
app.UseHttpsRedirection();

// Activa la validación de identidad y permisos.
app.UseAuthentication();
app.UseAuthorization();

// Verifica que la API esté funcionando.
app.MapGet("/", () => Results.Ok(new
{
    aplicacion = "Sistema de Gestión de Almacén",
    estado = "API funcionando"
}));

// Verifica temporalmente la conexión con MySQL.
app.MapGet(
    "/api/database/test",
    async (MySqlConnectionFactory connectionFactory) =>
    {
        try
        {
            await using var connection =
                connectionFactory.CreateConnection();

            await connection.OpenAsync();

            await using var command =
                connection.CreateCommand();

            command.CommandText = """
                SELECT
                    DATABASE() AS base_datos,
                    CURRENT_USER() AS usuario_actual,
                    VERSION() AS version_mysql;
                """;

            await using var reader =
                await command.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
            {
                return Results.Problem(
                    title: "Consulta sin resultados",
                    detail:
                        "MySQL no devolvió información de la conexión.",
                    statusCode:
                        StatusCodes.Status500InternalServerError
                );
            }

            return Results.Ok(new
            {
                estado = "Conexión exitosa",
                baseDatos = reader.GetString("base_datos"),
                usuarioActual =
                    reader.GetString("usuario_actual"),
                versionMySql =
                    reader.GetString("version_mysql")
            });
        }
        catch (MySqlException)
        {
            return Results.Problem(
                title: "Error de conexión con MySQL",
                detail:
                    "No fue posible conectar con la base de datos.",
                statusCode:
                    StatusCodes.Status500InternalServerError
            );
        }
    }
);

// Devuelve información del usuario autenticado.
app.MapGet(
    "/api/auth/me",
    (HttpContext context) =>
    {
        var usuario = context.User.Identity?.Name;

        var claims = context.User.Claims
            .Select(claim => new
            {
                tipo = claim.Type,
                valor = claim.Value
            })
            .ToList();

        return Results.Ok(new
        {
            autenticado =
                context.User.Identity?.IsAuthenticated ?? false,
            usuario,
            claims
        });
    }
)
.RequireAuthorization();

// Registra las rutas de la aplicación.
app.MapRolEndpoints();
app.MapUsuarioEndpoints();
app.MapAuthEndpoints();
app.MapProyectoEndpoints();
app.MapFamiliaEndpoints();
app.MapArnesEndpoints();
app.MapZonaEndpoints();
app.MapRackEndpoints();
app.MapUbicacionEndpoints();
app.MapMaterialEndpoints();
app.MapInventarioEndpoints();
app.MapEstacionEndpoints();
app.MapSolicitudEndpoints();
app.MapMovimientoInventarioEndpoints();
app.MapBomImportEndpoints();
app.MapFiveMfImportEndpoints();
app.Run();
