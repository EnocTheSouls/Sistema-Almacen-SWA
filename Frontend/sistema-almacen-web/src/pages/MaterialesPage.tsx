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
  obtenerFamilias,
} from "../services/familiaService";

import {
  importarBom,
} from "../services/bomImportService";

import type {
  ResultadoImportacionBom,
} from "../services/bomImportService";

import type {
  Familia,
} from "../types/familia";

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

export function MaterialesPage() {
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

  const [
    familias,
    setFamilias,
  ] = useState<Familia[]>([]);

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
    idFamiliaBom,
    setIdFamiliaBom,
  ] = useState(0);

  const [
    busquedaFamiliaBom,
    setBusquedaFamiliaBom,
  ] = useState(""); 

  const [
    nivelDisenoBom,
    setNivelDisenoBom,
  ] = useState("");

  const [
    versionBom,
    setVersionBom,
  ] = useState("");

  const [
    resultadoImportacion,
    setResultadoImportacion,
  ] = useState<ResultadoImportacionBom | null>(
    null
  );

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

      setErrorCarga(
        obtenerMensajeError(
          error,
          "No se pudo cargar el catálogo de materiales."
        )
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      await cargarMateriales();

      if (!esAdministrador) {
        return;
      }

      try {
        const resultadoFamilias =
          await obtenerFamilias();

        setFamilias(
          resultadoFamilias.filter(
            (familia) =>
              familia.activo
          )
        );
      } catch (error) {
        console.error(
          "Error al cargar familias:",
          error
        );
      }
    };

    cargarDatos();
  }, [esAdministrador]);

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

  const familiasBomFiltradas =
    useMemo(() => {
      const texto =
        busquedaFamiliaBom
          .trim()
          .toLocaleLowerCase(
            "es-MX"
          );

      if (!texto) {
        return familias;
      }

      return familias.filter(
        (familia) =>
          familia.nombreProyecto
            .toLocaleLowerCase(
              "es-MX"
            )
            .includes(texto) ||
          familia.nombre
            .toLocaleLowerCase(
              "es-MX"
            )
            .includes(texto)
      );
    }, [
      familias,
      busquedaFamiliaBom,
    ]);

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
  const abrirImportacionBom = () => {
    setArchivoBom(null);
    setIdFamiliaBom(0);
    setNivelDisenoBom("");
    setVersionBom("");
    setResultadoImportacion(null);
    setErrorFormulario("");
    setMensajeExito("");
    setMostrarImportacionBom(true);
    setBusquedaFamiliaBom("");
  };

  const cerrarImportacionBom = () => {
    setBusquedaFamiliaBom("");
    if (importandoBom) {
      return;
    }

    setMostrarImportacionBom(false);
    setArchivoBom(null);
    setIdFamiliaBom(0);
    setNivelDisenoBom("");
    setVersionBom("");
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

    if (idFamiliaBom <= 0) {
      setErrorFormulario(
        "Selecciona una familia."
      );

      return;
    }

    if (!nivelDisenoBom.trim()) {
      setErrorFormulario(
        "Captura el nivel de diseño."
      );

      return;
    }

    if (!versionBom.trim()) {
      setErrorFormulario(
        "Captura la versión del BOM."
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
          idFamilia: idFamiliaBom,
          nivelDiseno:
            nivelDisenoBom.trim(),
          version:
            versionBom.trim(),
        });

      setResultadoImportacion(
        respuesta.resultado
      );

      setMensajeExito(
        `El archivo "${respuesta.resultado.nombreArchivo}" fue procesado.`
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
                  <button
                    type="button"
                    onClick={abrirImportacionBom}
                    style={importButtonStyle}
                  >
                    Importar BOM
                  </button>

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
              {materialesFiltrados.length}{" "}
              de {materiales.length}
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
                    <th style={thStyle}>
                      ID
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
                          textAlign:
                            "right",
                        }}
                      >
                        Acciones
                      </th>
                    )}
                  </tr>
                </thead>

                <tbody>
                  {materialesFiltrados.map(
                    (material) => (
                      <tr
                        key={
                          material.idMaterial
                        }
                      >
                        <td style={tdStyle}>
                          {
                            material.idMaterial
                          }
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
                              textAlign:
                                "right",
                              whiteSpace:
                                "nowrap",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                abrirEdicionMaterial(
                                  material
                                );
                              }}
                              style={
                                editButtonStyle
                              }
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
                              style={
                                deleteButtonStyle
                              }
                            >
                              Eliminar
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
                      Código de barras
                    </label>

                    <div style={scanFieldStyle}>
                      <input
                        id="codigoBarras"
                        type="text"
                        value={
                          formulario.codigoBarras
                        }
                        disabled
                        placeholder="Se asignará mediante escaneo"
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

                    <small
                      style={helpTextStyle}
                    >
                      Este dato no se captura
                      manualmente.
                    </small>
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
                    Selecciona la familia y carga el archivo Excel.
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
                      htmlFor="buscarFamiliaBom"
                      style={labelStyle}
                    >
                      Buscar proyecto o familia
                    </label>

                    <input
                      id="buscarFamiliaBom"
                      type="text"
                      value={busquedaFamiliaBom}
                      onChange={(event) => {
                        setBusquedaFamiliaBom(
                          event.target.value
                        );

                        setIdFamiliaBom(0);
                      }}
                      disabled={importandoBom}
                      placeholder="Escribe el nombre del proyecto o familia"
                      autoComplete="off"
                      style={inputStyle}
                    />

                    <label
                      htmlFor="familiaBom"
                      style={labelStyle}
                    >
                      Familia *
                    </label>

                    <select
                      id="familiaBom"
                      value={idFamiliaBom}
                      onChange={(event) => {
                        setIdFamiliaBom(
                          Number(event.target.value)
                        );
                      }}
                      disabled={importandoBom}
                      style={inputStyle}
                    >
                      <option value={0}>
                        Seleccionar familia
                      </option>

                      {familiasBomFiltradas.map(
                        (familia) => (
                          <option
                            key={familia.idFamilia}
                            value={familia.idFamilia}
                          >
                            {familia.nombreProyecto}
                            {" - "}
                            {familia.nombre}
                          </option>
                        )
                      )}
                    </select>

                    {busquedaFamiliaBom &&
                      familiasBomFiltradas.length === 0 && (
                        <small style={searchEmptyStyle}>
                          No se encontraron proyectos o familias.
                        </small>
                      )}
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="nivelDisenoBom"
                      style={labelStyle}
                    >
                      Nivel de diseño *
                    </label>

                    <input
                      id="nivelDisenoBom"
                      type="text"
                      value={nivelDisenoBom}
                      onChange={(event) => {
                        setNivelDisenoBom(
                          event.target.value
                        );
                      }}
                      disabled={importandoBom}
                      placeholder="Ejemplo: A"
                      style={inputStyle}
                    />
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="versionBom"
                      style={labelStyle}
                    >
                      Versión BOM *
                    </label>

                    <input
                      id="versionBom"
                      type="text"
                      value={versionBom}
                      onChange={(event) => {
                        setVersionBom(
                          event.target.value
                        );
                      }}
                      disabled={importandoBom}
                      placeholder="Ejemplo: V1"
                      style={inputStyle}
                    />
                  </div>

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
                          {
                            resultadoImportacion
                              .totalFilas
                          }
                        </strong>
                      </span>

                      <span>
                        Correctas:{" "}
                        <strong>
                          {
                            resultadoImportacion
                              .filasCorrectas
                          }
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
                          {
                            resultadoImportacion
                              .filasConError
                          }
                        </strong>
                      </span>
                    </div>

                    {resultadoImportacion.errores
                      .length > 0 && (
                        <div style={importErrorsStyle}>
                          {resultadoImportacion.errores.map(
                            (error) => (
                              <p
                                key={`${error.numeroFila}-${error.mensaje}`}
                                style={importMessageStyle}
                              >
                                Fila {error.numeroFila}:{" "}
                                {error.mensaje}
                              </p>
                            )
                          )}
                        </div>
                      )}

                    {resultadoImportacion.advertencias
                      .length > 0 && (
                        <div style={importWarningsStyle}>
                          {resultadoImportacion.advertencias.map(
                            (advertencia) => (
                              <p
                                key={`${advertencia.numeroFila}-${advertencia.mensaje}`}
                                style={importMessageStyle}
                              >
                                Fila{" "}
                                {advertencia.numeroFila}:{" "}
                                {advertencia.mensaje}
                              </p>
                            )
                          )}
                        </div>
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

                  <button
                    type="submit"
                    disabled={importandoBom}
                    style={{
                      ...primaryButtonStyle,
                      opacity:
                        importandoBom
                          ? 0.65
                          : 1,
                    }}
                  >
                    {importandoBom
                      ? "Importando..."
                      : "Importar BOM"}
                  </button>
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
  fontSize: "12px",
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

const importErrorsStyle = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "8px",
  background: "#fef2f2",
  color: "#991b1b",
};

const importWarningsStyle = {
  marginTop: "14px",
  padding: "12px",
  borderRadius: "8px",
  background: "#fff7ed",
  color: "#9a3412",
};

const importMessageStyle = {
  margin: "4px 0",
  fontSize: "12px",
};const searchEmptyStyle = {
  color: "#b91c1c",
  fontSize: "12px",
  fontWeight: "600",
};