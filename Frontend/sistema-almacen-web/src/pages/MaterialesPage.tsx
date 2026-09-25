import Barcode from "react-barcode";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import axios from "axios";

import { Layout } from "../components/Layout";

import {
  obtenerUsuarioActual,
} from "../auth/userSession";

import {
  actualizarMaterial,
  cambiarEstadoMaterial,
  crearMaterial,
  eliminarMaterial,
  obtenerMateriales,
} from "../services/materialService";

import {
  importarBom,
} from "../services/bomImportService";

import type {
  ResultadoImportacionBom,
} from "../services/bomImportService";

import {
  importarFiveMf,
} from "../services/fiveMfImportService";

import type {
  ResultadoImportacionFiveMf,
} from "../services/fiveMfImportService";

import type {
  ActualizarMaterialRequest,
  CrearMaterialRequest,
  MaterialCatalogo,
} from "../types/material";

type FiltroEstado =
  | "todos"
  | "activos"
  | "inactivos";

interface FormularioMaterial {
  numeroParteMaterial: string;
  descripcion: string;
  unidadMedida: string;
  codigoBarras: string;
  serialKits: string;
  genericCode: string;
  tipoEmpaque: string;
  stdPack: string;
}

const crearFormularioVacio =
  (): FormularioMaterial => ({
    numeroParteMaterial: "",
    descripcion: "",
    unidadMedida: "",
    codigoBarras: "",
    serialKits: "",
    genericCode: "",
    tipoEmpaque: "",
    stdPack: "",
  });


const MATERIALES_POR_PAGINA = 10;

