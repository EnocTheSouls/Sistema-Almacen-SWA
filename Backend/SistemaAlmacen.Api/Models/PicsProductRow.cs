namespace SistemaAlmacen.Api.Models;

// Representa un arnés que será enviado a PICS.
public sealed class IpsProductRow
{
    public string Proyecto
    {
        get;
        set;
    } = "";

    public string ProductNumber
    {
        get;
        set;
    } = "";

    public string ProductDesign
    {
        get;
        set;
    } = "";
}