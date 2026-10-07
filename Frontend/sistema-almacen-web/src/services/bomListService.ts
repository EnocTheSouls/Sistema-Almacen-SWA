import {
  apiClient,
} from "../api/apiClient";

// Descarga el BOM List generado
// desde la información actual de MySQL.
export async function descargarBomList(
  proyecto: "RIV" | "WS" | "DT"
) {
  const respuesta =
    await apiClient.get(
      `/bom-list/${proyecto}`,
      {
        responseType:
          "blob",
      }
    );

  const archivo =
    new Blob(
      [
        respuesta.data,
      ],
      {
        type:
          "text/csv;charset=utf-8",
      }
    );

  const url =
    window.URL
      .createObjectURL(
        archivo
      );

  const enlace =
    document.createElement(
      "a"
    );

  enlace.href =
    url;

  enlace.download =
    `BOM_LIST_${proyecto}.csv`;

  document.body.appendChild(
    enlace
  );

  enlace.click();
  enlace.remove();

  window.URL
    .revokeObjectURL(
      url
    );
}