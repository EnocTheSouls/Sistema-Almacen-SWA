
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

import { FamiliaFormModal } from "../components/estructura/FamiliaFormModal";

import "./EstructuraPage.css";


import {
  actualizarProyecto,
  crearProyecto,
  eliminarProyecto,
  obtenerProyectos,
} from "../services/proyectoService";

import {
  actualizarFamilia,
  crearFamilia,
  eliminarFamilia,
  obtenerFamilias,
} from "../services/familiaService";

import {
  actualizarEstacion,
  cambiarEstadoEstacion,
  crearEstacion,
  eliminarEstacion,
  importarEstaciones,
  obtenerEstaciones,
} from "../services/estacionService";

import type {
  ResultadoImportacionEstacion,
} from "../services/estacionService";

import {
  EstacionFormModal,
} from "../components/estructura/EstacionFormModal";

import type {
  Proyecto,
} from "../types/proyecto";


import type {
  Familia,
} from "../types/familia";

import type {
  Estacion,
} from "../types/estacion";

type TabActiva =
  | "proyectos"
  | "familias"
  | "estaciones";

type FiltroEstado =
  | "todos"
  | "activos"
  | "inactivos";

const REGISTROS_POR_PAGINA = 10;

export function EstructuraPage() {
  const [tabActiva, setTabActiva] =
    useState<TabActiva>("proyectos");


  const [
    paginaProyectos,
    setPaginaProyectos,
  ] = useState(1);

  const [
    paginaFamilias,
    setPaginaFamilias,
  ] = useState(1);

  const [
    paginaEstaciones,
    setPaginaEstaciones,
  ] = useState(1);


  // Texto general para buscar en la pestaña activa.
  const [
    textoFiltro,
    setTextoFiltro,
  ] = useState("");

  // Filtra registros activos o inactivos.
  const [
    filtroEstado,
    setFiltroEstado,
  ] = useState<FiltroEstado>(
    "todos"
  );

  // Proyecto seleccionado para Familias y Estaciones.
  const [
    filtroProyecto,
    setFiltroProyecto,
  ] = useState(0);

  // Familia seleccionada para Estaciones.
  const [
    filtroFamilia,
    setFiltroFamilia,
  ] = useState(0);




  const [proyectos, setProyectos] =
    useState<Proyecto[]>([]);

  const [familias, setFamilias] =
    useState<Familia[]>([]);

  // Controla el formulario de familias.
  const [
    mostrarFormularioFamilia,
    setMostrarFormularioFamilia,
  ] = useState(false);



  const [estaciones, setEstaciones] =
    useState<Estacion[]>([]);



  const [
    mostrarImportacionEstaciones,
    setMostrarImportacionEstaciones,
  ] = useState(false);

  const [
    familiaImportacion,
    setFamiliaImportacion,
  ] = useState<Familia | null>(
    null
  );

  const [
    archivoEstaciones,
    setArchivoEstaciones,
  ] = useState<File | null>(
    null
  );

  const [
    importandoEstaciones,
    setImportandoEstaciones,
  ] = useState(false);

  const [
    resultadoImportacionEstaciones,
    setResultadoImportacionEstaciones,
  ] = useState<
    ResultadoImportacionEstacion | null
  >(null);

  // Controla el detalle desplegable de la importación.
  const [
    mostrarDetalleImportacion,
    setMostrarDetalleImportacion,
  ] = useState(false);

  const [
    mostrarFormularioEstacion,
    setMostrarFormularioEstacion,
  ] = useState(false);

  const [
    idProyectoEstacion,
    setIdProyectoEstacion,
  ] = useState(0);

  const [
    idFamiliaEstacion,
    setIdFamiliaEstacion,
  ] = useState(0);

  const [
    nombreEstacion,
    setNombreEstacion,
  ] = useState("");

  const [
    estacionEnEdicion,
    setEstacionEnEdicion,
  ] = useState<Estacion | null>(null);

  const [
    estacionAEliminar,
    setEstacionAEliminar,
  ] = useState<Estacion | null>(null);

  const [
    mostrarConfirmacionEliminarEstacion,
    setMostrarConfirmacionEliminarEstacion,
  ] = useState(false);


  const [
    idProyectoFamilia,
    setIdProyectoFamilia,
  ] = useState(0);

  const [
    nombreFamilia,
    setNombreFamilia,
  ] = useState("");

  const [
    descripcionFamilia,
    setDescripcionFamilia,
  ] = useState("");

  const [
    familiaEnEdicion,
    setFamiliaEnEdicion,
  ] = useState<Familia | null>(null);

  const [
    familiaAEliminar,
    setFamiliaAEliminar,
  ] = useState<Familia | null>(null);

  const [
    mostrarConfirmacionEliminarFamilia,
    setMostrarConfirmacionEliminarFamilia,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [errorCarga, setErrorCarga] =
    useState("");

  const [errorFormulario, setErrorFormulario] =
    useState("");

  const [mensajeExito, setMensajeExito] =
    useState("");

  const [
    mostrarFormularioProyecto,
    setMostrarFormularioProyecto,
  ] = useState(false);

  const [
    nombreProyecto,
    setNombreProyecto,
  ] = useState("");

  const [
    descripcionProyecto,
    setDescripcionProyecto,
  ] = useState("");

  const [
    proyectoEnEdicion,
    setProyectoEnEdicion,
  ] = useState<Proyecto | null>(null);

  const [
    proyectoAEliminar,
    setProyectoAEliminar,
  ] = useState<Proyecto | null>(null);

  const [
    mostrarConfirmacionEliminar,
    setMostrarConfirmacionEliminar,
  ] = useState(false);

  const cargarEstructura = async () => {
    try {
      setCargando(true);
      setErrorCarga("");

      const [
        proyectosData,
        familiasData,
        estacionesData,
      ] = await Promise.all([
        obtenerProyectos(),
        obtenerFamilias(),
        obtenerEstaciones(),
      ]);

      setProyectos(proyectosData);
      setFamilias(familiasData);
      setEstaciones(estacionesData);

    } catch (error) {
      console.error(
        "Error al cargar la estructura:",
        error
      );

      setErrorCarga(
        "No se pudo cargar la información."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEstructura();
  }, []);

  useEffect(() => {
    setPaginaProyectos(1);
    setPaginaFamilias(1);
    setPaginaEstaciones(1);
  }, [
    textoFiltro,
    filtroEstado,
    filtroProyecto,
    filtroFamilia,
  ]);

  // Normaliza texto para búsquedas sin distinguir mayúsculas.
  const normalizarTexto = (
    valor: string | null | undefined
  ) => {
    return (
      valor
        ?.trim()
        .toLocaleLowerCase("es-MX") ??
      ""
    );
  };

  // Comprueba si un registro coincide con el estado elegido.
  const coincideConEstado = (
    activo: boolean
  ) => {
    if (filtroEstado === "activos") {
      return activo;
    }

    if (filtroEstado === "inactivos") {
      return !activo;
    }

    return true;
  };

  // Familias disponibles en el filtro de estaciones.
  const familiasDisponiblesFiltro =
    useMemo(() => {
      if (filtroProyecto <= 0) {
        return familias;
      }

      return familias.filter(
        (familia) =>
          familia.idProyecto ===
          filtroProyecto
      );
    }, [
      familias,
      filtroProyecto,
    ]);

  // Proyectos que coinciden con la búsqueda y el estado.
  const proyectosFiltrados =
    useMemo(() => {
      const texto =
        normalizarTexto(
          textoFiltro
        );

      return proyectos
        .filter(
          (proyecto) => {
            const coincideTexto =
              !texto ||
              normalizarTexto(
                proyecto.nombre
              ).includes(texto) ||
              normalizarTexto(
                proyecto.descripcion
              ).includes(texto);

            return (
              coincideTexto &&
              coincideConEstado(
                proyecto.activo
              )
            );
          }
        )
        .sort(
          (proyectoA, proyectoB) =>
            proyectoA.idProyecto -
            proyectoB.idProyecto
        );
    }, [
      proyectos,
      textoFiltro,
      filtroEstado,
    ]);

  const familiasFiltradas =
    useMemo(() => {
      const texto =
        normalizarTexto(
          textoFiltro
        );

      return familias
        .filter(
          (familia) => {
            const coincideTexto =
              !texto ||
              normalizarTexto(
                familia.nombre
              ).includes(texto) ||
              normalizarTexto(
                familia.nombreProyecto
              ).includes(texto) ||
              normalizarTexto(
                familia.descripcion
              ).includes(texto);

            const coincideProyecto =
              filtroProyecto <= 0 ||
              familia.idProyecto ===
              filtroProyecto;

            return (
              coincideTexto &&
              coincideProyecto &&
              coincideConEstado(
                familia.activo
              )
            );
          }
        )
        .sort(
          (familiaA, familiaB) =>
            familiaA.idFamilia -
            familiaB.idFamilia
        );
    }, [
      familias,
      textoFiltro,
      filtroProyecto,
      filtroEstado,
    ]);

  const estacionesFiltradas =
    useMemo(() => {
      const texto =
        normalizarTexto(
          textoFiltro
        );

      return estaciones
        .filter(
          (estacion) => {
            const coincideTexto =
              !texto ||
              normalizarTexto(
                estacion.nombre
              ).includes(texto) ||
              normalizarTexto(
                estacion.nombreProyecto
              ).includes(texto) ||
              normalizarTexto(
                estacion.nombreFamilia
              ).includes(texto);

            const coincideProyecto =
              filtroProyecto <= 0 ||
              estacion.idProyecto ===
              filtroProyecto;

            const coincideFamilia =
              filtroFamilia <= 0 ||
              estacion.idFamilia ===
              filtroFamilia;

            return (
              coincideTexto &&
              coincideProyecto &&
              coincideFamilia &&
              coincideConEstado(
                estacion.activo
              )
            );
          }
        )
        .sort(
          (estacionA, estacionB) =>
            estacionA.idEstacion -
            estacionB.idEstacion
        );
    }, [
      estaciones,
      textoFiltro,
      filtroProyecto,
      filtroFamilia,
      filtroEstado,
    ]);


  const totalPaginasProyectos =
    Math.max(
      1,
      Math.ceil(
        proyectosFiltrados.length /
        REGISTROS_POR_PAGINA
      )
    );

  const totalPaginasFamilias =
    Math.max(
      1,
      Math.ceil(
        familiasFiltradas.length /
        REGISTROS_POR_PAGINA
      )
    );

  const totalPaginasEstaciones =
    Math.max(
      1,
      Math.ceil(
        estacionesFiltradas.length /
        REGISTROS_POR_PAGINA
      )
    );

  const proyectosPaginados =
    useMemo(() => {
      const inicio =
        (paginaProyectos - 1) *
        REGISTROS_POR_PAGINA;

      return proyectosFiltrados.slice(
        inicio,
        inicio + REGISTROS_POR_PAGINA
      );
    }, [
      proyectosFiltrados,
      paginaProyectos,
    ]);

  const familiasPaginadas =
    useMemo(() => {
      const inicio =
        (paginaFamilias - 1) *
        REGISTROS_POR_PAGINA;

      return familiasFiltradas.slice(
        inicio,
        inicio + REGISTROS_POR_PAGINA
      );
    }, [
      familiasFiltradas,
      paginaFamilias,
    ]);

  const estacionesPaginadas =
    useMemo(() => {
      const inicio =
        (paginaEstaciones - 1) *
        REGISTROS_POR_PAGINA;

      return estacionesFiltradas.slice(
        inicio,
        inicio + REGISTROS_POR_PAGINA
      );
    }, [
      estacionesFiltradas,
      paginaEstaciones,
    ]);



  // Reinicia todos los filtros.
  const limpiarFiltros = () => {
    setTextoFiltro("");
    setFiltroEstado("todos");
    setFiltroProyecto(0);
    setFiltroFamilia(0);
  };

  // Cambia de pestaña y limpia filtros anteriores.
  const cambiarPestana = (
    nuevaPestana: TabActiva
  ) => {
    setTabActiva(
      nuevaPestana
    );

    limpiarFiltros();
  };

  // Al cambiar proyecto, reinicia la familia.
  const cambiarProyectoFiltro = (
    idProyecto: number
  ) => {
    setFiltroProyecto(
      idProyecto
    );

    setFiltroFamilia(0);
  };

  const cantidadTotalActual =
    tabActiva === "proyectos"
      ? proyectos.length
      : tabActiva === "familias"
        ? familias.length
        : estaciones.length;

  const cantidadFiltradaActual =
    tabActiva === "proyectos"
      ? proyectosFiltrados.length
      : tabActiva === "familias"
        ? familiasFiltradas.length
        : estacionesFiltradas.length;

  const tituloResultados =
    tabActiva === "proyectos"
      ? "Proyectos registrados"
      : tabActiva === "familias"
        ? "Familias registradas"
        : "Estaciones registradas";



  const limpiarMensajes = () => {
    setMensajeExito("");
    setErrorFormulario("");
  };

  // Abre el formulario para registrar una familia.
  const abrirNuevaFamilia = () => {
    limpiarMensajes();

    setFamiliaEnEdicion(null);
    setIdProyectoFamilia(0);
    setNombreFamilia("");
    setDescripcionFamilia("");
    setMostrarFormularioFamilia(true);
  };

  // Cierra y limpia el formulario de familia.
  const cerrarFormularioFamilia = () => {
    if (guardando) {
      return;
    }

    setMostrarFormularioFamilia(false);
    setFamiliaEnEdicion(null);
    setIdProyectoFamilia(0);
    setNombreFamilia("");
    setDescripcionFamilia("");
    setErrorFormulario("");
  };
  const guardarFamilia = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nombreLimpio =
      nombreFamilia.trim();

    const descripcionLimpia =
      descripcionFamilia.trim();

    if (idProyectoFamilia <= 0) {
      setErrorFormulario(
        "Debes seleccionar un proyecto."
      );

      return;
    }

    if (!nombreLimpio) {
      setErrorFormulario(
        "El nombre de la familia es obligatorio."
      );

      return;
    }

    if (nombreLimpio.length > 100) {
      setErrorFormulario(
        "El nombre no puede exceder 100 caracteres."
      );

      return;
    }

    if (descripcionLimpia.length > 255) {
      setErrorFormulario(
        "La descripción no puede exceder 255 caracteres."
      );

      return;
    }

    try {
      setGuardando(true);
      limpiarMensajes();

      if (familiaEnEdicion) {
        const familiaActualizada =
          await actualizarFamilia(
            familiaEnEdicion.idFamilia,
            {
              idProyecto:
                idProyectoFamilia,

              nombre:
                nombreLimpio,

              descripcion:
                descripcionLimpia || null,

              activo:
                familiaEnEdicion.activo,
            }
          );

        setFamilias(
          (familiasActuales) =>
            familiasActuales.map(
              (familia) =>
                familia.idFamilia ===
                  familiaActualizada.idFamilia
                  ? familiaActualizada
                  : familia
            )
        );

        setMensajeExito(
          `La familia "${familiaActualizada.nombre}" se actualizó correctamente.`
        );
      } else {
        const familiaCreada =
          await crearFamilia({
            idProyecto:
              idProyectoFamilia,

            nombre:
              nombreLimpio,

            descripcion:
              descripcionLimpia || null,
          });

        setFamilias(
          (familiasActuales) => [
            ...familiasActuales,
            familiaCreada,
          ]
        );

        setMensajeExito(
          `La familia "${familiaCreada.nombre}" se registró correctamente.`
        );
      }

      setMostrarFormularioFamilia(false);
      setFamiliaEnEdicion(null);
      setIdProyectoFamilia(0);
      setNombreFamilia("");
      setDescripcionFamilia("");
    } catch (error) {
      mostrarErrorBackend(
        error,
        familiaEnEdicion
          ? "No se pudo actualizar la familia."
          : "No se pudo registrar la familia."
      );
    } finally {
      setGuardando(false);
    }
  };
  // Abre el formulario con la información de la familia.
  const abrirEdicionFamilia = (
    familia: Familia
  ) => {
    limpiarMensajes();

    setFamiliaEnEdicion(familia);
    setIdProyectoFamilia(
      familia.idProyecto
    );
    setNombreFamilia(
      familia.nombre
    );
    setDescripcionFamilia(
      familia.descripcion ?? ""
    );
    setMostrarFormularioFamilia(true);
  };

  // Cambia una familia entre Activa e Inactiva.
  const cambiarEstadoFamilia = async (
    familia: Familia
  ) => {
    try {
      setGuardando(true);
      limpiarMensajes();

      const familiaActualizada =
        await actualizarFamilia(
          familia.idFamilia,
          {
            idProyecto:
              familia.idProyecto,

            nombre:
              familia.nombre,

            descripcion:
              familia.descripcion ?? null,

            activo:
              !familia.activo,
          }
        );

      setFamilias(
        (familiasActuales) =>
          familiasActuales.map(
            (familiaActual) =>
              familiaActual.idFamilia ===
                familiaActualizada.idFamilia
                ? familiaActualizada
                : familiaActual
          )
      );

      setMensajeExito(
        familiaActualizada.activo
          ? `La familia "${familiaActualizada.nombre}" fue activada.`
          : `La familia "${familiaActualizada.nombre}" fue marcada como inactiva.`
      );
    } catch (error) {
      mostrarErrorBackend(
        error,
        "No se pudo cambiar el estado de la familia."
      );
    } finally {
      setGuardando(false);
    }
  };

  // Abre la confirmación antes de eliminar.
  const solicitarEliminacionFamilia = (
    familia: Familia
  ) => {
    limpiarMensajes();

    setFamiliaAEliminar(familia);

    setMostrarConfirmacionEliminarFamilia(
      true
    );
  };

  // Cierra la confirmación de eliminación.
  const cancelarEliminacionFamilia = () => {
    if (guardando) {
      return;
    }

    setFamiliaAEliminar(null);

    setMostrarConfirmacionEliminarFamilia(
      false
    );

    setErrorFormulario("");
  };

  // Elimina una familia sin relaciones.
  const confirmarEliminacionFamilia =
    async () => {
      if (!familiaAEliminar) {
        return;
      }

      try {
        setGuardando(true);
        setErrorFormulario("");

        await eliminarFamilia(
          familiaAEliminar.idFamilia
        );

        setFamilias(
          (familiasActuales) =>
            familiasActuales.filter(
              (familia) =>
                familia.idFamilia !==
                familiaAEliminar.idFamilia
            )
        );

        setMensajeExito(
          `La familia "${familiaAEliminar.nombre}" fue eliminada.`
        );

        setFamiliaAEliminar(null);

        setMostrarConfirmacionEliminarFamilia(
          false
        );
      } catch (error) {
        mostrarErrorBackend(
          error,
          "No se puede eliminar la familia porque tiene estaciones, arneses o solicitudes asociadas. Puedes marcarla como inactiva."
        );
      } finally {
        setGuardando(false);
      }
    };

  const abrirImportacionEstaciones = (
    familia: Familia
  ) => {
    limpiarMensajes();

    setFamiliaImportacion(
      familia
    );

    setArchivoEstaciones(null);

    setResultadoImportacionEstaciones(
      null
    );

    setMostrarImportacionEstaciones(
      true
    );
    setMostrarDetalleImportacion(false);
  };

  const cerrarImportacionEstaciones = () => {
    if (importandoEstaciones) {
      return;
    }

    setMostrarImportacionEstaciones(
      false
    );

    setFamiliaImportacion(null);
    setArchivoEstaciones(null);

    setResultadoImportacionEstaciones(
      null
    );

    setErrorFormulario("");

    setMostrarDetalleImportacion(false);
  };

  const ejecutarImportacionEstaciones =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {
      event.preventDefault();

      if (!familiaImportacion) {
        setErrorFormulario(
          "No se seleccionó una familia."
        );

        return;
      }

      if (!archivoEstaciones) {
        setErrorFormulario(
          "Selecciona el archivo de estaciones."
        );

        return;
      }

      try {
        setImportandoEstaciones(true);
        setErrorFormulario("");

        setResultadoImportacionEstaciones(
          null
        );

        const respuesta =
          await importarEstaciones(
            familiaImportacion.idFamilia,
            archivoEstaciones
          );

        setResultadoImportacionEstaciones(
          respuesta.resultado
        );

        setMensajeExito(
          respuesta.mensaje
        );

        const estacionesActualizadas =
          await obtenerEstaciones();

        setEstaciones(
          estacionesActualizadas
        );
      } catch (error) {
        mostrarErrorBackend(
          error,
          "No se pudo importar el archivo de estaciones."
        );
      } finally {
        setImportandoEstaciones(false);
      }
    };


  const abrirNuevaEstacion = () => {
    limpiarMensajes();

    setEstacionEnEdicion(null);
    setIdProyectoEstacion(0);
    setIdFamiliaEstacion(0);
    setNombreEstacion("");
    setMostrarFormularioEstacion(true);
  };

  const cerrarFormularioEstacion = () => {
    if (guardando) {
      return;
    }

    setMostrarFormularioEstacion(false);
    setEstacionEnEdicion(null);
    setIdProyectoEstacion(0);
    setIdFamiliaEstacion(0);
    setNombreEstacion("");
    setErrorFormulario("");
  };

  const guardarEstacion = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nombreLimpio =
      nombreEstacion.trim();

    if (idProyectoEstacion <= 0) {
      setErrorFormulario(
        "Debes seleccionar un proyecto."
      );

      return;
    }

    if (idFamiliaEstacion <= 0) {
      setErrorFormulario(
        "Debes seleccionar una familia."
      );

      return;
    }

    if (!nombreLimpio) {
      setErrorFormulario(
        "El nombre de la estación es obligatorio."
      );

      return;
    }

    if (nombreLimpio.length > 100) {
      setErrorFormulario(
        "El nombre no puede exceder 100 caracteres."
      );

      return;
    }

    try {
      setGuardando(true);
      limpiarMensajes();

      if (estacionEnEdicion) {
        const estacionActualizada =
          await actualizarEstacion(
            estacionEnEdicion.idEstacion,
            {
              idFamilia:
                idFamiliaEstacion,
              nombre:
                nombreLimpio,
              activo:
                estacionEnEdicion.activo,
            }
          );

        setEstaciones(
          (estacionesActuales) =>
            estacionesActuales.map(
              (estacion) =>
                estacion.idEstacion ===
                  estacionActualizada.idEstacion
                  ? estacionActualizada
                  : estacion
            )
        );

        setMensajeExito(
          `La estación "${estacionActualizada.nombre}" se actualizó correctamente.`
        );
      } else {
        const estacionCreada =
          await crearEstacion({
            idFamilia:
              idFamiliaEstacion,
            nombre:
              nombreLimpio,
          });

        setEstaciones(
          (estacionesActuales) => [
            ...estacionesActuales,
            estacionCreada,
          ]
        );

        setMensajeExito(
          `La estación "${estacionCreada.nombre}" se registró correctamente.`
        );
      }

      setMostrarFormularioEstacion(false);
      setEstacionEnEdicion(null);
      setIdProyectoEstacion(0);
      setIdFamiliaEstacion(0);
      setNombreEstacion("");
    } catch (error) {
      mostrarErrorBackend(
        error,
        estacionEnEdicion
          ? "No se pudo actualizar la estación."
          : "No se pudo registrar la estación."
      );
    } finally {
      setGuardando(false);
    }
  };

  const abrirEdicionEstacion = (
    estacion: Estacion
  ) => {
    limpiarMensajes();

    setEstacionEnEdicion(estacion);
    setIdProyectoEstacion(
      estacion.idProyecto
    );
    setIdFamiliaEstacion(
      estacion.idFamilia
    );
    setNombreEstacion(
      estacion.nombre
    );
    setMostrarFormularioEstacion(true);
  };

  const cambiarEstadoDeEstacion = async (
    estacion: Estacion
  ) => {
    try {
      setGuardando(true);
      limpiarMensajes();

      const nuevoEstado =
        !estacion.activo;

      await cambiarEstadoEstacion(
        estacion.idEstacion,
        nuevoEstado
      );

      setEstaciones(
        (estacionesActuales) =>
          estacionesActuales.map(
            (estacionActual) =>
              estacionActual.idEstacion ===
                estacion.idEstacion
                ? {
                  ...estacionActual,
                  activo: nuevoEstado,
                }
                : estacionActual
          )
      );

      setMensajeExito(
        nuevoEstado
          ? `La estación "${estacion.nombre}" fue activada.`
          : `La estación "${estacion.nombre}" fue marcada como inactiva.`
      );
    } catch (error) {
      mostrarErrorBackend(
        error,
        "No se pudo cambiar el estado de la estación."
      );
    } finally {
      setGuardando(false);
    }
  };

  const solicitarEliminacionEstacion = (
    estacion: Estacion
  ) => {
    limpiarMensajes();

    setEstacionAEliminar(estacion);

    setMostrarConfirmacionEliminarEstacion(
      true
    );
  };

  const cancelarEliminacionEstacion = () => {
    if (guardando) {
      return;
    }

    setEstacionAEliminar(null);

    setMostrarConfirmacionEliminarEstacion(
      false
    );

    setErrorFormulario("");
  };

  const confirmarEliminacionEstacion =
    async () => {
      if (!estacionAEliminar) {
        return;
      }

      try {
        setGuardando(true);
        setErrorFormulario("");

        await eliminarEstacion(
          estacionAEliminar.idEstacion
        );

        setEstaciones(
          (estacionesActuales) =>
            estacionesActuales.filter(
              (estacion) =>
                estacion.idEstacion !==
                estacionAEliminar.idEstacion
            )
        );

        setMensajeExito(
          `La estación "${estacionAEliminar.nombre}" fue eliminada.`
        );

        setEstacionAEliminar(null);

        setMostrarConfirmacionEliminarEstacion(
          false
        );
      } catch (error) {
        mostrarErrorBackend(
          error,
          "No se pudo eliminar la estación del catálogo."
        );
      } finally {
        setGuardando(false);
      }
    };




  const abrirNuevoProyecto = () => {
    limpiarMensajes();

    setProyectoEnEdicion(null);
    setNombreProyecto("");
    setDescripcionProyecto("");
    setMostrarFormularioProyecto(true);
  };

  const abrirEdicionProyecto = (
    proyecto: Proyecto
  ) => {
    limpiarMensajes();

    setProyectoEnEdicion(proyecto);
    setNombreProyecto(proyecto.nombre);

    setDescripcionProyecto(
      proyecto.descripcion ?? ""
    );

    setMostrarFormularioProyecto(true);
  };

  const cerrarFormularioProyecto = () => {
    if (guardando) {
      return;
    }

    setMostrarFormularioProyecto(false);
    setProyectoEnEdicion(null);
    setNombreProyecto("");
    setDescripcionProyecto("");
    setErrorFormulario("");
  };

  const guardarProyecto = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nombreLimpio =
      nombreProyecto.trim();

    const descripcionLimpia =
      descripcionProyecto.trim();

    if (!nombreLimpio) {
      setErrorFormulario(
        "El nombre del proyecto es obligatorio."
      );

      return;
    }

    if (nombreLimpio.length > 50) {
      setErrorFormulario(
        "El nombre no puede exceder 50 caracteres."
      );

      return;
    }

    if (descripcionLimpia.length > 255) {
      setErrorFormulario(
        "La descripción no puede exceder 255 caracteres."
      );

      return;
    }

    try {
      setGuardando(true);
      limpiarMensajes();

      if (proyectoEnEdicion) {
        const proyectoActualizado =
          await actualizarProyecto(
            proyectoEnEdicion.idProyecto,
            {
              nombre: nombreLimpio,
              descripcion:
                descripcionLimpia || null,
              activo:
                proyectoEnEdicion.activo,
            }
          );

        setProyectos(
          (proyectosActuales) =>
            proyectosActuales.map(
              (proyecto) =>
                proyecto.idProyecto ===
                  proyectoActualizado.idProyecto
                  ? proyectoActualizado
                  : proyecto
            )
        );

        setMensajeExito(
          `El proyecto "${proyectoActualizado.nombre}" se actualizó correctamente.`
        );
      } else {
        const proyectoCreado =
          await crearProyecto({
            nombre: nombreLimpio,
            descripcion:
              descripcionLimpia || null,
          });

        setProyectos(
          (proyectosActuales) => [
            ...proyectosActuales,
            proyectoCreado,
          ]
        );

        setMensajeExito(
          `El proyecto "${proyectoCreado.nombre}" se registró correctamente.`
        );
      }

      setMostrarFormularioProyecto(false);
      setProyectoEnEdicion(null);
      setNombreProyecto("");
      setDescripcionProyecto("");
    } catch (error) {
      mostrarErrorBackend(
        error,
        "No se pudo guardar el proyecto."
      );
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoProyecto = async (
    proyecto: Proyecto
  ) => {
    try {
      setGuardando(true);
      limpiarMensajes();

      const proyectoActualizado =
        await actualizarProyecto(
          proyecto.idProyecto,
          {
            nombre: proyecto.nombre,
            descripcion:
              proyecto.descripcion ?? null,
            activo: !proyecto.activo,
          }
        );

      setProyectos(
        (proyectosActuales) =>
          proyectosActuales.map(
            (proyectoActual) =>
              proyectoActual.idProyecto ===
                proyectoActualizado.idProyecto
                ? proyectoActualizado
                : proyectoActual
          )
      );

      setMensajeExito(
        proyectoActualizado.activo
          ? `El proyecto "${proyectoActualizado.nombre}" fue activado.`
          : `El proyecto "${proyectoActualizado.nombre}" fue marcado como inactivo.`
      );
    } catch (error) {
      mostrarErrorBackend(
        error,
        "No se pudo cambiar el estado del proyecto."
      );
    } finally {
      setGuardando(false);
    }
  };

  const solicitarEliminacion = (
    proyecto: Proyecto
  ) => {
    limpiarMensajes();

    setProyectoAEliminar(proyecto);
    setMostrarConfirmacionEliminar(true);
  };

  const cancelarEliminacion = () => {
    if (guardando) {
      return;
    }

    setProyectoAEliminar(null);
    setMostrarConfirmacionEliminar(false);
    setErrorFormulario("");
  };

  const confirmarEliminacion = async () => {
    if (!proyectoAEliminar) {
      return;
    }

    try {
      setGuardando(true);
      setErrorFormulario("");

      await eliminarProyecto(
        proyectoAEliminar.idProyecto
      );

      setProyectos(
        (proyectosActuales) =>
          proyectosActuales.filter(
            (proyecto) =>
              proyecto.idProyecto !==
              proyectoAEliminar.idProyecto
          )
      );

      setMensajeExito(
        `El proyecto "${proyectoAEliminar.nombre}" fue eliminado.`
      );

      setProyectoAEliminar(null);
      setMostrarConfirmacionEliminar(false);
    } catch (error) {
      mostrarErrorBackend(
        error,
        "No se puede eliminar el proyecto con familias o estaciones asociadas."
      );
    } finally {
      setGuardando(false);
    }
  };

  const mostrarErrorBackend = (
    error: unknown,
    mensajePredeterminado: string
  ) => {
    console.error(error);

    if (axios.isAxiosError(error)) {
      const mensajeBackend =
        error.response?.data?.mensaje;

      if (
        typeof mensajeBackend === "string"
      ) {
        setErrorFormulario(
          mensajeBackend
        );

        return;
      }
    }

    setErrorFormulario(
      mensajePredeterminado
    );
  };

  const manejarNuevoRegistro = () => {
    if (tabActiva === "proyectos") {
      abrirNuevoProyecto();
      return;
    }

    if (tabActiva === "familias") {
      abrirNuevaFamilia();
      return;
    }

    abrirNuevaEstacion();
  };

  return (
    <Layout>
      <div style={pageContainerStyle}>
        <section style={sectionContainerStyle}>
          <div style={headerStyle}>
            <div>
              <h1 style={titleStyle}>
                Proyectos
              </h1>

              <p style={descriptionStyle}>
                Administración de proyectos,
                familias y estaciones.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {tabActiva === "estaciones" && (
                <button
                  type="button"
                  title={
                    filtroFamilia <= 0
                      ? "Para importar estaciones, primero selecciona un proyecto y una familia."
                      : "Importar las estaciones del archivo Excel en la familia seleccionada."
                  }
                  disabled={filtroFamilia <= 0}
                  onClick={() => {
                    const familiaSeleccionada =
                      familias.find(
                        (familia) =>
                          familia.idFamilia ===
                          filtroFamilia
                      );

                    if (familiaSeleccionada) {
                      abrirImportacionEstaciones(
                        familiaSeleccionada
                      );
                    }
                  }}
                  style={{
                    ...secondaryButtonStyle,
                    opacity:
                      filtroFamilia <= 0 ? 0.6 : 1,
                    cursor:
                      filtroFamilia <= 0
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Importar estaciones
                </button>
              )}

              <button
                type="button"
                onClick={manejarNuevoRegistro}
                style={primaryButtonStyle}
              >
                {tabActiva === "proyectos" &&
                  "+ Nuevo proyecto"}

                {tabActiva === "familias" &&
                  "+ Nueva familia"}

                {tabActiva === "estaciones" &&
                  "+ Nueva estación"}
              </button>
            </div>


          </div>

          {mensajeExito && (
            <div style={successStyle}>
              {mensajeExito}
            </div>
          )}
          {errorFormulario &&
            !mostrarFormularioProyecto &&
            !mostrarFormularioFamilia &&
            !mostrarFormularioEstacion &&
            !mostrarImportacionEstaciones &&
            !mostrarConfirmacionEliminar &&
            !mostrarConfirmacionEliminarFamilia &&
            !mostrarConfirmacionEliminarEstacion && (
              <div style={errorStyle}>
                {errorFormulario}
              </div>
            )}



          <div style={tabsContainerStyle}>
            <button
              type="button"
              onClick={() =>
                cambiarPestana("proyectos")
              }
              style={
                tabActiva === "proyectos"
                  ? activeTabStyle
                  : tabStyle
              }
            >
              Proyectos
            </button>

            <button
              type="button"
              onClick={() =>
                cambiarPestana("familias")
              }
              style={
                tabActiva === "familias"
                  ? activeTabStyle
                  : tabStyle
              }
            >
              Familias
            </button>

            <button
              type="button"
              onClick={() =>
                cambiarPestana("estaciones")
              }
              style={
                tabActiva === "estaciones"
                  ? activeTabStyle
                  : tabStyle
              }
            >
              Estaciones
            </button>
          </div>

          {cargando && (
            <div style={messageStyle}>
              Cargando información...
            </div>
          )}

          <div className="estructura-filters">
            <div className="estructura-filter-group">
              <label
                htmlFor="buscarEstructura"
                className="estructura-filter-label"
              >
                Buscar
              </label>

              <input
                id="buscarEstructura"
                type="text"
                value={textoFiltro}
                onChange={(event) =>
                  setTextoFiltro(
                    event.target.value
                  )
                }
                placeholder={
                  tabActiva === "proyectos"
                    ? "Nombre o descripción del proyecto"
                    : tabActiva === "familias"
                      ? "Familia, proyecto o descripción"
                      : "Estación, familia o proyecto"
                }
                className="estructura-filter-input"
              />
            </div>

            {(tabActiva === "familias" ||
              tabActiva === "estaciones") && (
                <div className="estructura-filter-group">
                  <label
                    htmlFor="filtroProyecto"
                    className="estructura-filter-label"
                  >
                    Proyecto
                  </label>

                  <select
                    id="filtroProyecto"
                    value={
                      filtroProyecto > 0
                        ? filtroProyecto
                        : ""
                    }
                    onChange={(event) =>
                      cambiarProyectoFiltro(
                        Number(
                          event.target.value
                        )
                      )
                    }
                    className="estructura-filter-select"
                  >
                    <option value="">
                      Todos los proyectos
                    </option>

                    {proyectos.map((proyecto) => (
                      <option
                        key={
                          proyecto.idProyecto
                        }
                        value={
                          proyecto.idProyecto
                        }
                      >
                        {proyecto.nombre}
                      </option>
                    )
                    )}
                  </select>
                </div>
              )}

            {tabActiva === "estaciones" && (
              <div className="estructura-filter-group">
                <label
                  htmlFor="filtroFamilia"
                  className="estructura-filter-label"
                >
                  Familia
                </label>

                <select
                  id="filtroFamilia"
                  value={
                    filtroFamilia > 0
                      ? filtroFamilia
                      : ""
                  }
                  onChange={(event) =>
                    setFiltroFamilia(
                      Number(
                        event.target.value
                      )
                    )
                  }
                  className="estructura-filter-select"
                >
                  <option value="">
                    Todas las familias
                  </option>

                  {familiasDisponiblesFiltro.map(
                    (familia) => (
                      <option
                        key={
                          familia.idFamilia
                        }
                        value={
                          familia.idFamilia
                        }
                      >
                        {familia.nombre}
                      </option>
                    )
                  )}
                </select>
              </div>
            )}

            <div className="estructura-filter-group">
              <label
                htmlFor="filtroEstado"
                className="estructura-filter-label"
              >
                Estado
              </label>

              <select
                id="filtroEstado"
                value={filtroEstado}
                onChange={(event) =>
                  setFiltroEstado(
                    event.target.value as
                    FiltroEstado
                  )
                }
                className="estructura-filter-select"
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
              className="estructura-clear-filters"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="estructura-results-header">
            <h2 className="estructura-results-title">
              {tituloResultados}
            </h2>

            <span className="estructura-results-counter">
              Mostrando{" "}
              {cantidadFiltradaActual} de{" "}
              {cantidadTotalActual}
            </span>
          </div>

          {!cargando && errorCarga && (
            <div style={errorStyle}>
              {errorCarga}
            </div>
          )}

          {!cargando &&
            !errorCarga &&
            tabActiva === "proyectos" && (
              <ProyectosTable
                proyectos={
                  proyectosPaginados
                }
                guardando={guardando}
                onEditar={
                  abrirEdicionProyecto
                }
                onEliminar={
                  solicitarEliminacion
                }
                onCambiarEstado={
                  cambiarEstadoProyecto
                }

                numeroInicial={
                  (paginaProyectos - 1) *
                  REGISTROS_POR_PAGINA +
                  1
                }
              />
            )}

          {!cargando &&
            !errorCarga &&
            tabActiva === "familias" && (

              <FamiliasTable
                familias={
                  familiasPaginadas
                }
                guardando={guardando}
                onEditar={
                  abrirEdicionFamilia
                }
                onEliminar={
                  solicitarEliminacionFamilia
                }
                onCambiarEstado={
                  cambiarEstadoFamilia
                }
                onImportarEstaciones={
                  abrirImportacionEstaciones
                }
                numeroInicial={
                  (paginaFamilias - 1) *
                  REGISTROS_POR_PAGINA +
                  1
                }
              />

            )}
          {!cargando &&
            !errorCarga &&
            tabActiva === "estaciones" && (
              <EstacionesTable
                estaciones={
                  estacionesPaginadas
                }
                guardando={guardando}
                onEditar={
                  abrirEdicionEstacion
                }
                onEliminar={
                  solicitarEliminacionEstacion
                }
                onCambiarEstado={
                  cambiarEstadoDeEstacion
                }
                numeroInicial={
                  (paginaEstaciones - 1) *
                  REGISTROS_POR_PAGINA +
                  1
                }
              />

            )}
          {tabActiva === "proyectos" &&
            totalPaginasProyectos > 1 && (
              <Paginacion
                paginaActual={
                  paginaProyectos
                }
                totalPaginas={
                  totalPaginasProyectos
                }
                onCambiar={
                  setPaginaProyectos
                }
              />
            )}

          {tabActiva === "familias" &&
            totalPaginasFamilias > 1 && (
              <Paginacion
                paginaActual={
                  paginaFamilias
                }
                totalPaginas={
                  totalPaginasFamilias
                }
                onCambiar={
                  setPaginaFamilias
                }
              />
            )}

          {tabActiva === "estaciones" &&
            totalPaginasEstaciones > 1 && (
              <Paginacion
                paginaActual={
                  paginaEstaciones
                }
                totalPaginas={
                  totalPaginasEstaciones
                }
                onCambiar={
                  setPaginaEstaciones
                }
              />
            )}

        </section>
      </div >

      {mostrarFormularioProyecto && (
        <div style={modalOverlayStyle}>
          <section style={modalStyle}>
            <h2 style={modalTitleStyle}>
              {proyectoEnEdicion
                ? "Editar proyecto"
                : "Nuevo proyecto"}
            </h2>

            <p style={modalDescriptionStyle}>
              {proyectoEnEdicion
                ? "Corrige el nombre o la descripción del proyecto."
                : "Registra un proyecto nuevo para asociarle familias y materiales."}
            </p>

            <form onSubmit={guardarProyecto}>
              <div style={formGroupStyle}>
                <label
                  htmlFor="nombreProyecto"
                  style={labelStyle}
                >
                  Nombre del proyecto *
                </label>

                <input
                  id="nombreProyecto"
                  type="text"
                  value={nombreProyecto}
                  onChange={(event) =>
                    setNombreProyecto(
                      event.target.value
                    )
                  }
                  maxLength={50}
                  placeholder="Ejemplo: JMC"
                  autoFocus
                  disabled={guardando}
                  style={inputStyle}
                />

                <small style={helpTextStyle}>
                  Máximo 50 caracteres.
                </small>
              </div>

              <div style={formGroupStyle}>
                <label
                  htmlFor="descripcionProyecto"
                  style={labelStyle}
                >
                  Descripción
                </label>

                <textarea
                  id="descripcionProyecto"
                  value={descripcionProyecto}
                  onChange={(event) =>
                    setDescripcionProyecto(
                      event.target.value
                    )
                  }
                  maxLength={255}
                  rows={4}
                  placeholder="Descripción opcional"
                  disabled={guardando}
                  style={textareaStyle}
                />

                <small style={helpTextStyle}>
                  {descripcionProyecto.length}/255
                  caracteres
                </small>
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
                    cerrarFormularioProyecto
                  }
                  disabled={guardando}
                  style={secondaryButtonStyle}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  style={{
                    ...primaryButtonStyle,
                    opacity:
                      guardando ? 0.7 : 1,
                  }}
                >
                  {guardando
                    ? "Guardando..."
                    : proyectoEnEdicion
                      ? "Guardar cambios"
                      : "Guardar proyecto"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )
      }
      {
        mostrarFormularioFamilia && (
          <FamiliaFormModal
            proyectos={proyectos}
            idProyecto={idProyectoFamilia}
            nombre={nombreFamilia}
            descripcion={descripcionFamilia}
            guardando={guardando}
            error={errorFormulario}
            esEdicion={
              familiaEnEdicion !== null
            }
            onCambiarProyecto={
              setIdProyectoFamilia
            }
            onCambiarNombre={
              setNombreFamilia
            }
            onCambiarDescripcion={
              setDescripcionFamilia
            }
            onGuardar={guardarFamilia}
            onCancelar={
              cerrarFormularioFamilia
            }
          />
        )
      }

      {
        mostrarImportacionEstaciones &&
        familiaImportacion && (
          <div style={modalOverlayStyle}>
            <section style={modalStyle}>
              <h2 style={modalTitleStyle}>
                Importar estaciones
              </h2>

              <p style={modalDescriptionStyle}>
                Familia:{" "}
                <strong>
                  {familiaImportacion.nombre}
                </strong>

                <br />

                Proyecto:{" "}
                <strong>
                  {
                    familiaImportacion
                      .nombreProyecto
                  }
                </strong>
              </p>

              <form
                onSubmit={
                  ejecutarImportacionEstaciones
                }
              >
                <div style={formGroupStyle}>
                  <label
                    htmlFor="archivoEstaciones"
                    style={labelStyle}
                  >
                    Archivo Excel *
                  </label>

                  <input
                    id="archivoEstaciones"
                    type="file"
                    accept=".xlsx"
                    disabled={
                      importandoEstaciones
                    }
                    onChange={(event) => {
                      const archivo =
                        event.target.files?.[0] ??
                        null;

                      setArchivoEstaciones(
                        archivo
                      );

                      setResultadoImportacionEstaciones(
                        null
                      );

                      setErrorFormulario("");
                    }}
                    style={inputStyle}
                  />

                  <small style={helpTextStyle}>
                    Debe incluir Product Number,
                    diseño, Material Number,
                    Estacion y opcionalmente
                    Std pack.
                  </small>
                </div>

                {archivoEstaciones && (
                  <div style={selectedFileStyle}>
                    Archivo seleccionado:{" "}
                    <strong>
                      {archivoEstaciones.name}
                    </strong>
                  </div>
                )}

                {errorFormulario && (
                  <div style={errorStyle}>
                    {errorFormulario}
                  </div>
                )}

                {resultadoImportacionEstaciones && (
                  <div style={importResultStyle}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                      }}
                    >
                      <strong>
                        Resultado de la importación
                      </strong>

                      <button
                        type="button"
                        title="Ver detalle de la importación"
                        aria-label="Ver detalle de la importación"
                        aria-expanded={mostrarDetalleImportacion}
                        onClick={() =>
                          setMostrarDetalleImportacion(
                            (valorActual) => !valorActual
                          )
                        }
                        style={{
                          width: "34px",
                          height: "34px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          border: "1px solid #bbf7d0",
                          borderRadius: "8px",
                          background: "#ffffff",
                          color: "#166534",
                          fontSize: "20px",
                          fontWeight: "700",
                          lineHeight: 1,
                          cursor: "pointer",
                        }}
                      >
                        ⋮
                      </button>
                    </div>
                    <div style={importSummaryStyle}>
                      <span>
                        Total:{" "}
                        {
                          resultadoImportacionEstaciones
                            .totalFilas
                        }
                      </span>

                      <span>
                        Correctas:{" "}
                        {
                          resultadoImportacionEstaciones
                            .filasCorrectas
                        }
                      </span>

                      <span>
                        Estaciones creadas:{" "}
                        {
                          resultadoImportacionEstaciones
                            .estacionesCreadas
                        }
                      </span>

                      <span>
                        Estaciones existentes:{" "}
                        {
                          resultadoImportacionEstaciones
                            .estacionesExistentes
                        }
                      </span>

                      <span>
                        Asignaciones:{" "}
                        {
                          resultadoImportacionEstaciones
                            .asignacionesRealizadas
                        }
                      </span>

                      <span>
                        Advertencias:{" "}
                        {
                          resultadoImportacionEstaciones
                            .filasConAdvertencia
                        }
                      </span>

                      <span>
                        Errores:{" "}
                        {
                          resultadoImportacionEstaciones
                            .filasConError
                        }
                      </span>
                    </div>
                    {mostrarDetalleImportacion && (
                      <div
                        style={{
                          marginTop: "14px",
                          paddingTop: "14px",
                          borderTop: "1px solid #bbf7d0",
                          display: "grid",
                          gap: "14px",
                          fontSize: "13px",
                        }}
                      >
                        <div>
                          <strong>
                            Estaciones creadas
                          </strong>

                          {resultadoImportacionEstaciones
                            .estacionesCreadasDetalle
                            .length > 0 ? (
                            <ul
                              style={{
                                margin: "8px 0 0",
                                paddingLeft: "20px",
                              }}
                            >
                              {resultadoImportacionEstaciones
                                .estacionesCreadasDetalle
                                .map((nombreEstacion) => (
                                  <li key={nombreEstacion}>
                                    {nombreEstacion}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p
                              style={{
                                margin: "6px 0 0",
                              }}
                            >
                              No se crearon estaciones nuevas.
                            </p>
                          )}
                        </div>

                        <div>
                          <strong>
                            Estaciones existentes
                          </strong>

                          {resultadoImportacionEstaciones
                            .estacionesExistentesDetalle
                            .length > 0 ? (
                            <ul
                              style={{
                                margin: "8px 0 0",
                                paddingLeft: "20px",
                              }}
                            >
                              {resultadoImportacionEstaciones
                                .estacionesExistentesDetalle
                                .map((nombreEstacion) => (
                                  <li key={nombreEstacion}>
                                    {nombreEstacion}
                                  </li>
                                ))}
                            </ul>
                          ) : (
                            <p
                              style={{
                                margin: "6px 0 0",
                              }}
                            >
                              No se encontraron estaciones existentes.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div style={modalActionsStyle}>
                  <button
                    type="button"
                    onClick={
                      cerrarImportacionEstaciones
                    }
                    disabled={
                      importandoEstaciones
                    }
                    style={secondaryButtonStyle}
                  >
                    Cerrar
                  </button>

                  {!resultadoImportacionEstaciones && (
                    <button
                      type="submit"
                      disabled={
                        importandoEstaciones ||
                        !archivoEstaciones
                      }
                      style={{
                        ...primaryButtonStyle,
                        opacity:
                          importandoEstaciones ||
                            !archivoEstaciones
                            ? 0.65
                            : 1,
                      }}
                    >
                      {importandoEstaciones
                        ? "Importando..."
                        : "Importar estaciones"}
                    </button>
                  )}
                </div>
              </form>
            </section>
          </div>
        )
      }

      {
        mostrarFormularioEstacion && (
          <EstacionFormModal
            proyectos={proyectos}
            familias={familias}
            idProyecto={idProyectoEstacion}
            idFamilia={idFamiliaEstacion}
            nombre={nombreEstacion}
            guardando={guardando}
            error={errorFormulario}
            esEdicion={
              estacionEnEdicion !== null
            }
            onCambiarProyecto={
              setIdProyectoEstacion
            }
            onCambiarFamilia={
              setIdFamiliaEstacion
            }
            onCambiarNombre={
              setNombreEstacion
            }
            onGuardar={guardarEstacion}
            onCancelar={
              cerrarFormularioEstacion
            }
          />
        )
      }
      {
        mostrarConfirmacionEliminar &&
        proyectoAEliminar && (
          <div style={modalOverlayStyle}>
            <section
              style={{
                ...modalStyle,
                maxWidth: "460px",
                textAlign: "center",
              }}
            >
              <div style={warningCircleStyle}>
                ×
              </div>

              <h2 style={modalTitleStyle}>
                Eliminar proyecto
              </h2>

              <p style={modalDescriptionStyle}>
                ¿Esta seguro que desae eliminar el Proyecto?{" "}
                <strong>
                  {proyectoAEliminar.nombre}
                </strong>
                .
              </p>

              <p style={warningTextStyle}>
                Solamente podrá eliminarse si
                no tiene familias ni estaciones
                asociadas.
              </p>

              {errorFormulario && (
                <div style={errorStyle}>
                  {errorFormulario}
                </div>
              )}

              <div
                style={{
                  ...modalActionsStyle,
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={
                    cancelarEliminacion
                  }
                  disabled={guardando}
                  style={secondaryButtonStyle}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminacion
                  }
                  disabled={guardando}
                  style={{
                    ...deleteButtonStyle,
                    opacity:
                      guardando ? 0.7 : 1,
                  }}
                >
                  {guardando
                    ? "Eliminando..."
                    : "Eliminar"}
                </button>
              </div>
            </section>
          </div>
        )
      }
      {
        mostrarConfirmacionEliminarFamilia &&
        familiaAEliminar && (
          <div style={modalOverlayStyle}>
            <section
              style={{
                ...modalStyle,
                maxWidth: "460px",
                textAlign: "center",
              }}
            >
              <div style={warningCircleStyle}>
                ×
              </div>

              <h2 style={modalTitleStyle}>
                Eliminar familia
              </h2>

              <p style={modalDescriptionStyle}>
                ¿Estás seguro de eliminar la
                familia{" "}
                <strong>
                  {familiaAEliminar.nombre}
                </strong>
                ?
              </p>

              <p style={warningTextStyle}>
                Solo podrá eliminarse si no
                tiene estaciones, arneses ni
                solicitudes asociadas.
              </p>

              {errorFormulario && (
                <div style={errorStyle}>
                  {errorFormulario}
                </div>
              )}

              <div
                style={{
                  ...modalActionsStyle,
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={
                    cancelarEliminacionFamilia
                  }
                  disabled={guardando}
                  style={secondaryButtonStyle}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminacionFamilia
                  }
                  disabled={guardando}
                  style={{
                    ...deleteButtonStyle,
                    opacity:
                      guardando ? 0.7 : 1,
                  }}
                >
                  {guardando
                    ? "Eliminando..."
                    : "Eliminar"}
                </button>
              </div>
            </section>
          </div>
        )
      }
      {
        mostrarConfirmacionEliminarEstacion &&
        estacionAEliminar && (
          <div style={modalOverlayStyle}>
            <section
              style={{
                ...modalStyle,
                maxWidth: "460px",
                textAlign: "center",
              }}
            >
              <div style={warningCircleStyle}>
                ×
              </div>

              <h2 style={modalTitleStyle}>
                Eliminar estación
              </h2>

              <p style={modalDescriptionStyle}>
                ¿Estás seguro de eliminar la
                estación{" "}
                <strong>
                  {estacionAEliminar.nombre}
                </strong>
                ?
              </p>

              <p style={warningTextStyle}>
                La estación se eliminará del catálogo.
              </p>

              {errorFormulario && (
                <div style={errorStyle}>
                  {errorFormulario}
                </div>
              )}

              <div
                style={{
                  ...modalActionsStyle,
                  justifyContent: "center",
                }}
              >
                <button
                  type="button"
                  onClick={
                    cancelarEliminacionEstacion
                  }
                  disabled={guardando}
                  style={secondaryButtonStyle}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarEliminacionEstacion
                  }
                  disabled={guardando}
                  style={{
                    ...deleteButtonStyle,
                    opacity:
                      guardando ? 0.7 : 1,
                  }}
                >
                  {guardando
                    ? "Eliminando..."
                    : "Eliminar"}
                </button>
              </div>
            </section>
          </div>
        )
      }
    </Layout >
  );
}
interface ProyectosTableProps {
  proyectos: Proyecto[];
  guardando: boolean;
  numeroInicial: number;

  onEditar: (
    proyecto: Proyecto
  ) => void;

  onEliminar: (
    proyecto: Proyecto
  ) => void;

  onCambiarEstado: (
    proyecto: Proyecto
  ) => void;
}

function ProyectosTable({
  proyectos,
  guardando,
  numeroInicial,
  onEditar,
  onEliminar,
  onCambiarEstado,
}: ProyectosTableProps) {
  if (proyectos.length === 0) {
    return (
      <div style={emptyStyle}>
        No hay proyectos que coincidan con los filtros.

      </div>
    );
  }

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeaderRowStyle}>
            <th style={thStyle}>ID</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>
              Descripción
            </th>
            <th style={thStyle}>Estado</th>

            <th
              style={{
                ...thStyle,
                width: "105px",
                textAlign: "right",
              }}
            >
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {proyectos.map((proyecto, indice) => (
            <tr key={proyecto.idProyecto}>
              <td style={numberCellStyle}>
                {numeroInicial + indice}
              </td>

              <td style={tdStyle}>
                <strong>
                  {proyecto.nombre}
                </strong>
              </td>

              <td style={tdStyle}>
                {proyecto.descripcion ||
                  "Sin descripción"}
              </td>

              <td style={tdStyle}>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() =>
                    onCambiarEstado(proyecto)
                  }
                  title={
                    proyecto.activo
                      ? "Marcar como inactivo"
                      : "Volver a activar"
                  }
                  style={
                    proyecto.activo
                      ? activeStatusStyle
                      : inactiveStatusStyle
                  }
                >
                  {proyecto.activo
                    ? "Activo"
                    : "Inactivo"}
                </button>
              </td>
              <td style={actionsCellStyle}>
                <button
                  type="button"
                  title="Editar proyecto"
                  aria-label={
                    `Editar ${proyecto.nombre}`
                  }
                  disabled={guardando}
                  onClick={() => {
                    onEditar(proyecto);
                  }}
                  style={editIconButtonStyle}
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  title="Eliminar proyecto"
                  aria-label={
                    `Eliminar ${proyecto.nombre}`
                  }
                  disabled={guardando}
                  onClick={() => {
                    onEliminar(proyecto);
                  }}
                  style={deleteIconButtonStyle}
                >
                  <CloseIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
interface FamiliasTableProps {
  familias: Familia[];
  guardando: boolean;
  numeroInicial: number;

  onEditar: (
    familia: Familia
  ) => void;

  onEliminar: (
    familia: Familia
  ) => void;

  onCambiarEstado: (
    familia: Familia
  ) => void;

  onImportarEstaciones: (
    familia: Familia
  ) => void;

}
function FamiliasTable({
  familias,
  guardando,
  numeroInicial,
  onEditar,
  onEliminar,
  onCambiarEstado,
}: FamiliasTableProps) {
  if (familias.length === 0) {
    return (
      <div style={emptyStyle}>
        No hay familias que coincidan con los filtros.

      </div>
    );
  }

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeaderRowStyle}>
            <th style={numberHeaderStyle}>
              N.º
            </th>



            <th style={thStyle}>
              Proyecto
            </th>

            <th style={thStyle}>
              Familia
            </th>

            <th style={thStyle}>
              Descripción
            </th>

            <th style={thStyle}>
              Estado
            </th>

            <th
              style={{
                ...thStyle,
                width: "105px",
                textAlign: "right",
              }}
            >
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {familias.map((familia, indice) => (
            <tr key={familia.idFamilia}>
              <td style={numberCellStyle}>
                {numeroInicial + indice}
              </td>

              <td style={tdStyle}>
                {familia.nombreProyecto}
              </td>

              <td style={tdStyle}>
                <strong>
                  {familia.nombre}
                </strong>
              </td>

              <td style={tdStyle}>
                {familia.descripcion ||
                  "Sin descripción"}
              </td>

              <td style={tdStyle}>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() =>
                    onCambiarEstado(familia)
                  }
                  title={
                    familia.activo
                      ? "Marcar como inactiva"
                      : "Volver a activar"
                  }
                  style={
                    familia.activo
                      ? activeStatusStyle
                      : inactiveStatusStyle
                  }
                >
                  {familia.activo
                    ? "Activa"
                    : "Inactiva"}
                </button>
              </td>

              <td style={actionsCellStyle}>
                <button
                  type="button"
                  title="Editar familia"
                  aria-label={`Editar ${familia.nombre}`}
                  disabled={guardando}
                  onClick={() => {
                    onEditar(familia);
                  }}
                  style={editIconButtonStyle}
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  title="Eliminar familia"
                  aria-label={`Eliminar ${familia.nombre}`}
                  disabled={guardando}
                  onClick={() => {
                    onEliminar(familia);
                  }}
                  style={deleteIconButtonStyle}
                >
                  <CloseIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface EstacionesTableProps {
  estaciones: Estacion[];
  guardando: boolean;
  numeroInicial: number;

  onEditar: (
    estacion: Estacion
  ) => void;

  onEliminar: (
    estacion: Estacion
  ) => void;

  onCambiarEstado: (
    estacion: Estacion
  ) => void;
}

function EstacionesTable({
  estaciones,
  guardando,
  numeroInicial,
  onEditar,
  onEliminar,
  onCambiarEstado,
}: EstacionesTableProps) {
  if (estaciones.length === 0) {
    return (
      <div style={emptyStyle}>
        No hay Estaciones que coincidan con los filtros.
      </div>
    );
  }

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeaderRowStyle}>
            <th style={numberHeaderStyle}>N.º</th>

            <th style={thStyle}>
              Proyecto
            </th>

            <th style={thStyle}>
              Familia
            </th>

            <th style={thStyle}>
              Estación
            </th>

            <th style={thStyle}>
              Estado
            </th>

            <th
              style={{
                ...thStyle,
                width: "105px",
                textAlign: "right",
              }}
            >
              Acciones
            </th>
          </tr>
        </thead>

        <tbody>
          {estaciones.map((estacion, indice) => (
            <tr key={estacion.idEstacion}>
              <td style={numberCellStyle}>
                {numeroInicial + indice}
              </td>

              <td style={tdStyle}>
                {estacion.nombreProyecto}
              </td>

              <td style={tdStyle}>
                {estacion.nombreFamilia}
              </td>

              <td style={tdStyle}>
                <strong>
                  {estacion.nombre}
                </strong>
              </td>

              <td style={tdStyle}>
                <button
                  type="button"
                  disabled={guardando}
                  onClick={() =>
                    onCambiarEstado(estacion)
                  }
                  title={
                    estacion.activo
                      ? "Marcar como inactiva"
                      : "Volver a activar"
                  }
                  style={
                    estacion.activo
                      ? activeStatusStyle
                      : inactiveStatusStyle
                  }
                >
                  {estacion.activo
                    ? "Activa"
                    : "Inactiva"}
                </button>
              </td>

              <td style={actionsCellStyle}>
                <button
                  type="button"
                  title="Editar estación"
                  aria-label={`Editar ${estacion.nombre} `}
                  disabled={guardando}
                  onClick={() =>
                    onEditar(estacion)
                  }
                  style={editIconButtonStyle}
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  title="Eliminar estación"
                  aria-label={`Eliminar ${estacion.nombre} `}
                  disabled={guardando}
                  onClick={() =>
                    onEliminar(estacion)
                  }
                  style={deleteIconButtonStyle}
                >
                  <CloseIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface PaginacionProps {
  paginaActual: number;
  totalPaginas: number;

  onCambiar: (
    pagina: number
  ) => void;
}

function Paginacion({
  paginaActual,
  totalPaginas,
  onCambiar,
}: PaginacionProps) {
  return (
    <div style={paginationStyle}>
      <button
        type="button"
        disabled={
          paginaActual === 1
        }
        onClick={() => {
          onCambiar(
            Math.max(
              1,
              paginaActual - 1
            )
          );
        }}
        style={{
          ...secondaryButtonStyle,
          opacity:
            paginaActual === 1
              ? 0.5
              : 1,
        }}
      >
        Anterior
      </button>

      <span style={paginationTextStyle}>
        Página {paginaActual} de{" "}
        {totalPaginas}
      </span>

      <button
        type="button"
        disabled={
          paginaActual ===
          totalPaginas
        }
        onClick={() => {
          onCambiar(
            Math.min(
              totalPaginas,
              paginaActual + 1
            )
          );
        }}
        style={{
          ...secondaryButtonStyle,
          opacity:
            paginaActual ===
              totalPaginas
              ? 0.5
              : 1,
        }}
      >
        Siguiente
      </button>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 20h4L19 9l-4-4L4 16v4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      <path
        d="m13.5 6.5 4 4"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

const pageContainerStyle = {
  width: "100%",
  maxWidth: "1200px",
  margin: "0 auto",
};

const sectionContainerStyle = {
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
  marginBottom: "25px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "30px",
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
  lineHeight: 1.5,
};

const tabsContainerStyle = {
  display: "flex",
  gap: "10px",
  marginBottom: "25px",
  paddingBottom: "18px",
  borderBottom:
    "1px solid #e2e8f0",
};

const primaryButtonStyle = {
  minHeight: "42px",
  padding: "10px 17px",
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
  minHeight: "42px",
  padding: "10px 17px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  color: "#334155",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const deleteButtonStyle = {
  minHeight: "42px",
  padding: "10px 17px",
  border: "none",
  borderRadius: "9px",
  background: "#b91c1c",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "700",
  cursor: "pointer",
};

const tabStyle = {
  padding: "10px 18px",
  border: "1px solid #dbe2ea",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "14px",
  fontWeight: "650",
  cursor: "pointer",
};

const activeTabStyle = {
  ...tabStyle,
  border: "1px solid #102957",
  background: "#102957",
  color: "#ffffff",
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

const tableHeaderRowStyle = {
  background: "#f8fafc",
};

const thStyle = {
  padding: "14px",
  borderBottom:
    "2px solid #e2e8f0",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
  whiteSpace: "nowrap" as const,
};
const numberHeaderStyle = {
  ...thStyle,
  width: "70px",
  textAlign: "center" as const,
};


const tdStyle = {
  padding: "14px",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#334155",
  fontSize: "14px",
};

const numberCellStyle = {
  ...tdStyle,
  width: "70px",
  textAlign: "center" as const,
  fontWeight: "700",
};

const actionsCellStyle = {
  ...tdStyle,
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
};

const activeStatusStyle = {
  display: "inline-block",
  minWidth: "76px",
  padding: "6px 11px",
  border: "1px solid #bbf7d0",
  borderRadius: "999px",
  background: "#dcfce7",
  color: "#166534",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  cursor: "pointer",
};

const inactiveStatusStyle = {
  display: "inline-block",
  minWidth: "76px",
  padding: "6px 11px",
  border: "1px solid #fecaca",
  borderRadius: "999px",
  background: "#fee2e2",
  color: "#991b1b",
  fontSize: "12px",
  fontWeight: "700",
  textAlign: "center" as const,
  cursor: "pointer",
};

const editIconButtonStyle = {
  width: "34px",
  height: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginRight: "7px",
  padding: 0,
  border: "1px solid #bfdbfe",
  borderRadius: "8px",
  background: "#eff6ff",
  color: "#1d4ed8",
  cursor: "pointer",
};

const deleteIconButtonStyle = {
  width: "34px",
  height: "34px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
  border: "1px solid #fecaca",
  borderRadius: "8px",
  background: "#fef2f2",
  color: "#b91c1c",
  cursor: "pointer",
};

const messageStyle = {
  padding: "40px",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const errorStyle = {
  marginBottom: "16px",
  padding: "14px 16px",
  border: "1px solid #fecaca",
  borderRadius: "10px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "14px",
  textAlign: "center" as const,
};

const successStyle = {
  marginBottom: "20px",
  padding: "14px 16px",
  border: "1px solid #bbf7d0",
  borderRadius: "10px",
  background: "#f0fdf4",
  color: "#166534",
  fontSize: "14px",
  fontWeight: "650",
};

const emptyStyle = {
  padding: "40px",
  border: "1px dashed #cbd5e1",
  borderRadius: "10px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const modalOverlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1000,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  boxSizing: "border-box" as const,
  background:
    "rgba(15, 23, 42, 0.58)",
};

const modalStyle = {
  width: "100%",
  maxWidth: "520px",
  maxHeight: "90vh",
  overflowY: "auto" as const,
  padding: "30px",
  boxSizing: "border-box" as const,
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 25px 70px rgba(15, 23, 42, 0.3)",
};

const modalTitleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "24px",
};

const modalDescriptionStyle = {
  margin: "8px 0 24px",
  color: "#64748b",
  lineHeight: 1.6,
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "24px",
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

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginBottom: "18px",
};

const labelStyle = {
  color: "#17335f",
  fontSize: "14px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "46px",
  boxSizing: "border-box" as const,
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  padding: "0 13px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "15px",
  outline: "none",
};

const textareaStyle = {
  ...inputStyle,
  minHeight: "100px",
  paddingTop: "12px",
  resize: "vertical" as const,
};

const helpTextStyle = {
  color: "#64748b",
  fontSize: "12px",
};

const selectedFileStyle = {
  marginBottom: "16px",
  padding: "12px",
  border: "1px solid #bfdbfe",
  borderRadius: "9px",
  background: "#eff6ff",
  color: "#1e40af",
  fontSize: "13px",
};

const importResultStyle = {
  marginTop: "16px",
  padding: "14px",
  border: "1px solid #bbf7d0",
  borderRadius: "9px",
  background: "#f0fdf4",
  color: "#166534",
};

const importSummaryStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2, minmax(0, 1fr))",
  gap: "8px 14px",
  marginTop: "12px",
  fontSize: "13px",
};

const paginationStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "14px",
  marginTop: "18px",
};

const paginationTextStyle = {
  color: "#475569",
  fontSize: "13px",
  fontWeight: "700",
};