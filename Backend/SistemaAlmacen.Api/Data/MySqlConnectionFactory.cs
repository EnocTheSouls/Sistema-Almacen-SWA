using MySqlConnector;

namespace SistemaAlmacen.Api.Data;

public sealed class MySqlConnectionFactory
{
    private readonly string _connectionString;

    public MySqlConnectionFactory(IConfiguration configuration)
    {
        _connectionString =
        configuration.GetConnectionString("AlmacenDB")
        ?? throw new InvalidOperationException(
            "No se encontrò la cadena conexion AlmacenDB."
        );
    }
    public MySqlConnection CreateConnection()
    {
        return new MySqlConnection(_connectionString);
    }
}