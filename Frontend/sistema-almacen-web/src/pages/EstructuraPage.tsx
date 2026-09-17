
import {
  useEffect,
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

import type {
  Proyecto,
} from "../types/proyecto";

import type {
  Familia,
} from "../types/familia";

type TabActiva =
  | "proyectos"
  | "familias"
  | "estaciones";

export function EstructuraPage() {
  const [tabActiva, setTabActiva] =
    useState<TabActiva>("proyectos");

  const [proyectos, setProyectos] =
    useState<Proyecto[]>([]);

  const [familias, setFamilias] =
    useState<Familia[]>([]);
  // Controla el formulario de familias.
  const [
    mostrarFormularioFamilia,
    setMostrarFormularioFamilia,
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
      ] = await Promise.all([
        obtenerProyectos(),
        obtenerFamilias(),
      ]);

      setProyectos(proyectosData);
      setFamilias(familiasData);
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

    setMensajeExito(
      "Las estaciones se implementarán en la segunda fase."
    );
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

          {mensajeExito && (
            <div style={successStyle}>
              {mensajeExito}
            </div>
          )}

          {errorFormulario &&
            !mostrarFormularioProyecto &&
            !mostrarConfirmacionEliminar && (
              <div style={errorStyle}>
                {errorFormulario}
              </div>
            )}

          <div style={tabsContainerStyle}>
            <button
              type="button"
              onClick={() =>
                setTabActiva("proyectos")
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
                setTabActiva("familias")
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
                setTabActiva("estaciones")
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

          {!cargando && errorCarga && (
            <div style={errorStyle}>
              {errorCarga}
            </div>
          )}

          {!cargando &&
            !errorCarga &&
            tabActiva === "proyectos" && (
              <ProyectosTable
                proyectos={proyectos}
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
              />
            )}

          {!cargando &&
            !errorCarga &&
            tabActiva === "familias" && (

              <FamiliasTable
                familias={familias}
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
              />


            )}

          {!cargando &&
            !errorCarga &&
            tabActiva === "estaciones" && (
              <div style={emptyStyle}>
                <strong>
                  Estaciones pendientes
                </strong>

                <p
                  style={{
                    margin: "8px 0 0",
                  }}
                >
                  Esta sección se habilitará
                  cuando la planta defina las
                  estaciones oficiales.
                </p>
              </div>
            )}
        </section>
      </div>

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
      )}
      {mostrarFormularioFamilia && (
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
      )}

      {mostrarConfirmacionEliminar &&
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
        )}
      {mostrarConfirmacionEliminarFamilia &&
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
        )}




    </Layout>
  );
}

interface ProyectosTableProps {
  proyectos: Proyecto[];
  guardando: boolean;
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
  onEditar,
  onEliminar,
  onCambiarEstado,
}: ProyectosTableProps) {
  if (proyectos.length === 0) {
    return (
      <div style={emptyStyle}>
        No hay proyectos registrados.
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
          {proyectos.map((proyecto) => (
            <tr key={proyecto.idProyecto}>
              <td style={tdStyle}>
                {proyecto.idProyecto}
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
                  aria-label={`Editar ${proyecto.nombre}`}
                  disabled={guardando}
                  onClick={() =>
                    onEditar(proyecto)
                  }
                  style={editIconButtonStyle}
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  title="Eliminar proyecto"
                  aria-label={`Eliminar ${proyecto.nombre}`}
                  disabled={guardando}
                  onClick={() =>
                    onEliminar(proyecto)
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
interface FamiliasTableProps {
  familias: Familia[];
  guardando: boolean;

  onEditar: (
    familia: Familia
  ) => void;

  onEliminar: (
    familia: Familia
  ) => void;

  onCambiarEstado: (
    familia: Familia
  ) => void;
}

function FamiliasTable({
  familias,
  guardando,
  onEditar,
  onEliminar,
  onCambiarEstado,
}: FamiliasTableProps) {
  if (familias.length === 0) {
    return (
      <div style={emptyStyle}>
        No hay familias registradas.
      </div>
    );
  }

  return (
    <div style={tableContainerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr style={tableHeaderRowStyle}>
            <th style={thStyle}>
              ID
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
          {familias.map((familia) => (
            <tr key={familia.idFamilia}>
              <td style={tdStyle}>
                {familia.idFamilia}
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
                  onClick={() =>
                    onEditar(familia)
                  }
                  style={editIconButtonStyle}
                >
                  <PencilIcon />
                </button>

                <button
                  type="button"
                  title="Eliminar familia"
                  aria-label={`Eliminar ${familia.nombre}`}
                  disabled={guardando}
                  onClick={() =>
                    onEliminar(familia)
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

const tdStyle = {
  padding: "14px",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#334155",
  fontSize: "14px",
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