export function MaterialesPage() {
  const [
    paginaActual,
    setPaginaActual,
  ] = useState(1);

  const currentUser =
    obtenerUsuarioActual();


  const esAdministrador =
    currentUser?.role === "ADMIN";

  const [
    materiales,
    setMateriales,
  ] = useState<MaterialCatalogo[]>([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    guardando,
    setGuardando,
  ] = useState(false);

  const [
    errorCarga,
    setErrorCarga,
  ] = useState("");

  const [
    errorFormulario,
    setErrorFormulario,
  ] = useState("");

  const [
    mensajeExito,
    setMensajeExito,
  ] = useState("");

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  // Material seleccionado para mostrar su etiqueta.
  const [
    materialEtiqueta,
    setMaterialEtiqueta,
  ] = useState<MaterialCatalogo | null>(
    null
  );


  const [
    mostrarImportacionBom,
    setMostrarImportacionBom,
  ] = useState(false);

  const [
    importandoBom,
    setImportandoBom,
  ] = useState(false);

  const [
    archivoBom,
    setArchivoBom,
  ] = useState<File | null>(null);

  const [
    resultadoImportacion,
    setResultadoImportacion,
  ] = useState<ResultadoImportacionBom | null>(
    null
  );

  const [
    mostrarImportacionFiveMf,
    setMostrarImportacionFiveMf,
  ] = useState(false);

  const [
    importandoFiveMf,
    setImportandoFiveMf,
  ] = useState(false);

  const [
    archivoFiveMf,
    setArchivoFiveMf,
  ] = useState<File | null>(null);

  const [
    resultadoFiveMf,
    setResultadoFiveMf,
  ] = useState<
    ResultadoImportacionFiveMf | null
  >(null);


  const [
    materialEnEdicion,
    setMaterialEnEdicion,
  ] = useState<MaterialCatalogo | null>(
    null
  );

  const [
    materialAEliminar,
    setMaterialAEliminar,
  ] = useState<MaterialCatalogo | null>(
    null
  );

  const [
    mostrarConfirmacionEliminar,
    setMostrarConfirmacionEliminar,
  ] = useState(false);

  const [
    busqueda,
    setBusqueda,
  ] = useState("");

  const [
    filtroGenericCode,
    setFiltroGenericCode,
  ] = useState("Todos");

  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>(
    "todos"
  );

  const [
    formulario,
    setFormulario,
  ] = useState<FormularioMaterial>(
    crearFormularioVacio
  );

  const cargarMateriales = async () => {
    try {
      setCargando(true);
      setErrorCarga("");

      const resultado =
        await obtenerMateriales();

      setMateriales(resultado);
    } catch (error) {
      console.error(
        "Error al cargar materiales:",
        error
      );
    } finally {
      setCargando(false);
    }
  };
  useEffect(() => {
    cargarMateriales();
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda,
    filtroGenericCode,
    filtroEstado,
  ]);

  const genericCodesDisponibles =
    useMemo(() => {
      const codigos =
        materiales
          .map(
            (material) =>
              material.genericCode
                .trim()
                .toUpperCase()
          )
          .filter(Boolean);

      return [
        "Todos",
        ...Array.from(
          new Set(codigos)
        ).sort(),
      ];
    }, [materiales]);

  const materialesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLocaleLowerCase(
            "es-MX"
          );

      return [...materiales]
        .filter((material) => {
          const numeroParte =
            material.numeroParteMaterial
              .toLocaleLowerCase(
                "es-MX"
              );

          const descripcion =
            material.descripcion
              .toLocaleLowerCase(
                "es-MX"
              );

          const codigoBarras =
            (
              material.codigoBarras ??
              ""
            ).toLocaleLowerCase(
              "es-MX"
            );

          const serialKits =
            (
              material.serialKits ??
              ""
            ).toLocaleLowerCase(
              "es-MX"
            );

          const coincideTexto =
            !texto ||
            numeroParte.includes(texto) ||
            descripcion.includes(texto) ||
            codigoBarras.includes(texto) ||
            serialKits.includes(texto);

          const coincideGeneric =
            filtroGenericCode ===
            "Todos" ||
            material.genericCode
              .trim()
              .toUpperCase() ===
            filtroGenericCode;

          const coincideEstado =
            filtroEstado ===
            "todos" ||
            (
              filtroEstado ===
              "activos" &&
              material.activo
            ) ||
            (
              filtroEstado ===
              "inactivos" &&
              !material.activo
            );

          return (
            coincideTexto &&
            coincideGeneric &&
            coincideEstado
          );
        })
        .sort(
          (
            materialA,
            materialB
          ) =>
            materialA.idMaterial -
            materialB.idMaterial
        );
    }, [
      materiales,
      busqueda,
      filtroGenericCode,
      filtroEstado,
    ]);

  const totalPaginas =
    Math.max(
      1,
      Math.ceil(
        materialesFiltrados.length /
        MATERIALES_POR_PAGINA
      )
    );

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [
    paginaActual,
    totalPaginas,
  ]);

  const materialesPaginados =
    useMemo(() => {
      const inicio =
        (paginaActual - 1) *
        MATERIALES_POR_PAGINA;

      return materialesFiltrados.slice(
        inicio,
        inicio +
        MATERIALES_POR_PAGINA
      );
    }, [
      materialesFiltrados,
      paginaActual,
    ]);

  const primerRegistro =
    materialesFiltrados.length === 0
      ? 0
      : (
        paginaActual - 1
      ) * MATERIALES_POR_PAGINA + 1;

  const ultimoRegistro =
    Math.min(
      paginaActual *
      MATERIALES_POR_PAGINA,
      materialesFiltrados.length
    );
  const abrirNuevoMaterial = () => {
    setMaterialEnEdicion(null);

    setFormulario(
      crearFormularioVacio()
    );

    setMensajeExito("");
    setErrorFormulario("");
    setMostrarFormulario(true);
  };

  const abrirEdicionMaterial = (
    material: MaterialCatalogo
  ) => {
    if (!esAdministrador) {
      return;
    }

    setMaterialEnEdicion(material);

    setFormulario({
      numeroParteMaterial:
        material.numeroParteMaterial,

      descripcion:
        material.descripcion,

      unidadMedida:
        material.unidadMedida ?? "",

      // Estos datos no se modifican manualmente.
      codigoBarras:
        material.codigoBarras ?? "",

      serialKits:
        material.serialKits ?? "",

      genericCode:
        material.genericCode,

      tipoEmpaque:
        material.tipoEmpaque ?? "",

      stdPack:
        material.stdPack !== null
          ? String(material.stdPack)
          : "",
    });

    setMensajeExito("");
    setErrorFormulario("");
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    if (guardando) {
      return;
    }

    setMostrarFormulario(false);
    setMaterialEnEdicion(null);

    setFormulario(
      crearFormularioVacio()
    );

    setErrorFormulario("");
  };

  const guardarMaterial = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!esAdministrador) {
      setErrorFormulario(
        "Solo un Administrador puede registrar o modificar materiales."
      );

      return;
    }

    const numeroParte =
      formulario.numeroParteMaterial
        .trim()
        .toUpperCase();

    const descripcion =
      formulario.descripcion.trim();

    const unidadMedida =
      formulario.unidadMedida
        .trim()
        .toUpperCase();

    const genericCode =
      formulario.genericCode
        .trim()
        .toUpperCase();

    const tipoEmpaque =
      formulario.tipoEmpaque
        .trim()
        .toUpperCase();

    if (!numeroParte) {
      setErrorFormulario(
        "El número de parte es obligatorio."
      );

      return;
    }

    if (numeroParte.length > 100) {
      setErrorFormulario(
        "El número de parte no puede exceder 100 caracteres."
      );

      return;
    }

    if (!descripcion) {
      setErrorFormulario(
        "La descripción es obligatoria."
      );

      return;
    }

    if (descripcion.length > 255) {
      setErrorFormulario(
        "La descripción no puede exceder 255 caracteres."
      );

      return;
    }

    if (
      ![
        "C",
        "P",
        "S",
        "W",
      ].includes(genericCode)
    ) {
      setErrorFormulario(
        "Selecciona un Generic Code válido."
      );

      return;
    }

    const stdPack =
      formulario.stdPack.trim()
        ? Number(
          formulario.stdPack
        )
        : null;

    if (
      stdPack !== null &&
      (
        !Number.isFinite(stdPack) ||
        stdPack <= 0
      )
    ) {
      setErrorFormulario(
        "El STD Pack debe ser un número mayor que cero."
      );

      return;
    }

    if (
      Boolean(tipoEmpaque) !==
      (stdPack !== null)
    ) {
      setErrorFormulario(
        "El tipo de empaque y el STD Pack deben capturarse juntos."
      );

      return;
    }


    const datos:
      CrearMaterialRequest = {
      numeroParteMaterial:
        numeroParte,

      descripcion,

      unidadMedida:
        unidadMedida || null,

      // Se conservan al modificar.
      codigoBarras:
        materialEnEdicion
          ?.codigoBarras ?? null,

      serialKits:
        materialEnEdicion
          ?.serialKits ?? null,

      genericCode,

      tipoEmpaque:
        tipoEmpaque || null,

      stdPack,
    };

    try {
      setGuardando(true);
      setErrorFormulario("");

      if (materialEnEdicion) {
        const datosActualizacion:
          ActualizarMaterialRequest = {
          ...datos,
          activo:
            materialEnEdicion.activo,
        };

        const materialActualizado =
          await actualizarMaterial(
            materialEnEdicion.idMaterial,
            datosActualizacion
          );

        setMateriales(
          (materialesActuales) =>
            materialesActuales.map(
              (material) =>
                material.idMaterial ===
                  materialActualizado.idMaterial
                  ? materialActualizado
                  : material
            )
        );

        setMensajeExito(
          `El material "${materialActualizado.numeroParteMaterial}" se actualizó correctamente.`
        );
      } else {
        const materialCreado =
          await crearMaterial(
            datos
          );

        setMateriales(
          (materialesActuales) => [
            ...materialesActuales,
            materialCreado,
          ]
        );

        setMensajeExito(
          `El material "${materialCreado.numeroParteMaterial}" se registró correctamente.`
        );
      }

      setMostrarFormulario(false);
      setMaterialEnEdicion(null);

      setFormulario(
        crearFormularioVacio()
      );
    } catch (error) {
      console.error(
        "Error al guardar material:",
        error
      );

      setErrorFormulario(
        obtenerMensajeError(
          error,
          materialEnEdicion
            ? "No se pudo modificar el material."
            : "No se pudo registrar el material."
        )
      );
    } finally {
      setGuardando(false);
    }
  };

  const manejarCambioEstado = async (
    material: MaterialCatalogo
  ) => {
    if (!esAdministrador) {
      return;
    }

    try {
      setErrorCarga("");
      setMensajeExito("");

      const nuevoEstado =
        !material.activo;

      await cambiarEstadoMaterial(
        material.idMaterial,
        nuevoEstado
      );

      setMateriales(
        (materialesActuales) =>
          materialesActuales.map(
            (materialActual) =>
              materialActual.idMaterial ===
                material.idMaterial
                ? {
                  ...materialActual,
                  activo: nuevoEstado,
                }
                : materialActual
          )
      );

      setMensajeExito(
        nuevoEstado
          ? `El material "${material.numeroParteMaterial}" fue activado.`
          : `El material "${material.numeroParteMaterial}" fue marcado como inactivo.`
      );
    } catch (error) {
      setErrorCarga(
        obtenerMensajeError(
          error,
          "No se pudo cambiar el estado del material."
        )
      );
    }
  };

  const solicitarEliminacion = (
    material: MaterialCatalogo
  ) => {
    if (!esAdministrador) {
      return;
    }

    setMaterialAEliminar(material);
    setErrorFormulario("");
    setMensajeExito("");

    setMostrarConfirmacionEliminar(
      true
    );
  };

  const cancelarEliminacion = () => {
    if (guardando) {
      return;
    }

    setMaterialAEliminar(null);
    setErrorFormulario("");

    setMostrarConfirmacionEliminar(
      false
    );
  };

  const confirmarEliminacion =
    async () => {
      if (
        !esAdministrador ||
        !materialAEliminar
      ) {
        return;
      }

      try {
        setGuardando(true);
        setErrorFormulario("");

        await eliminarMaterial(
          materialAEliminar.idMaterial
        );

        setMateriales(
          (materialesActuales) =>
            materialesActuales.filter(
              (material) =>
                material.idMaterial !==
                materialAEliminar.idMaterial
            )
        );

        setMensajeExito(
          `El material "${materialAEliminar.numeroParteMaterial}" fue eliminado.`
        );

        setMaterialAEliminar(null);

        setMostrarConfirmacionEliminar(
          false
        );
      } catch (error) {
        setErrorFormulario(
          obtenerMensajeError(
            error,
            "No se pudo eliminar el material."
          )
        );
      } finally {
        setGuardando(false);
      }
    };

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroGenericCode("Todos");
    setFiltroEstado("todos");
  };

  const abrirImportacionFiveMf = () => {
    setArchivoFiveMf(null);
    setResultadoFiveMf(null);
    setErrorFormulario("");
    setMensajeExito("");

    setMostrarImportacionFiveMf(
      true
    );
  };

  const cerrarImportacionFiveMf = () => {
    if (importandoFiveMf) {
      return;
    }

    setMostrarImportacionFiveMf(
      false
    );

    setArchivoFiveMf(null);
    setResultadoFiveMf(null);
    setErrorFormulario("");
  };

  const ejecutarImportacionFiveMf =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!archivoFiveMf) {
        setErrorFormulario(
          "Selecciona el archivo 5MF."
        );

        return;
      }

      try {
        setImportandoFiveMf(true);
        setErrorFormulario("");
        setResultadoFiveMf(null);

        const respuesta =
          await importarFiveMf(
            archivoFiveMf
          );

        setResultadoFiveMf(
          respuesta.resultado
        );

        setMensajeExito(
          respuesta.mensaje
        );
      } catch (error) {
        setErrorFormulario(
          obtenerMensajeError(
            error,
            "No se pudo importar el archivo 5MF."
          )
        );
      } finally {
        setImportandoFiveMf(false);
      }
    };


  // Descarga las listas IPS separadas por proyecto.
  const descargarListasIps = async () => {
    try {
      setErrorCarga("");
      setMensajeExito("");

      const token =
        localStorage.getItem("token");

      console.log(
        "Solicitando generación de listas IPS..."
      );

      const response =
        await fetch(
          "http://localhost:5042/api/ips/exportar-listas",
          {
            method: "GET",
            headers: token
              ? {
                Authorization:
                  `Bearer ${token}`,
              }
              : undefined,
          }
        );

      console.log(
        "Respuesta IPS:",
        response.status
      );

      if (!response.ok) {
        const contenido =
          await response.text();

        throw new Error(
          contenido ||
          `No fue posible generar las listas IPS. Código ${response.status}.`
        );
      }

      const archivo =
        await response.blob();

      console.log(
        "Tipo de archivo IPS:",
        archivo.type
      );

      console.log(
        "Tamaño del archivo IPS:",
        archivo.size
      );

      if (archivo.size === 0) {
        throw new Error(
          "El archivo ZIP generado está vacío."
        );
      }

      const url =
        window.URL.createObjectURL(
          archivo
        );

      const enlace =
        document.createElement("a");

      enlace.href = url;
      enlace.download =
        `LISTAS_IPS_${new Date()
          .toISOString()
          .slice(0, 10)
        }.zip`;

      enlace.style.display = "none";

      document.body.appendChild(
        enlace
      );

      enlace.click();

      setTimeout(() => {
        enlace.remove();

        window.URL.revokeObjectURL(
          url
        );
      }, 1000);

      setMensajeExito(
        "Las listas IPS se generaron correctamente."
      );
    } catch (error) {
      console.error(
        "Error al generar listas IPS:",
        error
      );

      setErrorCarga(
        error instanceof Error
          ? error.message
          : "No fue posible generar las listas IPS."
      );
    }
  };







  const abrirImportacionBom = () => {
    setArchivoBom(null);
    setResultadoImportacion(null);
    setErrorFormulario("");
    setMensajeExito("");
    setMostrarImportacionBom(true);
  };

  const cerrarImportacionBom = () => {
    if (importandoBom) {
      return;
    }

    setMostrarImportacionBom(false);
    setArchivoBom(null);
    setResultadoImportacion(null);
    setErrorFormulario("");
  };


  const ejecutarImportacionBom = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!archivoBom) {
      setErrorFormulario(
        "Selecciona un archivo Excel."
      );

      return;
    }

    try {
      setImportandoBom(true);
      setErrorFormulario("");
      setResultadoImportacion(null);

      const respuesta =
        await importarBom({
          archivo: archivoBom,
        });

      setResultadoImportacion(
        respuesta.resultado
      );

      await cargarMateriales();
    } catch (error) {
      setErrorFormulario(
        obtenerMensajeError(
          error,
          "No se pudo importar el BOM."
        )
      );
    } finally {
      setImportandoBom(false);
    }
  };


  const mostrarAvisoEscaneo = () => {
    window.alert(
      "La función para escanear el material se habilitará en una siguiente etapa."
    );
  };

  // Descarga el Excel con todos los códigos de barras.
