import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    FormEvent,
} from "react";
import type {
    ResultadoImportacionMaterialKit,
} from "../services/materialKitService";

import axios from "axios";

import {
    Layout,
} from "../components/Layout";

import {
    obtenerFamiliasSurtidoMrp,
    obtenerFechasSurtidoMrp,
    obtenerMaterialesSurtidoMrp,

    obtenerProyectosSurtidoMrp,
    obtenerKitsNoRecibidosMrp,
} from "../services/surtidoMrpService";

import type {
    EstadoAbastecimiento,
    MaterialSurtidoMrp,
    KitNoRecibidoMrp,

} from "../services/surtidoMrpService";

import {
    importarMaterialKits,
} from "../services/materialKitService";


export function SurtidoMrpPage() {
    const [
        proyectos,
        setProyectos,
    ] = useState<string[]>([]);

    const [
        familias,
        setFamilias,
    ] = useState<string[]>([]);

    const [
        materiales,
        setMateriales,
    ] = useState<
        MaterialSurtidoMrp[]
    >([]);

    const [
        proyecto,
        setProyecto,
    ] = useState("");

    const [
        familia,
        setFamilia,
    ] = useState("");

    const [
        busqueda,
        setBusqueda,
    ] = useState("");

    const [
        estado,
        setEstado,
    ] = useState<
        EstadoAbastecimiento | ""
    >("");

    const [
        tiposMaterial,
        setTiposMaterial,
    ] = useState<string[]>([]);

    const [
        mostrarTiposMaterial,
        setMostrarTiposMaterial,
    ] = useState(false);

    const [
        pagina,
        setPagina,
    ] = useState(1);

    const filtroTiposRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const tamanoPagina = 15;

    const [
        materialSeleccionado,
        setMaterialSeleccionado,
    ] = useState<
        MaterialSurtidoMrp | null
    >(null);

    const [
        cargandoProyectos,
        setCargandoProyectos,
    ] = useState(true);

    const [
        cargandoFamilias,
        setCargandoFamilias,
    ] = useState(false);

    const [
        cargandoMateriales,
        setCargandoMateriales,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        fechas,
        setFechas,
    ] = useState<string[]>([]);

    const [
        fecha,
        setFecha,
    ] = useState("");

    const [
        cargandoFechas,
        setCargandoFechas,
    ] = useState(true);

    const [
        mostrarImportacionKits,
        setMostrarImportacionKits,
    ] = useState(false);

    const [
        archivoKits,
        setArchivoKits,
    ] = useState<File | null>(null);

    const [
        importandoKits,
        setImportandoKits,
    ] = useState(false);

    const [
        resultadoImportacionKits,
        setResultadoImportacionKits,
    ] = useState<
        ResultadoImportacionMaterialKit | null
    >(null);

    const [
        errorImportacionKits,
        setErrorImportacionKits,
    ] = useState("");

    const [
        mensajeImportacionKits,
        setMensajeImportacionKits,
    ] = useState("");

    const [
        recepcionPics,
        setRecepcionPics,
    ] = useState("");

    const [
        kitsNoRecibidos,
        setKitsNoRecibidos,
    ] = useState<KitNoRecibidoMrp[]>([]);

    const [
        cargandoKitsNoRecibidos,
        setCargandoKitsNoRecibidos,
    ] = useState(false);

    const [
        errorKitsNoRecibidos,
        setErrorKitsNoRecibidos,
    ] = useState("");

    const abrirImportacionKits = () => {
        setArchivoKits(null);
        setResultadoImportacionKits(null);
        setErrorImportacionKits("");
        setMensajeImportacionKits("");
        setMostrarImportacionKits(true);
    };

    const cerrarImportacionKits = () => {
        if (importandoKits) {
            return;
        }

        setMostrarImportacionKits(false);
        setArchivoKits(null);
        setResultadoImportacionKits(null);
        setErrorImportacionKits("");
        setMensajeImportacionKits("");
    };
    // Envía el reporte PICSFR010 al backend.
    const ejecutarImportacionKits = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        if (!archivoKits) {
            setErrorImportacionKits(
                "Selecciona el archivo PICSFR010."
            );

            return;
        }

        try {
            setImportandoKits(true);
            setErrorImportacionKits("");
            setMensajeImportacionKits("");
            setResultadoImportacionKits(null);

            const respuesta =
                await importarMaterialKits(
                    archivoKits
                );

            setResultadoImportacionKits(
                respuesta.resultado
            );

            setMensajeImportacionKits(
                respuesta.mensaje
            );

            // Actualiza las fechas después
            // de importar el PICS nuevo.
            const fechasActualizadas =
                await obtenerFechasSurtidoMrp();

            setFechas(
                fechasActualizadas
            );

            // Actualiza la consulta seleccionada.
            if (
                fecha &&
                proyecto &&
                familia
            ) {
                const materialesActualizados =
                    await obtenerMaterialesSurtidoMrp(
                        fecha,
                        proyecto,
                        familia
                    );

                setMateriales(
                    materialesActualizados
                );

                setMaterialSeleccionado(
                    null
                );

                setPagina(1);
            }
        } catch (errorImportacion) {
            console.error(
                "Error al importar kits:",
                errorImportacion
            );

            setErrorImportacionKits(
                obtenerMensajeError(
                    errorImportacion,
                    "No se pudo importar la lista de kits."
                )
            );
        } finally {
            setImportandoKits(false);
        }
    };




    // Carga las fechas cubiertas
    // por el PICS semanal activo.
    useEffect(() => {
        const cargarFechas =
            async () => {
                try {
                    setCargandoFechas(true);
                    setError("");

                    const datos =
                        await obtenerFechasSurtidoMrp();

                    setFechas(datos);

                    if (datos.length > 0) {
                        setFecha(
                            datos[0]
                        );
                    }
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar fechas:",
                        errorCarga
                    );

                    setFechas([]);
                    setFecha("");

                    setError(
                        obtenerMensajeError(
                            errorCarga,
                            "No se pudieron cargar las fechas de surtido."
                        )
                    );
                } finally {
                    setCargandoFechas(false);
                }
            };

        void cargarFechas();
    }, []);

    // Carga los proyectos correspondientes
    // a la fecha seleccionada.
    useEffect(() => {
        if (!fecha) {
            setProyectos([]);
            setProyecto("");
            setFamilias([]);
            setFamilia("");
            setMateriales([]);

            return;
        }

        const cargarProyectos =
            async () => {
                try {
                    setCargandoProyectos(true);
                    setError("");

                    setProyecto("");
                    setFamilias([]);
                    setFamilia("");
                    setMateriales([]);
                    setBusqueda("");
                    setEstado("");
                    setRecepcionPics("");
                    setTiposMaterial([]);
                    setMaterialSeleccionado(null);
                    setPagina(1);

                    const datos =
                        await obtenerProyectosSurtidoMrp(
                            fecha
                        );

                    setProyectos(datos);
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar proyectos:",
                        errorCarga
                    );

                    setProyectos([]);

                    setError(
                        obtenerMensajeError(
                            errorCarga,
                            "No se pudieron cargar los proyectos."
                        )
                    );
                } finally {
                    setCargandoProyectos(false);
                }
            };

        void cargarProyectos();
    }, [
        fecha,
    ]);

    // Carga las familias cuando
    // cambia el proyecto.
    useEffect(() => {
        if (!fecha || !proyecto) {
            setFamilias([]);
            setFamilia("");
            setMateriales([]);

            return;
        }

        const cargarFamilias =
            async () => {
                try {
                    setCargandoFamilias(true);
                    setError("");

                    setFamilia("");
                    setMateriales([]);

                    const datos =
                        await obtenerFamiliasSurtidoMrp(
                            fecha,
                            proyecto
                        );

                    setFamilias(datos);
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar familias:",
                        errorCarga
                    );

                    setFamilias([]);

                    setError(
                        obtenerMensajeError(
                            errorCarga,
                            "No se pudieron cargar las familias."
                        )
                    );
                } finally {
                    setCargandoFamilias(false);
                }
            };

        void cargarFamilias();
    }, [
        fecha,
        proyecto,
    ]);
    // Carga los materiales cuando
    // se completa proyecto y familia.
    useEffect(() => {
        if (
            !fecha ||
            !proyecto ||
            !familia
        ) {
            setMateriales([]);

            return;
        }

        const cargarMateriales =
            async () => {
                try {
                    setCargandoMateriales(true);
                    setError("");

                    const datos =
                        await obtenerMaterialesSurtidoMrp(
                            fecha,
                            proyecto,
                            familia
                        );

                    setMateriales(datos);
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar materiales:",
                        errorCarga
                    );

                    setMateriales([]);

                    setError(
                        obtenerMensajeError(
                            errorCarga,
                            "No se pudieron cargar los materiales."
                        )
                    );
                } finally {
                    setCargandoMateriales(false);
                }
            };

        void cargarMateriales();
    }, [
        fecha,
        proyecto,
        familia,
    ]);


    // Carga únicamente los seriales que PICS
    // todavía marca como no recibidos.
    useEffect(() => {
        if (
            recepcionPics !== "NO_RECIBIDOS" ||
            !fecha ||
            !proyecto ||
            !familia
        ) {
            setKitsNoRecibidos([]);
            setErrorKitsNoRecibidos("");

            return;
        }

        const cargarKitsNoRecibidos =
            async () => {
                try {
                    setCargandoKitsNoRecibidos(
                        true
                    );

                    setErrorKitsNoRecibidos("");

                    const datos =
                        await obtenerKitsNoRecibidosMrp(
                            fecha,
                            proyecto,
                            familia
                        );

                    setKitsNoRecibidos(
                        datos
                    );
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar kits no recibidos:",
                        errorCarga
                    );

                    setKitsNoRecibidos([]);

                    setErrorKitsNoRecibidos(
                        obtenerMensajeError(
                            errorCarga,
                            "No se pudieron cargar los kits no recibidos."
                        )
                    );
                } finally {
                    setCargandoKitsNoRecibidos(
                        false
                    );
                }
            };

        void cargarKitsNoRecibidos();
    }, [
        recepcionPics,
        fecha,
        proyecto,
        familia,
    ]);

    // Cierra el selector de tipos
    // al hacer clic fuera.
    useEffect(() => {
        const cerrarSelector = (
            event: MouseEvent
        ) => {
            const elemento =
                event.target as Node;

            if (
                filtroTiposRef.current &&
                !filtroTiposRef.current.contains(
                    elemento
                )
            ) {
                setMostrarTiposMaterial(
                    false
                );
            }
        };

        document.addEventListener(
            "mousedown",
            cerrarSelector
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                cerrarSelector
            );
        };
    }, []);

    const materialesFiltrados =
        useMemo(() => {
            const texto =
                normalizarTexto(
                    busqueda
                );

            return materiales.filter(
                (material) => {
                    const coincideBusqueda =
                        !texto ||
                        normalizarTexto(
                            material.numeroMaterial
                        ).includes(texto) ||
                        normalizarTexto(
                            material.nombreMaterial
                        ).includes(texto);

                    const coincideEstado =
                        !estado ||
                        material.estadoSurtido ===
                        estado;


                    const coincideTipo =
                        tiposMaterial.length === 0 ||
                        (
                            material.tipoMaterial !== null &&
                            tiposMaterial.includes(
                                material.tipoMaterial
                            )
                        );

                    return (
                        coincideBusqueda &&
                        coincideEstado &&
                        coincideTipo

                    );
                }
            );
        }, [
            materiales,
            busqueda,
            estado,
            tiposMaterial,
            recepcionPics,
            
        ]);

    // Regresa a la primera página
    // cuando cambia un filtro.
    useEffect(() => {
        setPagina(1);
    }, [
        proyecto,
        familia,
        busqueda,
        estado,
        tiposMaterial,
    ]);

    const totalPaginas =
        Math.max(
            1,
            Math.ceil(
                materialesFiltrados.length /
                tamanoPagina
            )
        );

    const materialesPaginados =
        useMemo(() => {
            const inicio =
                (pagina - 1) *
                tamanoPagina;

            return materialesFiltrados.slice(
                inicio,
                inicio + tamanoPagina
            );
        }, [
            materialesFiltrados,
            pagina,
        ]);


    const resumen =
        useMemo(() => {
            return materiales.reduce(
                (acumulado, material) => {
                    acumulado.requeridoDia +=
                        material.cantidadRequeridaDia;

                    acumulado.requeridoAcumulado +=
                        material.cantidadRequeridaAcumulada;

                    acumulado.surtidoAcumulado +=
                        material.cantidadSurtidaAcumulada;

                    acumulado.pendienteAcumulado +=
                        material.cantidadPendienteAcumulada;

                    acumulado.surtibleAhora +=
                        material.cantidadSurtibleAcumulada;

                    return acumulado;
                },
                {
                    requeridoDia: 0,
                    requeridoAcumulado: 0,
                    surtidoAcumulado: 0,
                    pendienteAcumulado: 0,
                    surtibleAhora: 0,
                }
            );
        }, [
            materiales,
        ]);


    const alternarTipoMaterial = (
        tipo: string
    ) => {
        setTiposMaterial(
            (tiposActuales) => {
                if (
                    tiposActuales.includes(
                        tipo
                    )
                ) {
                    return tiposActuales.filter(
                        (valor) =>
                            valor !== tipo
                    );
                }

                return [
                    ...tiposActuales,
                    tipo,
                ];
            }
        );

        setPagina(1);
    };




    const limpiarFiltros = () => {
        setBusqueda("");
        setEstado("");
        setRecepcionPics("");
        setTiposMaterial([]);
        setMaterialSeleccionado(null);
        setMostrarTiposMaterial(false);
        setPagina(1);
        setError("");
    };

    return (
        <Layout>
            <div style={pageContainerStyle}>
                <section style={cardStyle}>
                    <header style={headerStyle}>
                        <div>
                            <h1 style={titleStyle}>
                                Surtido Plan Produccion
                            </h1>

                            <p style={descriptionStyle}>
                                Selecciona proyecto y familia
                                para consultar la necesidad del
                                MRP y los kits físicos registrados
                                en PICS.
                            </p>
                        </div>
                        <div style={headerActionsStyle}>
                            <span style={consultaBadgeStyle}>
                                Consulta MRP + PICS
                            </span>

                            <button
                                type="button"
                                onClick={abrirImportacionKits}
                                style={importKitsButtonStyle}
                            >
                                Importar PICS
                            </button>
                        </div>


                    </header>

                    {error && (
                        <div
                            style={errorStyle}
                            role="alert"
                        >
                            {error}
                        </div>
                    )}


                    <div style={filtersStyle}>
                        <div style={formGroupStyle}>
                            <label
                                htmlFor="fechaSurtido"
                                style={labelStyle}
                            >
                                Fecha de surtido
                            </label>

                            <select
                                id="fechaSurtido"
                                value={fecha}
                                disabled={cargandoFechas}
                                onChange={(event) => {
                                    setFecha(
                                        event.target.value
                                    );

                                    setProyecto("");
                                    setFamilia("");
                                    setFamilias([]);
                                    setMateriales([]);
                                    setBusqueda("");
                                    setEstado("");
                                    setRecepcionPics("");
                                    setTiposMaterial([]);
                                    setMostrarTiposMaterial(false);
                                    setMaterialSeleccionado(null);
                                    setPagina(1);
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    {cargandoFechas
                                        ? "Cargando fechas..."
                                        : "Selecciona una fecha"}
                                </option>

                                {fechas.map(
                                    (valor) => (
                                        <option
                                            key={valor}
                                            value={valor}
                                        >
                                            {formatearFecha(valor)}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>
                        <div style={formGroupStyle}>
                            <label
                                htmlFor="busquedaSurtido"
                                style={labelStyle}
                            >
                                Buscar material
                            </label>

                            <input
                                id="busquedaSurtido"
                                type="text"
                                value={busqueda}
                                disabled={!familia}
                                onChange={(event) => {
                                    setBusqueda(
                                        event.target.value
                                    );
                                }}
                                placeholder="Número o descripción"
                                style={inputStyle}
                            />
                        </div>

                        <div style={formGroupStyle}>
                            <label
                                htmlFor="proyectoSurtido"
                                style={labelStyle}
                            >
                                Proyecto
                            </label>

                            <select
                                id="proyectoSurtido"
                                value={proyecto}
                                disabled={
                                    cargandoProyectos
                                }
                                onChange={(event) => {
                                    setProyecto(
                                        event.target.value
                                    );

                                    setBusqueda("");
                                    setEstado("");
                                    setRecepcionPics("");
                                    setTiposMaterial([]);
                                    setMostrarTiposMaterial(false);
                                    setPagina(1);
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    {cargandoProyectos
                                        ? "Cargando proyectos..."
                                        : "Selecciona un proyecto"}
                                </option>

                                {proyectos.map(
                                    (valor) => (
                                        <option
                                            key={valor}
                                            value={valor}
                                        >
                                            {valor}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>


                        <div style={formGroupStyle}>
                            <label
                                htmlFor="familiaSurtido"
                                style={labelStyle}
                            >
                                Familia
                            </label>

                            <select
                                id="familiaSurtido"
                                value={familia}
                                disabled={
                                    !proyecto ||
                                    cargandoFamilias
                                }
                                onChange={(event) => {
                                    setFamilia(
                                        event.target.value
                                    );

                                    setBusqueda("");
                                    setEstado("");
                                    setTiposMaterial([]);
                                    setMostrarTiposMaterial(false);
                                    setPagina(1);
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    {!proyecto
                                        ? "Selecciona primero un proyecto"
                                        : cargandoFamilias
                                            ? "Cargando familias..."
                                            : "Selecciona una familia"}
                                </option>

                                {familias.map(
                                    (valor) => (
                                        <option
                                            key={valor}
                                            value={valor}
                                        >
                                            {valor}
                                        </option>
                                    )
                                )}
                            </select>
                        </div>




                        <div style={formGroupStyle}>
                            <label
                                htmlFor="estadoSurtido"
                                style={labelStyle}
                            >
                                Estado
                            </label>

                            <select
                                id="estadoSurtido"
                                value={estado}
                                disabled={!familia}
                                onChange={(event) => {
                                    setEstado(
                                        event.target
                                            .value as
                                        | EstadoAbastecimiento
                                        | ""
                                    );
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    Todos
                                </option>

                                <option value="COMPLETADO">
                                    Completado
                                </option>

                                <option value="DISPONIBLE">
                                    Disponible
                                </option>

                                <option value="DISPONIBLE_PARCIAL">
                                    Disponible parcial
                                </option>

                                <option value="NO_RECIBIDO">
                                    No recibido
                                </option>

                                <option value="SIN_KITS">
                                    Sin kits
                                </option>
                            </select>
                        </div>
                        <div style={formGroupStyle}>
                            <div
                                ref={filtroTiposRef}
                                style={multiSelectContainerStyle}
                            >
                                <span style={labelStyle}>
                                    Tipo de material
                                </span>

                                <button
                                    type="button"
                                    disabled={!familia}
                                    onClick={() => {
                                        setMostrarTiposMaterial(
                                            (valorActual) =>
                                                !valorActual
                                        );
                                    }}
                                    aria-haspopup="listbox"
                                    aria-expanded={
                                        mostrarTiposMaterial
                                    }
                                    style={{
                                        ...multiSelectButtonStyle,

                                        opacity:
                                            !familia
                                                ? 0.55
                                                : 1,

                                        cursor:
                                            !familia
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    <span>
                                        {tiposMaterial.length === 0
                                            ? "Todos"
                                            : tiposMaterial.length === 4
                                                ? "Todos los tipos"
                                                : tiposMaterial.join(", ")}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        style={{
                                            ...multiSelectArrowStyle,

                                            transform:
                                                mostrarTiposMaterial
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                        }}
                                    >
                                        ▼
                                    </span>
                                </button>

                                {mostrarTiposMaterial &&
                                    familia && (
                                        <div
                                            role="listbox"
                                            aria-multiselectable="true"
                                            style={multiSelectMenuStyle}
                                        >
                                            <label
                                                style={multiSelectOptionStyle}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        tiposMaterial.length === 0
                                                    }
                                                    onChange={() => {
                                                        setTiposMaterial([]);
                                                        setPagina(1);
                                                    }}
                                                />

                                                <span>Todos</span>
                                            </label>

                                            <div
                                                style={
                                                    multiSelectSeparatorStyle
                                                }
                                            />

                                            {["C", "P", "S", "W"].map(
                                                (tipo) => (
                                                    <label
                                                        key={tipo}
                                                        style={
                                                            multiSelectOptionStyle
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                tiposMaterial.includes(
                                                                    tipo
                                                                )
                                                            }
                                                            onChange={() => {
                                                                alternarTipoMaterial(
                                                                    tipo
                                                                );
                                                            }}
                                                        />

                                                        <span>{tipo}</span>
                                                    </label>
                                                )
                                            )}
                                        </div>
                                    )}
                            </div>
                        </div>
                        <div style={formGroupStyle}>
                            <label
                                htmlFor="recepcionPics"
                                style={labelStyle}
                            >
                                Vista
                            </label>

                            <select
                                id="recepcionPics"
                                value={recepcionPics}
                                disabled={!familia}
                                onChange={(event) => {
                                    setRecepcionPics(
                                        event.target.value
                                    );

                                    setEstado("");
                                    setPagina(1);
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    Materiales requeridos
                                </option>

                                <option value="NO_RECIBIDOS">
                                    Kits no recibidos
                                </option>
                            </select>
                        </div>

                        <div style={filterActionsStyle}>
                            <button
                                type="button"
                                onClick={limpiarFiltros}
                                style={secondaryButtonStyle}
                            >
                                Limpiar
                            </button>
                        </div>
                    </div>

                    {proyecto && familia && (
                        <div style={selectionStyle}>
                            <div>
                                <span style={selectionLabelStyle}>
                                    Fecha
                                </span>

                                <strong>
                                    {formatearFecha(fecha)}
                                </strong>
                            </div>
                            <div>
                                <span style={selectionLabelStyle}>
                                    Proyecto
                                </span>

                                <strong>
                                    {proyecto}
                                </strong>
                            </div>

                            <div>
                                <span style={selectionLabelStyle}>
                                    Familia
                                </span>

                                <strong>
                                    {familia}
                                </strong>
                            </div>

                            <div>
                                <span style={selectionLabelStyle}>
                                    Materiales
                                </span>

                                <strong>
                                    {materiales.length.toLocaleString(
                                        "es-MX"
                                    )}
                                </strong>
                            </div>
                        </div>
                    )}

                    {proyecto && familia && (
                        <div style={summaryGridStyle}>
                            <ResumenCard
                                titulo="Requerido del día"
                                valor={resumen.requeridoDia}
                                color="#1d4ed8"
                                fondo="#eff6ff"
                            />

                            <ResumenCard
                                titulo="Requerido acumulado"
                                valor={
                                    resumen.requeridoAcumulado
                                }
                                color="#4338ca"
                                fondo="#eef2ff"
                            />

                            <ResumenCard
                                titulo="Surtido acumulado"
                                valor={
                                    resumen.surtidoAcumulado
                                }
                                color="#0f766e"
                                fondo="#f0fdfa"
                            />

                            <ResumenCard
                                titulo="Pendiente acumulado"
                                valor={
                                    resumen.pendienteAcumulado
                                }
                                color="#b45309"
                                fondo="#fffbeb"
                            />

                            <ResumenCard
                                titulo="Surtible ahora"
                                valor={resumen.surtibleAhora}
                                color="#166534"
                                fondo="#f0fdf4"
                            />
                        </div>
                    )}
                    {recepcionPics === "NO_RECIBIDOS" ? (
                        <div style={resultsHeaderStyle}>
                            <div>
                                <h2 style={sectionTitleStyle}>
                                    Kits no recibidos
                                </h2>

                                <p style={resultsDescriptionStyle}>
                                    Seriales que PICS todavía marca
                                    como pendientes de recepción.
                                </p>
                            </div>

                            <span style={counterStyle}>
                                {kitsNoRecibidos.length.toLocaleString(
                                    "es-MX"
                                )}{" "}
                                kits
                            </span>
                        </div>
                    ) : (


                        <div style={resultsHeaderStyle}>
                            <div>
                                <h2 style={sectionTitleStyle}>
                                    Materiales disponibles para surtido
                                </h2>

                                <p style={resultsDescriptionStyle}>
                                    Consulta el requerimiento diario,
                                    la existencia física y los kits sin
                                    recepción registrada.
                                </p>
                            </div>

                            <span style={counterStyle}>
                                {materialesFiltrados.length.toLocaleString(
                                    "es-MX"
                                )}{" "}
                                materiales
                            </span>
                        </div>

                    {!proyecto ? (
                        <div style={emptyStyle}>
                            Selecciona un proyecto para
                            comenzar.
                        </div>
                    ) : !familia ? (
                        <div style={emptyStyle}>
                            Selecciona una familia del
                            proyecto {proyecto}.
                        </div>
                    ) : cargandoMateriales ? (
                        <div style={emptyStyle}>
                            Cargando disponibilidad de
                            materiales...
                        </div>
                    ) : materialesFiltrados.length ===
                        0 ? (
                        <div style={emptyStyle}>
                            No hay materiales que coincidan
                            con los filtros seleccionados.
                        </div>
                    ) : (
                        <div style={tableContainerStyle}>
                            <table style={tableStyle}>
                                <thead>
                                    <tr style={tableHeaderStyle}>
                                        <th style={thStyle}>
                                            Número de parte
                                        </th>

                                        <th style={thStyle}>
                                            Descripción
                                        </th>
                                        <th style={numericThStyle}>
                                            Requerido del día
                                        </th>

                                        <th style={numericThStyle}>
                                            Pendiente acumulado
                                        </th>

                                        <th style={numericThStyle}>
                                            Disponible físico
                                        </th>
                                        <th style={numericThStyle}>
                                            Cantidad de kits
                                        </th>

                                        <th style={thStyle}>
                                            Estado
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {materialesPaginados.map(
                                        (material) => {
                                            const colores =
                                                obtenerColorEstado(
                                                    material.estadoSurtido
                                                );

                                            const colorTipo =
                                                obtenerColorTipo(
                                                    material.tipoMaterial
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        material.idRequerimiento
                                                    }
                                                    tabIndex={0}
                                                    onClick={() => {
                                                        setMaterialSeleccionado(
                                                            material
                                                        );
                                                    }}
                                                    onKeyDown={(event) => {
                                                        if (
                                                            event.key === "Enter" ||
                                                            event.key === " "
                                                        ) {
                                                            event.preventDefault();

                                                            setMaterialSeleccionado(
                                                                material
                                                            );
                                                        }
                                                    }}
                                                    style={clickableRowStyle}
                                                    title="Haz clic para ver los detalles"
                                                >
                                                    <td style={tdStyle}>
                                                        <div style={materialCellStyle}>
                                                            <strong
                                                                style={materialNumberStyle}
                                                            >
                                                                {material.numeroMaterial}
                                                            </strong>

                                                            <span
                                                                style={{
                                                                    ...typeBadgeStyle,
                                                                    background:
                                                                        colorTipo.fondo,
                                                                    color:
                                                                        colorTipo.texto,
                                                                }}
                                                            >
                                                                {material.tipoMaterial ??
                                                                    "N/A"}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    <td style={tdStyle}>
                                                        {material.nombreMaterial ??
                                                            "Sin descripción"}
                                                    </td>

                                                    <td style={numericTdStyle}>
                                                        <strong>
                                                            {formatearCantidad(
                                                                material
                                                                    .cantidadRequeridaDia
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td style={numericTdStyle}>
                                                        <strong
                                                            style={{
                                                                color:
                                                                    material.cantidadPendienteAcumulada >
                                                                        0
                                                                        ? "#b45309"
                                                                        : "#166534",
                                                            }}
                                                        >
                                                            {formatearCantidad(
                                                                material
                                                                    .cantidadPendienteAcumulada
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td style={numericTdStyle}>
                                                        <strong
                                                            style={{
                                                                color:
                                                                    material.cantidadDisponible >
                                                                        0
                                                                        ? "#166534"
                                                                        : "#b91c1c",
                                                            }}
                                                        >
                                                            {formatearCantidad(
                                                                material
                                                                    .cantidadDisponible
                                                            )}
                                                        </strong>
                                                    </td>

                                                    <td style={numericTdStyle}>
                                                        <div style={kitsCellStyle}>
                                                            {material.kitsDisponibles >
                                                                0 && (
                                                                    <span
                                                                        style={kitsAvailableStyle}
                                                                    >
                                                                        {material.kitsDisponibles.toLocaleString(
                                                                            "es-MX"
                                                                        )}{" "}
                                                                        Kits
                                                                    </span>
                                                                )}

                                                        </div>
                                                    </td>

                                                    <td style={tdStyle}>
                                                        <span
                                                            style={{
                                                                ...statusBadgeStyle,
                                                                background:
                                                                    colores.fondo,
                                                                color:
                                                                    colores.texto,
                                                            }}
                                                        >
                                                            {obtenerTextoEstado(
                                                                material.estadoSurtido
                                                            )}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {proyecto &&
                        familia &&
                        !cargandoMateriales &&
                        materialesFiltrados.length >
                        0 && (
                            <div style={paginationStyle}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPagina(
                                            (paginaActual) =>
                                                Math.max(
                                                    1,
                                                    paginaActual - 1
                                                )
                                        );
                                    }}
                                    disabled={pagina <= 1}
                                    style={{
                                        ...paginationButtonStyle,

                                        opacity:
                                            pagina <= 1
                                                ? 0.5
                                                : 1,

                                        cursor:
                                            pagina <= 1
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    Anterior
                                </button>

                                <span style={paginationTextStyle}>
                                    Página {pagina} de{" "}
                                    {totalPaginas}
                                </span>

                                <span style={paginationRangeStyle}>
                                    Mostrando{" "}
                                    {(
                                        (pagina - 1) *
                                        tamanoPagina +
                                        1
                                    ).toLocaleString(
                                        "es-MX"
                                    )}
                                    {" - "}
                                    {Math.min(
                                        pagina * tamanoPagina,
                                        materialesFiltrados.length
                                    ).toLocaleString(
                                        "es-MX"
                                    )}{" "}
                                    de{" "}
                                    {materialesFiltrados.length.toLocaleString(
                                        "es-MX"
                                    )}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setPagina(
                                            (paginaActual) =>
                                                Math.min(
                                                    totalPaginas,
                                                    paginaActual + 1
                                                )
                                        );
                                    }}
                                    disabled={
                                        pagina >= totalPaginas
                                    }
                                    style={{
                                        ...paginationButtonStyle,

                                        opacity:
                                            pagina >= totalPaginas
                                                ? 0.5
                                                : 1,

                                        cursor:
                                            pagina >= totalPaginas
                                                ? "not-allowed"
                                                : "pointer",
                                    }}
                                >
                                    Siguiente
                                </button>
                            </div>
                        )}
                </section>
                {materialSeleccionado && (
                    <div
                        style={modalOverlayStyle}
                        role="presentation"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setMaterialSeleccionado(
                                    null
                                );
                            }
                        }}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="detalleMaterialTitulo"
                            style={modalStyle}
                            onMouseDown={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <header style={modalHeaderStyle}>
                                <div>
                                    <span style={modalEyebrowStyle}>
                                        Detalle del material
                                    </span>

                                    <h2
                                        id="detalleMaterialTitulo"
                                        style={modalTitleStyle}
                                    >
                                        {
                                            materialSeleccionado
                                                .numeroMaterial
                                        }
                                    </h2>

                                    <p style={modalDescriptionStyle}>
                                        {materialSeleccionado
                                            .nombreMaterial ??
                                            "Sin descripción"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Cerrar detalle"
                                    onClick={() => {
                                        setMaterialSeleccionado(
                                            null
                                        );
                                    }}
                                    style={modalCloseStyle}
                                >
                                    ×
                                </button>
                            </header>

                            <div style={modalGeneralGridStyle}>
                                <DetalleTexto
                                    etiqueta="Fecha"
                                    valor={formatearFecha(
                                        materialSeleccionado.fecha
                                    )}
                                />

                                <DetalleTexto
                                    etiqueta="Requisición"
                                    valor={
                                        materialSeleccionado
                                            .numeroRequisicion
                                    }
                                />

                                <DetalleTexto
                                    etiqueta="Proyecto"
                                    valor={
                                        materialSeleccionado
                                            .proyecto
                                    }
                                />

                                <DetalleTexto
                                    etiqueta="Familia"
                                    valor={
                                        materialSeleccionado
                                            .familia
                                    }
                                />

                                <DetalleTexto
                                    etiqueta="Tipo"
                                    valor={
                                        materialSeleccionado
                                            .tipoMaterial ??
                                        "Sin clasificar"
                                    }
                                />

                                <DetalleTexto
                                    etiqueta="Estado"
                                    valor={obtenerTextoEstado(
                                        materialSeleccionado
                                            .estadoSurtido
                                    )}
                                />
                            </div>

                            <div style={modalQuantityGridStyle}>
                                <DetalleCantidad
                                    etiqueta="Requerido del día"
                                    valor={
                                        materialSeleccionado
                                            .cantidadRequeridaDia
                                    }
                                    color="#1d4ed8"
                                />
                                <DetalleCantidad
                                    etiqueta="Surtido registrado"
                                    valor={
                                        materialSeleccionado
                                            .cantidadSurtidaAcumulada
                                    }
                                    color="#0f766e"
                                />

                                {materialSeleccionado
                                    .cantidadPendienteAcumulada > 0 && (
                                        <DetalleCantidad
                                            etiqueta="Surtido Pendiente"
                                            valor={
                                                materialSeleccionado
                                                    .cantidadPendienteAcumulada
                                            }
                                            color="#b45309"
                                        />
                                    )}

                                <DetalleCantidad
                                    etiqueta="Disponible físico"
                                    valor={
                                        materialSeleccionado
                                            .cantidadDisponible
                                    }
                                    color="#166534"
                                />
                                {obtenerFaltante(
                                    materialSeleccionado
                                ) > 0 && (
                                        <DetalleCantidad
                                            etiqueta="Faltante"
                                            valor={obtenerFaltante(
                                                materialSeleccionado
                                            )}
                                            color="#b91c1c"
                                        />
                                    )}
                            </div>

                            <div style={modalKitSectionStyle}>
                                <h3 style={modalSectionTitleStyle}>
                                    Kits físicos PICS
                                </h3>

                                <div style={modalGeneralGridStyle}>
                                    <DetalleTexto
                                        etiqueta="Kits disponibles"
                                        valor={materialSeleccionado
                                            .kitsDisponibles
                                            .toLocaleString(
                                                "es-MX"
                                            )}
                                    />

                                    <DetalleTexto
                                        etiqueta="Kits no recibidos"
                                        valor={materialSeleccionado
                                            .kitsNoRecibidos
                                            .toLocaleString(
                                                "es-MX"
                                            )}
                                    />

                                    <DetalleTexto
                                        etiqueta="Cantidad no recibida"
                                        valor={formatearCantidad(
                                            materialSeleccionado
                                                .cantidadNoRecibida
                                        )}
                                    />
                                </div>
                            </div>

                            <div
                                style={{
                                    ...modalNoticeStyle,
                                    ...obtenerEstiloAviso(
                                        materialSeleccionado
                                    ),
                                }}
                            >
                                {obtenerMensajeOperativo(
                                    materialSeleccionado
                                )}
                            </div>

                            <div style={modalActionsStyle}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMaterialSeleccionado(
                                            null
                                        );
                                    }}
                                    style={modalActionStyle}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {mostrarImportacionKits && (
                    <div style={modalOverlayStyle}>
                        <section style={modalStyle}>
                            <header style={modalHeaderStyle}>
                                <div>
                                    <h2 style={modalTitleStyle}>
                                        Importar PICS
                                    </h2>

                                    <p style={modalDescriptionStyle}>
                                        Importa el reporte PICSFR010
                                        con seriales, materiales,
                                        cantidades y estados de recepción.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={
                                        cerrarImportacionKits
                                    }
                                    disabled={importandoKits}
                                    aria-label="Cerrar"
                                    style={modalCloseStyle}
                                >
                                    ×
                                </button>
                            </header>

                            <form
                                onSubmit={
                                    ejecutarImportacionKits
                                }
                            >
                                <div style={formGroupFullStyle}>
                                    <label
                                        htmlFor="archivoPICS"
                                        style={labelStyle}
                                    >
                                        Archivo PICSFR010 *
                                    </label>

                                    <input
                                        id="archivoPICS"
                                        type="file"
                                        accept=".xlsx"
                                        disabled={importandoKits}
                                        style={inputStyle}
                                        onChange={(event) => {
                                            const archivo =
                                                event.target
                                                    .files?.[0] ??
                                                null;

                                            setArchivoKits(
                                                archivo
                                            );

                                            setResultadoImportacionKits(
                                                null
                                            );

                                            setErrorImportacionKits(
                                                ""
                                            );

                                            setMensajeImportacionKits(
                                                ""
                                            );
                                        }}
                                    />

                                    <small style={helpTextStyle}>
                                        El archivo debe contener
                                        PICSFR010 o PICSFR010_1.
                                    </small>
                                </div>

                                {archivoKits && (
                                    <div style={selectedFileStyle}>
                                        Archivo seleccionado:{" "}
                                        <strong>
                                            {archivoKits.name}
                                        </strong>
                                    </div>
                                )}

                                {errorImportacionKits && (
                                    <div style={errorStyle}>
                                        {errorImportacionKits}
                                    </div>
                                )}

                                {importandoKits && (
                                    <div style={importMessageStyle}>
                                        Importando PICS. No cierres
                                        esta ventana.
                                    </div>
                                )}

                                {mensajeImportacionKits && (
                                    <div style={successImportStyle}>
                                        {mensajeImportacionKits}
                                    </div>
                                )}

                                {resultadoImportacionKits && (
                                    <div style={importResultStyle}>
                                        <h3
                                            style={
                                                importResultTitleStyle
                                            }
                                        >
                                            Resultado de la importación
                                        </h3>

                                        <div style={importSummaryStyle}>
                                            <span>
                                                Total:{" "}
                                                <strong>
                                                    {
                                                        resultadoImportacionKits
                                                            .totalFilas
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Correctas:{" "}
                                                <strong>
                                                    {
                                                        resultadoImportacionKits
                                                            .filasCorrectas
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Errores:{" "}
                                                <strong>
                                                    {
                                                        resultadoImportacionKits
                                                            .filasConError
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Creados:{" "}
                                                <strong>
                                                    {
                                                        resultadoImportacionKits
                                                            .kitsCreados
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Actualizados:{" "}
                                                <strong>
                                                    {
                                                        resultadoImportacionKits
                                                            .kitsActualizados
                                                    }
                                                </strong>
                                            </span>

                                            <span>
                                                Sin cambios:{" "}
                                                <strong>
                                                    {
                                                        resultadoImportacionKits
                                                            .kitsSinCambios
                                                    }
                                                </strong>
                                            </span>
                                        </div>

                                        {resultadoImportacionKits
                                            .errores.length > 0 && (
                                                <details
                                                    style={
                                                        importDetailsErrorStyle
                                                    }
                                                >
                                                    <summary
                                                        style={
                                                            importDetailsSummaryStyle
                                                        }
                                                    >
                                                        Ver errores (
                                                        {
                                                            resultadoImportacionKits
                                                                .errores.length
                                                        }
                                                        )
                                                    </summary>

                                                    <div
                                                        style={
                                                            importTableContainerStyle
                                                        }
                                                    >
                                                        <table
                                                            style={
                                                                importTableStyle
                                                            }
                                                        >
                                                            <thead>
                                                                <tr>
                                                                    <th
                                                                        style={
                                                                            importTableHeaderStyle
                                                                        }
                                                                    >
                                                                        Hoja
                                                                    </th>

                                                                    <th
                                                                        style={
                                                                            importTableHeaderStyle
                                                                        }
                                                                    >
                                                                        Fila
                                                                    </th>

                                                                    <th
                                                                        style={
                                                                            importTableHeaderStyle
                                                                        }
                                                                    >
                                                                        Error
                                                                    </th>
                                                                </tr>
                                                            </thead>

                                                            <tbody>
                                                                {resultadoImportacionKits
                                                                    .errores.map(
                                                                        (
                                                                            errorFila,
                                                                            indice
                                                                        ) => (
                                                                            <tr
                                                                                key={
                                                                                    `${errorFila.hoja}-` +
                                                                                    `${errorFila.numeroFila}-` +
                                                                                    `${indice}`
                                                                                }
                                                                            >
                                                                                <td
                                                                                    style={
                                                                                        importTableCellStyle
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        errorFila.hoja
                                                                                    }
                                                                                </td>

                                                                                <td
                                                                                    style={
                                                                                        importTableCellStyle
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        errorFila.numeroFila
                                                                                    }
                                                                                </td>

                                                                                <td
                                                                                    style={
                                                                                        importTableCellStyle
                                                                                    }
                                                                                >
                                                                                    {
                                                                                        errorFila.mensaje
                                                                                    }
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
                                        onClick={
                                            cerrarImportacionKits
                                        }
                                        disabled={importandoKits}
                                        style={secondaryButtonStyle}
                                    >
                                        Cerrar
                                    </button>

                                    {!resultadoImportacionKits && (
                                        <button
                                            type="submit"
                                            disabled={
                                                importandoKits ||
                                                !archivoKits
                                            }
                                            style={{
                                                ...importKitsButtonStyle,

                                                opacity:
                                                    importandoKits ||
                                                        !archivoKits
                                                        ? 0.55
                                                        : 1,

                                                cursor:
                                                    importandoKits ||
                                                        !archivoKits
                                                        ? "not-allowed"
                                                        : "pointer",
                                            }}
                                        >
                                            {importandoKits
                                                ? "Importando..."
                                                : "Importar PICS"}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </section>
                    </div>
                )}




            </div>
        </Layout>
    );
}
interface DetalleTextoProps {
    etiqueta: string;
    valor: string;
}

function DetalleTexto({
    etiqueta,
    valor,
}: DetalleTextoProps) {
    return (
        <div style={modalDetailCardStyle}>
            <span style={modalLabelStyle}>
                {etiqueta}
            </span>

            <strong style={modalTextValueStyle}>
                {valor}
            </strong>
        </div>
    );
}

interface DetalleCantidadProps {
    etiqueta: string;
    valor: number;
    color: string;
}

function DetalleCantidad({
    etiqueta,
    valor,
    color,
}: DetalleCantidadProps) {
    return (
        <div style={modalDetailCardStyle}>
            <span style={modalLabelStyle}>
                {etiqueta}
            </span>

            <strong
                style={{
                    ...modalQuantityValueStyle,
                    color,
                }}
            >
                {formatearCantidad(valor)}
            </strong>
        </div>
    );
}

interface ResumenCardProps {
    titulo: string;
    valor: number;
    color: string;
    fondo: string;
}

function ResumenCard({
    titulo,
    valor,
    color,
    fondo,
}: ResumenCardProps) {
    return (
        <div
            style={{
                ...summaryCardStyle,
                background: fondo,
            }}
        >
            <span style={summaryLabelStyle}>
                {titulo}
            </span>

            <strong
                style={{
                    ...summaryValueStyle,
                    color,
                }}
            >
                {formatearCantidad(valor)}
            </strong>
        </div>
    );
}

function formatearFecha(
    valor: string
) {
    if (!valor) {
        return "";
    }

    const [
        anio,
        mes,
        dia,
    ] = valor
        .slice(0, 10)
        .split("-");

    return `${dia}/${mes}/${anio}`;
}

// Calcula cuánto no puede cubrirse
// con la existencia física actual.
function obtenerFaltante(
    material: MaterialSurtidoMrp
) {
    return Math.max(
        material.cantidadPendienteAcumulada -
        material.cantidadDisponible,
        0
    );
}

// Calcula el saldo que quedaría después
// de cubrir el pendiente del día.
function obtenerSaldoRestante(
    material: MaterialSurtidoMrp
) {
    return Math.max(
        material.cantidadDisponible -
        material.cantidadPendienteAcumulada,
        0
    );
}

function formatearCantidad(
    cantidad: number
) {
    return cantidad.toLocaleString(
        "es-MX",
        {
            maximumFractionDigits: 4,
        }
    );
}

function normalizarTexto(
    texto: string | null | undefined
) {
    return (
        texto
            ?.trim()
            .toUpperCase()
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            ) ?? ""
    );
}
function obtenerTextoEstado(
    estado: EstadoAbastecimiento
) {
    switch (estado) {
        case "COMPLETADO":
            return "Completado";

        case "DISPONIBLE":
            return "Disponible";

        case "DISPONIBLE_PARCIAL":
            return "Disponible parcial";

        case "NO_RECIBIDO":
            return "No recibido";

        case "SIN_KITS":
            return "Sin kits";

        default:
            return estado;
    }
}


function obtenerColorTipo(
    tipo:
        | "C"
        | "P"
        | "S"
        | "W"
        | null
) {
    switch (tipo) {
        case "C":
            return {
                fondo: "#dbeafe",
                texto: "#1d4ed8",
            };

        case "P":
            return {
                fondo: "#fef3c7",
                texto: "#92400e",
            };

        case "S":
            return {
                fondo: "#dcfce7",
                texto: "#166534",
            };

        case "W":
            return {
                fondo: "#f3e8ff",
                texto: "#7e22ce",
            };

        default:
            return {
                fondo: "#f1f5f9",
                texto: "#64748b",
            };
    }
}
function obtenerColorEstado(
    estado: EstadoAbastecimiento
) {
    switch (estado) {
        case "COMPLETADO":
            return {
                fondo: "#e0f2fe",
                texto: "#0369a1",
            };

        case "DISPONIBLE":
            return {
                fondo: "#dcfce7",
                texto: "#166534",
            };

        case "DISPONIBLE_PARCIAL":
            return {
                fondo: "#fef3c7",
                texto: "#92400e",
            };

        case "NO_RECIBIDO":
            return {
                fondo: "#dbeafe",
                texto: "#1d4ed8",
            };

        case "SIN_KITS":
            return {
                fondo: "#fee2e2",
                texto: "#b91c1c",
            };

        default:
            return {
                fondo: "#f1f5f9",
                texto: "#475569",
            };
    }
}
function obtenerMensajeOperativo(
    material: MaterialSurtidoMrp
) {
    if (
        material.estadoSurtido ===
        "COMPLETADO"
    ) {
        return (
            "El requerimiento de este material " +
            "ya está completado para esta fecha."
        );
    }

    if (
        material.estadoSurtido ===
        "DISPONIBLE"
    ) {
        return (
            `Se pueden surtir ${formatearCantidad(
                material.cantidadSurtibleAcumulada
            )} para completar el pendiente del día.`
        );
    }

    if (
        material.estadoSurtido ===
        "DISPONIBLE_PARCIAL"
    ) {
        return (
            `Se pueden surtir ${formatearCantidad(
                material.cantidadSurtibleAcumulada
            )}. La existencia física no cubre todo el pendiente.`
        );
    }

    if (
        material.estadoSurtido ===
        "NO_RECIBIDO"
    ) {
        return (
            "Este material no puede surtirse. " +
            `PICS registra ${formatearCantidad(
                material.cantidadNoRecibida
            )} en ${material.kitsNoRecibidos.toLocaleString(
                "es-MX"
            )} kits sin recepción.`
        );
    }

    return (
        "El MRP requiere este material, pero " +
        "no existen kits registrados en PICS."
    );
}
function obtenerEstiloAviso(
    material: MaterialSurtidoMrp
) {
    if (
        material.estadoSurtido ===
        "COMPLETADO"
    ) {
        return {
            border: "1px solid #bae6fd",
            background: "#f0f9ff",
            color: "#0369a1",
        };
    }

    if (
        material.estadoSurtido ===
        "DISPONIBLE"
    ) {
        return {
            border: "1px solid #bbf7d0",
            background: "#f0fdf4",
            color: "#166534",
        };
    }

    if (
        material.estadoSurtido ===
        "DISPONIBLE_PARCIAL"
    ) {
        return {
            border: "1px solid #fde68a",
            background: "#fffbeb",
            color: "#92400e",
        };
    }

    if (
        material.estadoSurtido ===
        "NO_RECIBIDO"
    ) {
        return {
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            color: "#1d4ed8",
        };
    }

    return {
        border: "1px solid #fecaca",
        background: "#fef2f2",
        color: "#b91c1c",
    };
}

function obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string
) {
    if (axios.isAxiosError(error)) {
        const mensaje =
            error.response
                ?.data?.mensaje;

        if (
            typeof mensaje === "string"
        ) {
            return mensaje;
        }

        const detalle =
            error.response
                ?.data?.detail;

        if (
            typeof detalle === "string"
        ) {
            return detalle;
        }

        if (
            error.response?.status === 401
        ) {
            return "La sesión no es válida.";
        }

        if (
            error.response?.status === 403
        ) {
            return "No tienes permiso para consultar este módulo.";
        }
    }

    return mensajePredeterminado;
}






const pageContainerStyle = {
    width: "100%",
    maxWidth: "1500px",
    margin: "0 auto",
};

const cardStyle = {
    padding: "28px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
        "0 4px 18px rgba(15, 23, 42, 0.08)",
};

const headerStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "16px",
    marginBottom: "20px",
};

const titleStyle = {
    margin: 0,
    color: "#102957",
    fontSize: "29px",
};

const descriptionStyle = {
    maxWidth: "720px",
    margin: "7px 0 0",
    color: "#64748b",
    lineHeight: 1.5,
};

const consultaBadgeStyle = {
    padding: "8px 13px",
    borderRadius: "999px",
    background: "#e0f2fe",
    color: "#0369a1",
    fontSize: "12px",
    fontWeight: "900",
};

const errorStyle = {
    marginBottom: "16px",
    padding: "13px 15px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#991b1b",
    fontWeight: "700",
};

const filtersStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(190px, 1fr))",
    alignItems: "end",
    gap: "12px",
    marginBottom: "20px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "11px",
    background: "#f8fafc",
};

const formGroupStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    minWidth: 0,
};

const labelStyle = {
    color: "#17335f",
    fontSize: "12px",
    fontWeight: "800",
};

const inputStyle = {
    width: "100%",
    minWidth: 0,
    minHeight: "42px",
    boxSizing: "border-box" as const,
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#102957",
    fontSize: "13px",
};

const filterActionsStyle = {
    display: "flex",
    alignItems: "flex-end",
};

const secondaryButtonStyle = {
    width: "100%",
    minHeight: "42px",
    padding: "8px 15px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: "800",
    cursor: "pointer",
};

const selectionStyle = {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: "18px",
    marginBottom: "16px",
    padding: "12px 15px",
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#1e3a8a",
};

const selectionLabelStyle = {
    display: "block",
    marginBottom: "3px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase" as const,
};

const summaryGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(155px, 1fr))",
    gap: "11px",
    marginBottom: "23px",
};

const summaryCardStyle = {
    minHeight: "85px",
    boxSizing: "border-box" as const,
    padding: "14px",
    borderRadius: "10px",
};

const summaryLabelStyle = {
    display: "block",
    marginBottom: "8px",
    color: "#475569",
    fontSize: "12px",
    fontWeight: "800",
};

const summaryValueStyle = {
    display: "block",
    fontSize: "22px",
};

const resultsHeaderStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap" as const,
    gap: "12px",
    marginBottom: "12px",
};

const sectionTitleStyle = {
    margin: 0,
    color: "#102957",
    fontSize: "20px",
};

const resultsDescriptionStyle = {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
};

const counterStyle = {
    padding: "7px 12px",
    borderRadius: "999px",
    background: "#dbeafe",
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
    minWidth: "850px",
    borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
    background: "#f1f5f9",
};

const thStyle = {
    padding: "11px",
    borderBottom: "2px solid #cbd5e1",
    color: "#102957",
    fontSize: "12px",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
};

const numericThStyle = {
    ...thStyle,
    textAlign: "right" as const,
};

const tdStyle = {
    padding: "11px",
    borderBottom: "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "13px",
};

const numericTdStyle = {
    ...tdStyle,
    textAlign: "right" as const,
    whiteSpace: "nowrap" as const,
};

const statusBadgeStyle = {
    display: "inline-block",
    minWidth: "92px",
    boxSizing: "border-box" as const,
    padding: "6px 9px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};

const emptyStyle = {
    padding: "35px",
    border: "1px dashed #cbd5e1",
    borderRadius: "10px",
    background: "#f8fafc",
    color: "#64748b",
    textAlign: "center" as const,
};


const clickableRowStyle = {
    cursor: "pointer",
    transition:
        "background-color 0.15s ease",
};

const materialCellStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
};

const materialNumberStyle = {
    color: "#102957",
    fontSize: "14px",
};

const typeBadgeStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "27px",
    height: "27px",
    padding: "0 7px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900",
};



const modalOverlayStyle = {
    position: "fixed" as const,
    inset: 0,
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background:
        "rgba(15, 23, 42, 0.6)",
};

const modalStyle = {
    width: "100%",
    maxWidth: "780px",
    maxHeight: "92vh",
    overflowY: "auto" as const,
    boxSizing: "border-box" as const,
    padding: "25px",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
        "0 25px 70px rgba(15, 23, 42, 0.35)",
};

const modalHeaderStyle = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "16px",
    marginBottom: "20px",
};

const modalEyebrowStyle = {
    display: "block",
    marginBottom: "5px",
    color: "#1d4ed8",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase" as const,
};

const modalTitleStyle = {
    margin: 0,
    color: "#102957",
    fontSize: "25px",
};

const modalDescriptionStyle = {
    margin: "6px 0 0",
    color: "#64748b",
    lineHeight: 1.45,
};

const modalCloseStyle = {
    width: "38px",
    height: "38px",
    flexShrink: 0,
    padding: 0,
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#475569",
    fontSize: "24px",
    lineHeight: 1,
    cursor: "pointer",
};

const modalGeneralGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "11px",
    marginBottom: "18px",
};

const modalQuantityGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(170px, 1fr))",
    gap: "11px",
    marginBottom: "18px",
};

const modalDetailCardStyle = {
    minWidth: 0,
    padding: "13px",
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
    background: "#f8fafc",
};

const modalLabelStyle = {
    display: "block",
    marginBottom: "6px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase" as const,
};

const modalTextValueStyle = {
    display: "block",
    color: "#102957",
    fontSize: "14px",
    overflowWrap: "anywhere" as const,
};

const modalQuantityValueStyle = {
    display: "block",
    fontSize: "20px",
};

const modalKitSectionStyle = {
    marginTop: "4px",
    marginBottom: "18px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "11px",
    background: "#ffffff",
};

const modalSectionTitleStyle = {
    margin: "0 0 13px",
    color: "#102957",
    fontSize: "16px",
};

const modalNoticeStyle = {
    padding: "14px 16px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: 1.5,
};

const modalActionsStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: "20px",
};

const modalActionStyle = {
    minHeight: "42px",
    padding: "9px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#102957",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
};


const multiSelectContainerStyle = {
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    minWidth: 0,
};

const multiSelectButtonStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px",
    width: "100%",
    minHeight: "42px",
    boxSizing: "border-box" as const,
    padding: "8px 10px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#102957",
    fontSize: "13px",
    textAlign: "left" as const,
};

const multiSelectArrowStyle = {
    display: "inline-block",
    color: "#475569",
    fontSize: "10px",
    transition:
        "transform 0.15s ease",
};

const multiSelectMenuStyle = {
    position: "absolute" as const,
    top: "calc(100% + 5px)",
    left: 0,
    zIndex: 100,
    width: "100%",
    minWidth: "175px",
    boxSizing: "border-box" as const,
    padding: "7px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    boxShadow:
        "0 10px 24px rgba(15, 23, 42, 0.16)",
};

const multiSelectOptionStyle = {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: "8px",
    borderRadius: "6px",
    color: "#102957",
    fontSize: "13px",
    cursor: "pointer",
};

const multiSelectSeparatorStyle = {
    height: "1px",
    margin: "4px 0",
    background: "#e2e8f0",
};

const paginationStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap" as const,
    gap: "12px",
    marginTop: "18px",
    paddingTop: "15px",
    borderTop: "1px solid #e2e8f0",
};

const paginationButtonStyle = {
    minHeight: "40px",
    padding: "8px 16px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    background: "#ffffff",
    color: "#102957",
    fontSize: "13px",
    fontWeight: "800",
};

const paginationTextStyle = {
    color: "#102957",
    fontSize: "13px",
    fontWeight: "800",
};

const paginationRangeStyle = {
    color: "#64748b",
    fontSize: "12px",
};


const withoutKitsStyle = {
    color: "#94a3b8",
    fontWeight: "700",
    textAlign: "center" as const,


};

const kitsCellStyle = {
    display: "flex",
    alignItems: "flex-end",
    flexDirection: "column" as const,
    gap: "5px",
};

const kitsAvailableStyle = {
    display: "inline-block",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "11px",
    fontWeight: "900",
    whiteSpace: "nowrap" as const,
};


const headerActionsStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    flexWrap: "wrap" as const,
    gap: "10px",
};

const importKitsButtonStyle = {
    minHeight: "40px",
    padding: "8px 15px",
    border: "1px solid #1d4ed8",
    borderRadius: "8px",
    background: "#1d4ed8",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "800",
    cursor: "pointer",
};

const formGroupFullStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "7px",
    width: "100%",
};

const helpTextStyle = {
    color: "#64748b",
    fontSize: "12px",
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

const importMessageStyle = {
    marginTop: "16px",
    padding: "14px",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#64748b",
    textAlign: "center" as const,
};

const successImportStyle = {
    marginTop: "16px",
    padding: "13px 15px",
    border: "1px solid #bbf7d0",
    borderRadius: "9px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "700",
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

const importDetailsErrorStyle = {
    marginTop: "14px",
    border: "1px solid #fecaca",
    borderRadius: "9px",
    background: "#fef2f2",
    color: "#991b1b",
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