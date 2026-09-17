import type {
  FormEvent,
} from "react";

import type {
  Proyecto,
} from "../../types/proyecto";

interface FamiliaFormModalProps {
  proyectos: Proyecto[];
  idProyecto: number;
  nombre: string;
  descripcion: string;
  guardando: boolean;
  error: string;
  esEdicion: boolean;
  onCambiarProyecto: (
    idProyecto: number
  ) => void;
  onCambiarNombre: (
    nombre: string
  ) => void;
  onCambiarDescripcion: (
    descripcion: string
  ) => void;
  onGuardar: (
    event: FormEvent<HTMLFormElement>
  ) => void;
  onCancelar: () => void;
}

export function FamiliaFormModal({
  proyectos,
  idProyecto,
  nombre,
  descripcion,
  guardando,
  error,
  esEdicion,
  onCambiarProyecto,
  onCambiarNombre,
  onCambiarDescripcion,
  onGuardar,
  onCancelar,
}: FamiliaFormModalProps) {
  const proyectosActivos =
    proyectos.filter(
      (proyecto) =>
        proyecto.activo ||
        proyecto.idProyecto === idProyecto
    );

  return (
    <div className="estructura-modal-overlay">
      <section className="estructura-modal">
        <h2 className="estructura-modal-title">
          {esEdicion
            ? "Editar familia"
            : "Nueva familia"}
        </h2>

        <p className="estructura-modal-description">
          {esEdicion
            ? "Actualiza el proyecto, nombre o descripción de la familia."
            : "Registra una familia y asígnala obligatoriamente a un proyecto."}
        </p>

        <form onSubmit={onGuardar}>
          <div className="estructura-form-group">
            <label
              htmlFor="familiaProyecto"
              className="estructura-label"
            >
              Proyecto *
            </label>

            <select
              id="familiaProyecto"
              value={
                idProyecto > 0
                  ? idProyecto
                  : ""
              }
              onChange={(event) => {
                onCambiarProyecto(
                  Number(
                    event.target.value
                  )
                );
              }}
              disabled={guardando}
              className="estructura-select"
            >
              <option value="">
                Selecciona un proyecto
              </option>

              {proyectosActivos.map(
                (proyecto) => (
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

            <small className="estructura-help-text">
              Solo se muestran proyectos
              activos.
            </small>
          </div>

          <div className="estructura-form-group">
            <label
              htmlFor="nombreFamilia"
              className="estructura-label"
            >
              Nombre de la familia *
            </label>

            <input
              id="nombreFamilia"
              type="text"
              value={nombre}
              onChange={(event) => {
                onCambiarNombre(
                  event.target.value
                );
              }}
              maxLength={100}
              placeholder="Ejemplo: Familia DT"
              autoFocus
              disabled={guardando}
              className="estructura-input"
            />

            <small className="estructura-help-text">
              Máximo 100 caracteres.
            </small>
          </div>

          <div className="estructura-form-group">
            <label
              htmlFor="descripcionFamilia"
              className="estructura-label"
            >
              Descripción
            </label>

            <textarea
              id="descripcionFamilia"
              value={descripcion}
              onChange={(event) => {
                onCambiarDescripcion(
                  event.target.value
                );
              }}
              maxLength={255}
              rows={4}
              placeholder="Descripción opcional de la familia"
              disabled={guardando}
              className="estructura-textarea"
            />

            <small className="estructura-help-text">
              {descripcion.length}/255
              caracteres
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
                  : "Guardar familia"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}