const exportarCodigosCsv = async () => {
  try {
    setErrorCarga("");
    setMensajeExito("");

    const token =
      localStorage.getItem("token");

    const respuesta =
      await fetch(
        "http://localhost:5042/api/materiales/exportar-codigos-barras",
        {
          method: "GET",
          headers: token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : undefined,
        }
      );

    if (!respuesta.ok) {
      const contenido =
        await respuesta.text();

      throw new Error(
        contenido ||
          `No fue posible generar el Excel. Código ${respuesta.status}.`
      );
    }

    const archivo =
      await respuesta.blob();

    if (archivo.size === 0) {
      throw new Error(
        "El archivo Excel generado está vacío."
      );
    }

    const url =
      window.URL.createObjectURL(
        archivo
      );

    const enlace =
      document.createElement("a");

    enlace.href = url;

    enlace.download =
      `CODIGOS_BARRAS_MATERIALES_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`;

    enlace.style.display = "none";

    document.body.appendChild(
      enlace
    );

    enlace.click();

    setTimeout(() => {
      enlace.remove();

      window.URL.revokeObjectURL(
        url
      );
    }, 1000);

    setMensajeExito(
      "El Excel con los códigos de barras se generó correctamente."
    );
  } catch (error) {
    console.error(
      "Error al exportar códigos de barras:",
      error
    );

    setErrorCarga(
      error instanceof Error
        ? error.message
        : "No fue posible exportar los códigos de barras."
    );
  }
};

  

  return (
    <Layout>


      <div style={pageContainerStyle}>
        <section style={cardStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Materiales
              </h1>
              <br />
              {esAdministrador && (
                <div style={headerActionsStyle}>
                  <div style={importActionsStyle}>
                    <button
                      type="button"
                      onClick={abrirImportacionFiveMf}
                      style={importButtonStyle}
                    >
                      Importar 5MF
                    </button>

                    <button
                      type="button"
                      onClick={descargarListasIps}
                      style={importButtonStyle}
                    >
                      Generar listas IPS
                    </button>

                    <button
                      type="button"
                      onClick={abrirImportacionBom}
                      style={importButtonStyle}
                    >
                      Importar BOM
                    </button>

                  </div>

                  <button
                    type="button"
                    onClick={abrirNuevoMaterial}
                    style={primaryButtonStyle}
                  >
                    + Nuevo material
                  </button>
                </div>
              )}




            </div>
          </div>

          {mensajeExito && (
            <div style={successStyle}>
              {mensajeExito}
            </div>
          )}

          {errorCarga && (
            <div style={errorStyle}>
              {errorCarga}
            </div>
          )}

          <div style={filtersStyle}>
            <div style={filterGroupStyle}>
              <label
                htmlFor="buscarMaterial"
                style={labelStyle}
              >
                Buscar material
              </label>

              <input
                id="buscarMaterial"
                type="text"
                value={busqueda}
                onChange={(event) => {
                  setBusqueda(
                    event.target.value
                  );
                }}
                placeholder="Número de parte o descripción"
                style={inputStyle}
              />
            </div>

            <div style={filterGroupStyle}>
              <label
                htmlFor="filtroGeneric"
                style={labelStyle}
              >
                Generic Code
              </label>

              <select
                id="filtroGeneric"
                value={
                  filtroGenericCode
                }
                onChange={(event) => {
                  setFiltroGenericCode(
                    event.target.value
                  );
                }}
                style={inputStyle}
              >
                {genericCodesDisponibles.map(
                  (codigo) => (
                    <option
                      key={codigo}
                      value={codigo}
                    >
                      {codigo}
                    </option>
                  )
                )}
              </select>
            </div>

            <div style={filterGroupStyle}>
              <label
                htmlFor="filtroEstado"
                style={labelStyle}
              >
                Estado
              </label>

              <select
                id="filtroEstado"
                value={filtroEstado}
                onChange={(event) => {
                  setFiltroEstado(
                    event.target
                      .value as FiltroEstado
                  );
                }}
                style={inputStyle}
              >
                <option value="todos">
                  Todos
                </option>

                <option value="activos">
                  Activos
                </option>

                <option value="inactivos">
                  Inactivos
                </option>
              </select>
            </div>

            <button
              type="button"
              onClick={limpiarFiltros}
              style={
                secondaryButtonStyle
              }
            >
              Limpiar filtros
            </button>
          </div>

          <div style={resultsHeaderStyle}>
            <h2 style={sectionTitleStyle}>
              Catálogo de materiales
            </h2>
            <span style={counterStyle}>
              Mostrando{" "}
              {primerRegistro}
              {" - "}
              {ultimoRegistro}
              {" de "}
              {materialesFiltrados.length}
            </span>
          </div>

          {cargando ? (
            <div style={messageStyle}>
              Cargando materiales...
            </div>
          ) : materialesFiltrados.length ===
            0 ? (
            <div style={emptyStyle}>
              No hay materiales que
              coincidan con los filtros.
            </div>
          ) : (
            <div style={tableContainerStyle}>
              <table style={tableStyle}>
                <thead>
                  <tr style={tableHeaderStyle}>
                    <th
                      style={{
                        textAlign: "center",
                        width: "60px",
                        minWidth: "60px",
                      }}
                    >
                      N.º
                    </th>

                    <th style={thStyle}>
                      Número de parte
                    </th>

                    <th style={thStyle}>
                      Descripción
                    </th>

                    <th style={thStyle}>
                      Generic
                    </th>

                    <th style={thStyle}>
                      Unidad
                    </th>

                    <th style={thStyle}>
                      Empaque
                    </th>

                    <th style={thStyle}>
                      STD Pack
                    </th>

                    <th style={thStyle}>
                      Estado
                    </th>

                    {esAdministrador && (
                      <th
                        style={{
                          ...thStyle,
                          minWidth: "210px",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minHeight: "28px",
                          }}
                        >
                          <span>
                            Acciones
                          </span>

                          <button
                            type="button"
                            onClick={exportarCodigosCsv}
                            disabled={materiales.length === 0}
                            title="Exportar todos los códigos de barras"
                            aria-label="Exportar todos los códigos de barras"
                            style={{
                              position: "absolute",
                              right: 0,
                              width: "30px",
                              height: "30px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              border: "1px solid #1c4e9c",
                              borderRadius: "6px",
                              background: "#ffffff",
                              color: "#1c4e9c",
                              cursor:
                                materiales.length === 0
                                  ? "not-allowed"
                                  : "pointer",
                              opacity:
                                materiales.length === 0
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 2h8l4 4v16H6V2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M14 2v5h5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M9 12h6M9 16h6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {materialesPaginados.map((material, indice) => (
                    <tr key={material.idMaterial}>
                      <td
                        style={{
                          textAlign: "center",
                          width: "60px",
                          minWidth: "60px",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {(paginaActual - 1) * MATERIALES_POR_PAGINA +
                          indice +
                          1}
                      </td>

                      <td style={tdStyle}>
                        <strong>
                          {
                            material.numeroParteMaterial
                          }
                        </strong>
                      </td>

                      <td style={tdStyle}>
                        {
                          material.descripcion
                        }
                      </td>

                      <td style={tdStyle}>
                        <span
                          style={
                            genericCodeStyle
                          }
                        >
                          {
                            material.genericCode
                          }
                        </span>
                      </td>

                      <td style={tdStyle}>
                        {material.unidadMedida ??
                          "N/A"}
                      </td>

                      <td style={tdStyle}>
                        {material.tipoEmpaque ??
                          "N/A"}
                      </td>

                      <td style={tdStyle}>
                        {material.stdPack ??
                          "N/A"}
                      </td>

                      <td style={tdStyle}>
                        <button
                          type="button"
                          disabled={
                            !esAdministrador
                          }
                          onClick={() => {
                            manejarCambioEstado(
                              material
                            );
                          }}
                          style={
                            material.activo
                              ? activeStatusStyle
                              : inactiveStatusStyle
                          }
                        >
                          {material.activo
                            ? "Activo"
                            : "Inactivo"}
                        </button>
                      </td>
                      {esAdministrador && (
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              abrirEdicionMaterial(
                                material
                              );
                            }}
                            style={editButtonStyle}
                          >
                            Modificar
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              solicitarEliminacion(
                                material
                              );
                            }}
                            style={deleteButtonStyle}
                          >
                            Eliminar
                          </button>

                          <button
                            type="button"
                            title={`Ver etiqueta de ${material.numeroParteMaterial}`}
                            aria-label={`Ver etiqueta de ${material.numeroParteMaterial}`}
                            onClick={() => {
                              setMaterialEtiqueta(
                                material
                              );
                            }}
                            style={{
                              width: "34px",
                              height: "34px",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginLeft: "7px",
                              padding: 0,
                              border: "none",
                              borderRadius: 0,
                              background: "transparent",
                              color: "#2a302e",
                              cursor: "pointer",
                              verticalAlign: "middle",
                            }}
                          >
                            <svg
                              width="17"
                              height="17"
                              viewBox="0 0 24 24"
                              fill="none"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 2h8l4 4v16H6V2Z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M14 2v5h5"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinejoin="round"
                              />

                              <path
                                d="M9 12h6M9 16h6"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          </button>
                        </td>
                      )}


                    </tr>
                  )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {totalPaginas > 1 && (
        <div style={paginationStyle}>
          <button
            type="button"
            onClick={() => {
              setPaginaActual(
                (pagina) =>
                  Math.max(
                    1,
                    pagina - 1
                  )
              );
            }}
            disabled={paginaActual === 1}
            style={{
              ...paginationButtonStyle,
              opacity:
                paginaActual === 1
                  ? 0.5
                  : 1,
            }}
          >
            Anterior
          </button>

          <span style={paginationInfoStyle}>
            Página {paginaActual} de{" "}
            {totalPaginas}
          </span>

          <button
            type="button"
            onClick={() => {
              setPaginaActual(
                (pagina) =>
                  Math.min(
                    totalPaginas,
                    pagina + 1
                  )
              );
            }}
            disabled={
              paginaActual === totalPaginas
            }
            style={{
              ...paginationButtonStyle,
              opacity:
                paginaActual === totalPaginas
                  ? 0.5
                  : 1,
            }}
          >
            Siguiente
          </button>
        </div>
      )}
      {materialEtiqueta && (
        <div style={modalOverlayStyle}>
          <section
            style={{
              ...modalStyle,
              maxWidth: "520px",
            }}
          >
            <div style={modalHeaderStyle}>
              <div>
                <h2 style={modalTitleStyle}>
                  Etiqueta de material
                </h2>

                <p style={modalDescriptionStyle}>
                  Vista previa del código escaneable.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMaterialEtiqueta(null);
                }}
                aria-label="Cerrar etiqueta"
                style={closeButtonStyle}
              >
                ×
              </button>
            </div>

            <div
              style={{
                padding: "24px",
                border: "2px solid #102957",
                borderRadius: "12px",
                background: "#ffffff",
                color: "#102957",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  marginBottom: "8px",
                  fontSize: "22px",
                  fontWeight: "800",
                }}
              >
                {materialEtiqueta.numeroParteMaterial}
              </div>

              <div
                style={{
                  marginBottom: "18px",
                  color: "#475569",
                  fontSize: "14px",
                }}
              >
                {materialEtiqueta.descripcion}
              </div>

              <div
                style={{
                  maxWidth: "100%",
                  overflowX: "auto",
                }}
              >
                <Barcode
                  value={
                    materialEtiqueta.codigoBarras ||
                    materialEtiqueta.numeroParteMaterial
                  }
                  format="CODE128"
                  width={2}
                  height={90}
                  displayValue
                  fontSize={16}
                  margin={10}
                />
              </div>

              <div
                style={{
                  marginTop: "12px",
                  color: "#475569",
                  fontSize: "12px",
                }}
              >
                Generic Code:{" "}
                <strong>
                  {materialEtiqueta.genericCode}
                </strong>
              </div>
            </div>

            <div style={modalActionsStyle}>
              <button
                type="button"
                onClick={() => {
                  setMaterialEtiqueta(null);
                }}
                style={secondaryButtonStyle}
              >
                Cerrar
              </button>
            </div>
          </section>
        </div>
      )}

      {mostrarFormulario &&
        esAdministrador && (
          <div style={modalOverlayStyle}>
            <section style={modalStyle}>
              <div style={modalHeaderStyle}>
                <div>
                  <h2 style={modalTitleStyle}>
                    {materialEnEdicion
                      ? "Modificar material"
                      : "Nuevo material"}
                  </h2>

                  <p
                    style={
                      modalDescriptionStyle
                    }
                  >
                    {materialEnEdicion
                      ? "Modifica los datos del material seleccionado."
                      : "Registra manualmente un material para realizar pruebas."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    cerrarFormulario
                  }
                  disabled={guardando}
                  aria-label="Cerrar"
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={
                  guardarMaterial
                }
              >
                <div style={formGridStyle}>
                  <div
                    style={
                      formGroupFullStyle
                    }
                  >
                    <label
                      htmlFor="numeroParte"
                      style={labelStyle}
                    >
                      Número de parte *
                    </label>

                    <input
                      id="numeroParte"
                      type="text"
                      value={
                        formulario.numeroParteMaterial
                      }
                      onChange={(event) => {
                        const valor =
                          event.target.value;

                        setFormulario(
                          (actual) => ({
                            ...actual,
                            numeroParteMaterial:
                              valor,
                          })
                        );
                      }}
                      maxLength={100}
                      autoFocus
                      disabled={guardando}
                      placeholder="Ejemplo: 68422541AA"
                      style={inputStyle}
                    />
                  </div>

                  <div
                    style={
                      formGroupFullStyle
                    }
                  >
                    <label
                      htmlFor="descripcion"
                      style={labelStyle}
                    >
                      Descripción *
                    </label>

                    <textarea
                      id="descripcion"
                      value={
                        formulario.descripcion
                      }
                      onChange={(event) => {
                        const valor =
                          event.target.value;

                        setFormulario(
                          (actual) => ({
                            ...actual,
                            descripcion:
                              valor,
                          })
                        );
                      }}
                      maxLength={255}
                      disabled={guardando}
                      placeholder="Descripción del material"
                      style={textareaStyle}
                    />

                    <small
                      style={helpTextStyle}
                    >
                      {
                        formulario.descripcion
                          .length
                      }
                      /255 caracteres
                    </small>
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="genericCodeForm"
                      style={labelStyle}
                    >
                      Generic Code *
                    </label>

                    <select
                      id="genericCodeForm"
                      value={
                        formulario.genericCode
                      }
                      onChange={(event) => {
                        const valor =
                          event.target.value;

                        setFormulario(
                          (actual) => ({
                            ...actual,
                            genericCode:
                              valor,
                          })
                        );
                      }}
                      disabled={guardando}
                      style={inputStyle}
                    >
                      <option value="">
                        Seleccionar
                      </option>

                      <option value="C">
                        C
                      </option>

                      <option value="P">
                        P
                      </option>

                      <option value="S">
                        S
                      </option>

                      <option value="W">
                        W
                      </option>
                    </select>
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="unidadMedida"
                      style={labelStyle}
                    >
                      Unidad de medida
                    </label>

                    <select
                      id="unidadMedida"
                      value={
                        formulario.unidadMedida
                      }
                      onChange={(event) => {
                        const valor =
                          event.target.value;

                        setFormulario(
                          (actual) => ({
                            ...actual,
                            unidadMedida:
                              valor,
                          })
                        );
                      }}
                      disabled={guardando}
                      style={inputStyle}
                    >
                      <option value="">
                        Sin especificar
                      </option>

                      <option value="PZA">
                        PZA
                      </option>

                      <option value="M">
                        M
                      </option>

                      <option value="KG">
                        KG
                      </option>

                      <option value="KIT">
                        KIT
                      </option>

                      <option value="ROLLO">
                        ROLLO
                      </option>
                    </select>
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="tipoEmpaque"
                      style={labelStyle}
                    >
                      Tipo de empaque
                    </label>

                    <select
                      id="tipoEmpaque"
                      value={
                        formulario.tipoEmpaque
                      }
                      onChange={(event) => {
                        const valor =
                          event.target.value;

                        setFormulario(
                          (actual) => ({
                            ...actual,
                            tipoEmpaque:
                              valor,

                            stdPack:
                              valor
                                ? actual.stdPack
                                : "",
                          })
                        );
                      }}
                      disabled={guardando}
                      style={inputStyle}
                    >
                      <option value="">
                        Sin especificar
                      </option>

                      <option value="CAJA">
                        Caja
                      </option>

                      <option value="BOLSA">
                        Bolsa
                      </option>

                      <option value="ROLLO">
                        Rollo
                      </option>
                    </select>
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="stdPack"
                      style={labelStyle}
                    >
                      STD Pack
                    </label>

                    <input
                      id="stdPack"
                      type="number"
                      min="0.0001"
                      step="0.0001"
                      value={
                        formulario.stdPack
                      }
                      onChange={(event) => {
                        const valor =
                          event.target.value;

                        setFormulario(
                          (actual) => ({
                            ...actual,
                            stdPack: valor,
                          })
                        );
                      }}
                      disabled={
                        guardando ||
                        !formulario.tipoEmpaque
                      }
                      placeholder={
                        formulario.tipoEmpaque
                          ? "Cantidad por empaque"
                          : "Selecciona un empaque"
                      }
                      style={{
                        ...inputStyle,

                        background:
                          formulario.tipoEmpaque
                            ? "#ffffff"
                            : "#f1f5f9",
                      }}
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="codigoBarras"
                      style={labelStyle}
                    >
                      Escanear codigo
                    </label>

                    <div style={scanFieldStyle}>
                      <input
                        id="codigoBarras"
                        type="text"
                        value={
                          formulario.codigoBarras
                        }
                        disabled
                        placeholder=""
                        style={
                          disabledInputStyle
                        }
                      />

                      <button
                        type="button"
                        onClick={
                          mostrarAvisoEscaneo
                        }
                        disabled={guardando}
                        style={scanButtonStyle}
                      >
                        Escanear
                      </button>
                    </div>
                  </div>


                </div>

                {errorFormulario && (
                  <div style={errorStyle}>
                    {errorFormulario}
                  </div>
                )}

                <div style={modalActionsStyle}>
                  <button
                    type="button"
                    onClick={
                      cerrarFormulario
                    }
                    disabled={guardando}
                    style={
                      secondaryButtonStyle
                    }
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={guardando}
                    style={{
                      ...primaryButtonStyle,

                      opacity:
                        guardando
                          ? 0.65
                          : 1,
                    }}
                  >
                    {guardando
                      ? "Guardando..."
                      : materialEnEdicion
                        ? "Guardar cambios"
                        : "Guardar material"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      {mostrarImportacionFiveMf &&
        esAdministrador && (
          <div style={modalOverlayStyle}>
            <section style={modalStyle}>
              <div style={modalHeaderStyle}>
                <div>
                  <h2 style={modalTitleStyle}>
                    Importar 5MF
                  </h2>

                  <p style={modalDescriptionStyle}>
                    Selecciona el archivo 5MF.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarImportacionFiveMf}
                  disabled={importandoFiveMf}
                  aria-label="Cerrar"
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={ejecutarImportacionFiveMf}
              >
                <div style={formGroupFullStyle}>
                  <label
                    htmlFor="archivoFiveMf"
                    style={labelStyle}
                  >
                    Archivo 5MF *
                  </label>

                  <input
                    id="archivoFiveMf"
                    type="file"
                    accept=".xlsx"
                    disabled={importandoFiveMf}
                    style={inputStyle}
                    onChange={(event) => {
                      const archivo =
                        event.target.files?.[0] ??
                        null;

                      setArchivoFiveMf(archivo);
                      setResultadoFiveMf(null);
                      setErrorFormulario("");
                    }}
                  />
                </div>

                {archivoFiveMf && (
                  <div style={selectedFileStyle}>
                    Archivo seleccionado:{" "}
                    <strong>
                      {archivoFiveMf.name}
                    </strong>
                  </div>
                )}

                {errorFormulario && (
                  <div style={errorStyle}>
                    {errorFormulario}
                  </div>
                )}

                {resultadoFiveMf && (
                  <div style={importResultStyle}>
                    <h3 style={importResultTitleStyle}>
                      Resultado del 5MF
                    </h3>

                    <div style={importSummaryStyle}>
                      <span>
                        Total:{" "}
                        <strong>
                          {resultadoFiveMf.totalFilas}
                        </strong>
                      </span>

                      <span>
                        Correctas:{" "}
                        <strong>
                          {resultadoFiveMf.filasCorrectas}
                        </strong>
                      </span>

                      <span>
                        Advertencias:{" "}
                        <strong>
                          {
                            resultadoFiveMf
                              .filasConAdvertencia
                          }
                        </strong>
                      </span>

                      <span>
                        Errores:{" "}
                        <strong>
                          {resultadoFiveMf.filasConError}
                        </strong>
                      </span>

                      <span>
                        Familias:{" "}
                        <strong>
                          {
                            resultadoFiveMf
                              .familiasEncontradas
                          }
                        </strong>
                      </span>

                      <span>
                        Arneses creados:{" "}
                        <strong>
                          {resultadoFiveMf.arnesesCreados}
                        </strong>
                      </span>

                      <span>
                        Planes:{" "}
                        <strong>
                          {
                            resultadoFiveMf
                              .planesSemanalesGuardados
                          }
                        </strong>
                      </span>
                    </div>
                  </div>
                )}

                <div style={modalActionsStyle}>
                  <button
                    type="button"
                    onClick={cerrarImportacionFiveMf}
                    disabled={importandoFiveMf}
                    style={secondaryButtonStyle}
                  >
                    Cerrar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      importandoFiveMf ||
                      !archivoFiveMf
                    }
                    style={{
                      ...primaryButtonStyle,
                      opacity:
                        importandoFiveMf ||
                          !archivoFiveMf
                          ? 0.65
                          : 1,
                    }}
                  >
                    {importandoFiveMf
                      ? "Importando..."
                      : "Importar 5MF"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}




      {mostrarImportacionBom &&
        esAdministrador && (
          <div style={modalOverlayStyle}>
            <section style={modalStyle}>
              <div style={modalHeaderStyle}>
                <div>
                  <h2 style={modalTitleStyle}>
                    Importar BOM
                  </h2>

                  <p style={modalDescriptionStyle}>
                    Carga el archivo BOM.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={cerrarImportacionBom}
                  disabled={importandoBom}
                  aria-label="Cerrar"
                  style={closeButtonStyle}
                >
                  ×
                </button>
              </div>
              <form onSubmit={ejecutarImportacionBom}>
                <div style={formGridStyle}>
                  <div style={formGroupFullStyle}>
                    <label
                      htmlFor="archivoBom"
                      style={labelStyle}
                    >
                      Archivo Excel *
                    </label>

                    <input
                      id="archivoBom"
                      type="file"
                      accept=".xlsx"
                      onChange={(event) => {
                        const archivoSeleccionado =
                          event.target.files?.[0] ??
                          null;

                        setArchivoBom(
                          archivoSeleccionado
                        );

                        setResultadoImportacion(
                          null
                        );

                        setErrorFormulario("");
                      }}
                      disabled={importandoBom}
                      style={inputStyle}
                    />

                    <small style={helpTextStyle}>
                      Solo archivos con extensión .xlsx
                    </small>
                  </div>
                </div>

                {archivoBom && (
                  <div style={selectedFileStyle}>
                    Archivo seleccionado:{" "}
                    <strong>
                      {archivoBom.name}
                    </strong>
                  </div>
                )}

                {errorFormulario && (
                  <div style={errorStyle}>
                    {errorFormulario}
                  </div>
                )}
                {resultadoImportacion && (
                  <div style={importResultStyle}>
                    <h3 style={importResultTitleStyle}>
                      Resultado de la importación
                    </h3>

                    <div style={importSummaryStyle}>
                      <span>
                        Total:{" "}
                        <strong>
                          {resultadoImportacion.totalFilas}
                        </strong>
                      </span>

                      <span>
                        Correctas:{" "}
                        <strong>
                          {resultadoImportacion.filasCorrectas}
                        </strong>
                      </span>

                      <span>
                        Advertencias:{" "}
                        <strong>
                          {
                            resultadoImportacion
                              .filasConAdvertencia
                          }
                        </strong>
                      </span>

                      <span>
                        Errores:{" "}
                        <strong>
                          {resultadoImportacion.filasConError}
                        </strong>
                      </span>
                    </div>

                    {resultadoImportacion.errores.length > 0 && (
                      <details style={importDetailsErrorStyle}>
                        <summary style={importDetailsSummaryStyle}>
                          Ver errores (
                          {resultadoImportacion.errores.length}
                          )
                        </summary>

                        <div style={importTableContainerStyle}>
                          <table style={importTableStyle}>
                            <thead>
                              <tr>
                                <th style={importTableHeaderStyle}>
                                  Fila
                                </th>

                                <th style={importTableHeaderStyle}>
                                  Error
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {resultadoImportacion.errores.map(
                                (error, indice) => (
                                  <tr
                                    key={
                                      `${error.numeroFila}-` +
                                      `${indice}`
                                    }
                                  >
                                    <td style={importTableCellStyle}>
                                      {error.numeroFila}
                                    </td>

                                    <td style={importTableCellStyle}>
                                      {error.mensaje}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </details>
                    )}

                    {resultadoImportacion.advertencias.length >
                      0 && (
                        <details style={importDetailsWarningStyle}>
                          <summary style={importDetailsSummaryStyle}>
                            Ver advertencias (
                            {
                              resultadoImportacion
                                .advertencias.length
                            }
                            )
                          </summary>

                          <div style={importTableContainerStyle}>
                            <table style={importTableStyle}>
                              <thead>
                                <tr>
                                  <th style={importTableHeaderStyle}>
                                    Fila
                                  </th>

                                  <th style={importTableHeaderStyle}>
                                    Advertencia
                                  </th>
                                </tr>
                              </thead>

                              <tbody>
                                {resultadoImportacion.advertencias.map(
                                  (advertencia, indice) => (
                                    <tr
                                      key={
                                        `${advertencia.numeroFila}-` +
                                        `${indice}`
                                      }
                                    >
                                      <td style={importTableCellStyle}>
                                        {advertencia.numeroFila}
                                      </td>

                                      <td style={importTableCellStyle}>
                                        {advertencia.mensaje}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      )}
                  </div>
                )}

                <div style={modalActionsStyle}>
                  <button
                    type="button"
                    onClick={cerrarImportacionBom}
                    disabled={importandoBom}
                    style={secondaryButtonStyle}
                  >
                    Cerrar
                  </button>

                  {!resultadoImportacion && (
                    <button
                      type="submit"
                      disabled={
                        importandoBom ||
                        !archivoBom
                      }
                      style={{
                        ...primaryButtonStyle,
                        opacity:
                          importandoBom ||
                            !archivoBom
                            ? 0.65
                            : 1,
                      }}
                    >
                      {importandoBom
                        ? "Importando..."
                        : "Importar BOM"}
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        )}

      {mostrarConfirmacionEliminar &&
        materialAEliminar && (
          <div style={modalOverlayStyle}>
            <section
              style={{
                ...modalStyle,
                maxWidth: "470px",
                textAlign: "center",
              }}
            >
              <div style={warningCircleStyle}>
                ×
              </div>

              <h2 style={modalTitleStyle}>
                Eliminar material
              </h2>

              <p
                style={
                  modalDescriptionStyle
                }
              >
                ¿Estás seguro de eliminar
                el material{" "}
                <strong>
                  {
                    materialAEliminar
                      .numeroParteMaterial
                  }
                </strong>
                ?
              </p>

              <p style={warningTextStyle}>
                Solo podrá eliminarse si no
                tiene inventario, solicitudes,
                movimientos o BOM relacionados.
                En caso contrario, deberás
                marcarlo como inactivo.
              </p>

              {errorFormulario && (
                <div style={errorStyle}>
                  {errorFormulario}
                </div>
              )}

              <div
                style={{
                  ...modalActionsStyle,
                  justifyContent:
                    "center",
                }}
              >
                <button
                  type="button"
                  onClick={
                    cancelarEliminacion
                  }
                  disabled={guardando}
                  style={
                    secondaryButtonStyle
                  }
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminacion
                  }
                  disabled={guardando}
                  style={
                    confirmDeleteButtonStyle
                  }
                >
                  {guardando
                    ? "Eliminando..."
                    : "Eliminar"}
                </button>
              </div>
            </section>
          </div>
        )}
    </Layout>
  );
}

function obtenerMensajeError(
  error: unknown,
  mensajePredeterminado: string
) {
  if (axios.isAxiosError(error)) {
    const mensaje =
      error.response?.data?.mensaje;

    if (
      typeof mensaje === "string"
    ) {
      return mensaje;
    }

    const detalle =
      error.response?.data?.detail;

    if (
      typeof detalle === "string"
    ) {
      return detalle;
    }
  }

  return mensajePredeterminado;
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1400px",
  margin: "0 auto",
};

const cardStyle = {
  padding: "30px",
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 4px 15px rgba(0, 0, 0, 0.08)",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "30px",
};


const primaryButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "9px",
  background: "#1c4e9c",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const secondaryButtonStyle = {
  minHeight: "43px",
  padding: "10px 17px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const filtersStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(280px, 2fr) minmax(155px, 1fr) minmax(155px, 1fr) auto",
  alignItems: "end",
  gap: "13px",
  marginBottom: "23px",
  padding: "17px",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  background: "#f8fafc",
};

const filterGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const labelStyle = {
  color: "#17335f",
  fontSize: "13px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "43px",
  boxSizing: "border-box" as const,
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontFamily: "inherit",
  fontSize: "14px",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "90px",
  resize: "vertical" as const,
};

const helpTextStyle = {
  color: "#64748b",
  fontSize: "12px"
};

const resultsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
  marginBottom: "13px",
};

const sectionTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "19px",
};

const counterStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "800",
};

const tableContainerStyle = {
  width: "100%",
  overflowX: "auto" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
  background: "#f8fafc",
};

const thStyle = {
  padding: "13px",
  borderBottom:
    "2px solid #e2e8f0",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};

const tdStyle = {
  padding: "13px",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#334155",
  fontSize: "14px",
};

const genericCodeStyle = {
  minWidth: "31px",
  display: "inline-flex",
  justifyContent: "center",
  padding: "5px 8px",
  borderRadius: "6px",
  background: "#e0e7ff",
  color: "#3730a3",
  fontSize: "12px",
  fontWeight: "800",
};

const activeStatusStyle = {
  minWidth: "78px",
  padding: "6px 10px",
  border: "1px solid #bbf7d0",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
};

const inactiveStatusStyle = {
  ...activeStatusStyle,
  border: "1px solid #fecaca",
  background: "#fee2e2",
  color: "#991b1b",
};

const editButtonStyle = {
  minHeight: "34px",
  marginRight: "7px",
  padding: "7px 11px",
  border: "1px solid #bfdbfe",
  borderRadius: "7px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
};

const deleteButtonStyle = {
  minHeight: "34px",
  padding: "7px 11px",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "12px",
  fontWeight: "700",
  cursor: "pointer",
};

const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 2000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  background:
    "rgba(15, 23, 42, 0.62)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "720px",
  maxHeight: "92vh",
  overflowY: "auto" as const,
  padding: "28px",
  boxSizing: "border-box" as const,
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 25px 70px rgba(15, 23, 42, 0.35)",
};

const modalHeaderStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "22px",
};

const modalTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "24px",
};

const modalDescriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  fontSize: "14px",
  lineHeight: 1.5,
};

const closeButtonStyle = {
  width: "38px",
  height: "38px",
  flexShrink: 0,
  padding: 0,
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "24px",
  cursor: "pointer",
};

const formGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "16px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "7px",
};

const formGroupFullStyle = {
  ...formGroupStyle,
  gridColumn: "1 / -1",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "24px",
};

const scanFieldStyle = {
  display: "grid",
  gridTemplateColumns:
    "minmax(0, 1fr) auto",
  gap: "8px",
};

const disabledInputStyle = {
  ...inputStyle,
  background: "#f1f5f9",
  color: "#64748b",
  cursor: "not-allowed",
};

const scanButtonStyle = {
  minHeight: "43px",
  padding: "9px 15px",
  border: "1px solid #93c5fd",
  borderRadius: "8px",
  background: "#eff6ff",
  color: "#1d4ed8",
  fontSize: "13px",
  fontWeight: "700",
  whiteSpace: "nowrap" as const,
  cursor: "pointer",
};

const confirmDeleteButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "9px",
  background: "#b91c1c",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const warningCircleStyle = {
  width: "56px",
  height: "56px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 18px",
  borderRadius: "50%",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: "30px",
  fontWeight: "800",
};

const warningTextStyle = {
  margin: "0 0 22px",
  padding: "12px",
  borderRadius: "9px",
  background: "#fff7ed",
  color: "#9a3412",
  fontSize: "13px",
  lineHeight: 1.5,
};

const messageStyle = {
  padding: "40px",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const emptyStyle = {
  padding: "40px",
  border:
    "1px dashed #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const errorStyle = {
  marginTop: "18px",
  marginBottom: "16px",
  padding: "14px 16px",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "14px",
};

const successStyle = {
  marginBottom: "18px",
  padding: "14px 16px",
  border: "1px solid #bbf7d0",
  borderRadius: "10px",
  background: "#f0fdf4",
  color: "#166534",
  fontSize: "14px",
  fontWeight: "700",
};
const headerActionsStyle = {
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap" as const,
};
const importActionsStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap" as const,
};

const importButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "1px solid #1c4e9c",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#1c4e9c",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
  whiteSpace: "nowrap" as const,
};

const selectedFileStyle = {
  marginTop: "18px",
  padding: "12px 14px",
  border: "1px solid #bfdbfe",
  borderRadius: "9px",
  background: "#eff6ff",
  color: "#1e40af",
  fontSize: "13px",
};

const importResultStyle = {
  marginTop: "18px",
  padding: "16px",
  border: "1px solid #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
};

const importResultTitleStyle = {
  margin: "0 0 13px",
  color: "#102957",
  fontSize: "16px",
};

const importSummaryStyle = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "10px 20px",
  color: "#334155",
  fontSize: "13px",
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "14px",
  marginTop: "18px",
};

const paginationButtonStyle = {
  minHeight: "39px",
  padding: "8px 15px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
};

const paginationInfoStyle = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: "700",
}; const importDetailsErrorStyle = {
  marginTop: "14px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fef2f2",
  color: "#991b1b",
};

const importDetailsWarningStyle = {
  marginTop: "14px",
  border: "1px solid #fed7aa",
  borderRadius: "9px",
  background: "#fff7ed",
  color: "#9a3412",
};

const importDetailsSummaryStyle = {
  padding: "12px 14px",
  fontSize: "13px",
  fontWeight: "700",
  cursor: "pointer",
};

const importTableContainerStyle = {
  maxHeight: "260px",
  overflowY: "auto" as const,
  borderTop: "1px solid #e2e8f0",
};

const importTableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
  background: "#ffffff",
};

const importTableHeaderStyle = {
  position: "sticky" as const,
  top: 0,
  padding: "9px 10px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
  color: "#334155",
  fontSize: "12px",
  textAlign: "left" as const,
};

const importTableCellStyle = {
  padding: "8px 10px",
  borderBottom: "1px solid #e2e8f0",
  color: "#475569",
  fontSize: "12px",
  verticalAlign: "top" as const,
};