import type { FormEvent } from "react";

import type { Proyecto } from "../../types/proyecto";
import type { Familia } from "../../types/familia";

interface EstacionFormModalProps {
  proyectos: Proyecto[];
  familias: Familia[];

  idProyecto: number;
  idFamilia: number;
  nombre: string;

  guardando: boolean;
  error: string;
  esEdicion: boolean;

  onCambiarProyecto: (
    idProyecto: number
  ) => void;

  onCambiarFamilia: (
    idFamilia: number
  ) => void;

  onCambiarNombre: (
    nombre: string
  ) => void;

  onGuardar: (
    event: FormEvent<HTMLFormElement>
  ) => void;

  onCancelar: () => void;
}

export function EstacionFormModal({
  proyectos,
  familias,
  idProyecto,
  idFamilia,
  nombre,
  guardando,
  error,
  esEdicion,
  onCambiarProyecto,
  onCambiarFamilia,
  onCambiarNombre,
  onGuardar,
  onCancelar,
}: EstacionFormModalProps) {
  const proyectosDisponibles =
    proyectos.filter(
      (proyecto) =>
        proyecto.activo ||
        proyecto.idProyecto === idProyecto
    );

  const familiasDisponibles =
    familias.filter(
      (familia) =>
        familia.idProyecto === idProyecto &&
        (
          familia.activo ||
          familia.idFamilia === idFamilia
        )
    );

  const manejarCambioProyecto = (
    nuevoIdProyecto: number
  ) => {
    onCambiarProyecto(
      nuevoIdProyecto
    );

    // Limpia la familia cuando cambia el proyecto.
    onCambiarFamilia(0);
  };

  return (
    <div className="estructura-modal-overlay">
      <section className="estructura-modal">
        <h2 className="estructura-modal-title">
          {esEdicion
            ? "Editar estación"
            : "Nueva estación"}
        </h2>

        <p className="estructura-modal-description">
          {esEdicion
            ? "Actualiza la familia o el nombre de la estación."
            : "Selecciona el proyecto y la familia a la que pertenecerá la estación."}
        </p>

        <form onSubmit={onGuardar}>
          <div className="estructura-form-group">
            <label
              htmlFor="estacionProyecto"
              className="estructura-label"
            >
              Proyecto *
            </label>

            <select
              id="estacionProyecto"
              value={
                idProyecto > 0
                  ? idProyecto
                  : ""
              }
              onChange={(event) =>
                manejarCambioProyecto(
                  Number(event.target.value)
                )
              }
              disabled={guardando}
              className="estructura-select"
            >
              <option value="">
                Selecciona un proyecto
              </option>

              {proyectosDisponibles.map(
                (proyecto) => (
                  <option
                    key={proyecto.idProyecto}
                    value={proyecto.idProyecto}
                  >
                    {proyecto.nombre}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="estructura-form-group">
            <label
              htmlFor="estacionFamilia"
              className="estructura-label"
            >
              Familia *
            </label>

            <select
              id="estacionFamilia"
              value={
                idFamilia > 0
                  ? idFamilia
                  : ""
              }
              onChange={(event) =>
                onCambiarFamilia(
                  Number(event.target.value)
                )
              }
              disabled={
                guardando ||
                idProyecto <= 0
              }
              className="estructura-select"
            >
              <option value="">
                {idProyecto > 0
                  ? "Selecciona una familia"
                  : "Primero selecciona un proyecto"}
              </option>

              {familiasDisponibles.map(
                (familia) => (
                  <option
                    key={familia.idFamilia}
                    value={familia.idFamilia}
                  >
                    {familia.nombre}
                  </option>
                )
              )}
            </select>

            {idProyecto > 0 &&
              familiasDisponibles.length === 0 && (
                <small className="estructura-help-text">
                  El proyecto seleccionado no tiene
                  familias activas.
                </small>
              )}
          </div>

          <div className="estructura-form-group">
            <label
              htmlFor="nombreEstacion"
              className="estructura-label"
            >
              Nombre de la estación *
            </label>

            <input
              id="nombreEstacion"
              type="text"
              value={nombre}
              onChange={(event) =>
                onCambiarNombre(
                  event.target.value
                )
              }
              maxLength={100}
              placeholder="Ejemplo: GENERAL"
              autoFocus
              disabled={guardando}
              className="estructura-input"
            />

            <small className="estructura-help-text">
              El nombre se guardará en mayúsculas.
            </small>
          </div>

          {error && (
            <div className="estructura-error">
              {error}
            </div>
          )}

          <div className="estructura-modal-actions">
            <button
              type="button"
              onClick={onCancelar}
              disabled={guardando}
              className="estructura-secondary-button"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="estructura-primary-button"
            >
              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Guardar estación"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}