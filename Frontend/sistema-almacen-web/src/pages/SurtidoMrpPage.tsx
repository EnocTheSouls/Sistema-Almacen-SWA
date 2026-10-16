import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import type {
    CSSProperties,
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
    obtenerKitsIndividualesMrp,
    obtenerKitsNoRecibidosMrp,
    obtenerMaterialesSurtidoMrp,
    obtenerProyectosSurtidoMrp,
} from "../services/surtidoMrpService";

import type {
    EstadoAbastecimiento,
    KitIndividualMrp,
    KitNoRecibidoMrp,
    MaterialSurtidoMrp,
} from "../services/surtidoMrpService";

import {
    importarMaterialKits,
} from "../services/materialKitService";

const SURTIDO_MRP_FILTROS_KEY =
    "surtido_mrp_filtros";

interface FiltrosGuardadosSurtidoMrp {
    fecha: string;
    proyecto: string;
    familia: string;
    busqueda: string;
    estado: EstadoAbastecimiento | "";
    tiposMaterial: string[];
    recepcionPics: string;
}

interface MaterialNoRecibidoAgrupado {
    numeroMaterial: string;
    nombreMaterial: string | null;

    tipoMaterial:
    | "C"
    | "P"
    | "S"
    | "W"
    | null;

    cantidadRequeridaDia: number;

    totalKits: number;
    cantidadTotal: number;
}



function obtenerFiltrosGuardados():
    FiltrosGuardadosSurtidoMrp {
    const filtrosPredeterminados:
        FiltrosGuardadosSurtidoMrp = {
        fecha: "",
        proyecto: "",
        familia: "",
        busqueda: "",
        estado: "",
        tiposMaterial: [],
        recepcionPics: "",
    };

    try {
        const filtrosJson =
            localStorage.getItem(
                SURTIDO_MRP_FILTROS_KEY
            );

        if (!filtrosJson) {
            return filtrosPredeterminados;
        }

        const filtros =
            JSON.parse(
                filtrosJson
            ) as Partial<
                FiltrosGuardadosSurtidoMrp
            >;

        return {
            fecha:
                typeof filtros.fecha === "string"
                    ? filtros.fecha
                    : "",

            proyecto:
                typeof filtros.proyecto === "string"
                    ? filtros.proyecto
                    : "",

            familia:
                typeof filtros.familia === "string"
                    ? filtros.familia
                    : "",

            busqueda:
                typeof filtros.busqueda === "string"
                    ? filtros.busqueda
                    : "",

            estado:
                typeof filtros.estado === "string"
                    ? filtros.estado as
                    | EstadoAbastecimiento
                    | ""
                    : "",

            tiposMaterial:
                Array.isArray(
                    filtros.tiposMaterial
                )
                    ? filtros.tiposMaterial
                    : [],

            recepcionPics:
                typeof filtros.recepcionPics ===
                    "string"
                    ? filtros.recepcionPics
                    : "",
        };
    } catch {
        localStorage.removeItem(
            SURTIDO_MRP_FILTROS_KEY
        );

        return filtrosPredeterminados;
    }
}

// Devuelve la fecha local en formato YYYY-MM-DD.
function obtenerFechaActualLocal() {
    const hoy = new Date();

    const anio =
        hoy.getFullYear();

    const mes =
        String(
            hoy.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            hoy.getDate()
        ).padStart(2, "0");

    return `${anio}-${mes}-${dia}`;
}


export function SurtidoMrpPage() {

    const filtrosGuardadosRef =
        useRef(
            obtenerFiltrosGuardados()
        );

    const filtrosGuardados =
        filtrosGuardadosRef.current;


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
    ] = useState(
        filtrosGuardados.proyecto
    );

    const [
        familia,
        setFamilia,
    ] = useState(
        filtrosGuardados.familia
    );

    const [
        busqueda,
        setBusqueda,
    ] = useState(
        filtrosGuardados.busqueda
    );

    const [
        estado,
        setEstado,
    ] = useState<
        EstadoAbastecimiento | ""
    >(
        filtrosGuardados.estado
    );

    const [
        tiposMaterial,
        setTiposMaterial,
    ] = useState<string[]>(
        filtrosGuardados.tiposMaterial
    );

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

    const tamanoPaginaKits = 20;

    const [
        paginaKitsIndividuales,
        setPaginaKitsIndividuales,
    ] = useState(1);

    const [
        paginaKitsNoRecibidos,
        setPaginaKitsNoRecibidos,
    ] = useState(1);

    const [
        materialSeleccionado,
        setMaterialSeleccionado,
    ] = useState<
        MaterialSurtidoMrp | null
    >(null);

    const [
        mostrarDetalleKits,
        setMostrarDetalleKits,
    ] = useState(false);

    const [
        kitsDetalleMaterial,
        setKitsDetalleMaterial,
    ] = useState<KitIndividualMrp[]>([]);

    const [
        cargandoDetalleKits,
        setCargandoDetalleKits,
    ] = useState(false);

    const [
        errorDetalleKits,
        setErrorDetalleKits,
    ] = useState("");

    const [
        kitDetalleSeleccionado,
        setKitDetalleSeleccionado,
    ] = useState<KitIndividualMrp | null>(
        null
    );



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
    ] = useState(
        filtrosGuardados.fecha
    );

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
    ] = useState(
        filtrosGuardados.recepcionPics
    );

    const [
        kitsNoRecibidos,
        setKitsNoRecibidos,
    ] = useState<KitNoRecibidoMrp[]>([]);

    const [
        ,
        setKitNoRecibidoSeleccionado,
    ] = useState<KitNoRecibidoMrp | null>(
        null
    );

    const [
        cargandoKitsNoRecibidos,
        setCargandoKitsNoRecibidos,
    ] = useState(false);


    const [
        kitsIndividuales,
        setKitsIndividuales,
    ] = useState<KitIndividualMrp[]>([]);

    const [
        cargandoKitsIndividuales,
        setCargandoKitsIndividuales,
    ] = useState(false);

    const [
        errorKitsIndividuales,
        setErrorKitsIndividuales,
    ] = useState("");

    const [
        ,
        setKitIndividualSeleccionado,
    ] = useState<KitIndividualMrp | null>(
        null
    );


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

                setKitDetalleSeleccionado(
                    null
                );

                setMostrarDetalleKits(false);
                setKitsDetalleMaterial([]);
                setErrorDetalleKits("");

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

    // Conserva los filtros al navegar
    // entre páginas del sistema.
    useEffect(() => {
        const filtros:
            FiltrosGuardadosSurtidoMrp = {
            fecha,
            proyecto,
            familia,
            busqueda,
            estado,
            tiposMaterial,
            recepcionPics,
        };

        localStorage.setItem(
            SURTIDO_MRP_FILTROS_KEY,
            JSON.stringify(
                filtros
            )
        );
    }, [
        fecha,
        proyecto,
        familia,
        busqueda,
        estado,
        tiposMaterial,
        recepcionPics,
    ]);




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

                    if (datos.length === 0) {
                        setFecha("");

                        return;
                    }
                    setFecha(
                        (fechaGuardada) => {
                            const fechaActual =
                                obtenerFechaActualLocal();

                            // Conserva la fecha guardada
                            // si todavía está disponible.
                            if (
                                fechaGuardada &&
                                datos.includes(
                                    fechaGuardada
                                )
                            ) {
                                return fechaGuardada;
                            }

                            // En una sesión nueva selecciona
                            // automáticamente la fecha de hoy.
                            if (
                                datos.includes(
                                    fechaActual
                                )
                            ) {
                                return fechaActual;
                            }

                            // Si hoy no está disponible,
                            // selecciona la primera fecha.
                            return [...datos].sort()[0];
                        }
                    );



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

                    setMateriales([]);
                    setMaterialSeleccionado(null);
                    setPagina(1);

                    const datos =
                        await obtenerProyectosSurtidoMrp(
                            fecha
                        );

                    setProyectos(datos);

                    setProyecto(
                        (proyectoActual) => {
                            if (
                                proyectoActual &&
                                datos.includes(
                                    proyectoActual
                                )
                            ) {
                                return proyectoActual;
                            }

                            return "";
                        }
                    );
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
        // En las vistas normales se requiere
        // fecha y proyecto seleccionados.
        //
        // En No recibido, proyecto vacío
        // significa Todos los proyectos.
        if (
            !fecha ||
            (
                !proyecto &&
                estado !== "NO_RECIBIDO"
            )
        ) {
            setFamilias([]);
            setFamilia("");


            return;
        }
        const cargarFamilias =
            async () => {
                try {
                    setCargandoFamilias(true);
                    setError("");

                    const datos =
                        await obtenerFamiliasSurtidoMrp(
                            fecha,
                            proyecto
                        );

                    setFamilias(datos);

                    setFamilia(
                        (familiaActual) => {
                            if (
                                estado === "NO_RECIBIDO" &&
                                !familiaActual
                            ) {
                                return "";
                            }

                            if (
                                familiaActual &&
                                datos.includes(
                                    familiaActual
                                )
                            ) {
                                return familiaActual;
                            }

                            return "";
                        }
                    );
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar familias:",
                        errorCarga
                    );

                    setFamilias([]);
                    setFamilia("");

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
        estado,
    ]);
    // Carga los materiales cuando
    // se completa proyecto y familia.
    useEffect(() => {
        if (
            estado === "NO_RECIBIDO"
        ) {
            return;
        }

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
        estado,
    ]);








    // Carga únicamente los seriales que PICS
    // todavía marca como no recibidos.
    useEffect(() => {
        if (
            estado !== "NO_RECIBIDO" ||
            !fecha
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
        estado,
        fecha,
        proyecto,
        familia,
    ]);
    // Carga todos los kits PICS
    // separados por número de serie.
    useEffect(() => {
        if (
            recepcionPics !==
            "KITS_INDIVIDUALES" ||
            !fecha ||
            !proyecto ||
            !familia
        ) {
            setKitsIndividuales([]);
            setErrorKitsIndividuales("");

            return;
        }

        const cargarKitsIndividuales =
            async () => {
                try {
                    setCargandoKitsIndividuales(
                        true
                    );

                    setErrorKitsIndividuales("");

                    const datos =
                        await obtenerKitsIndividualesMrp(
                            fecha,
                            proyecto,
                            familia
                        );

                    setKitsIndividuales(
                        datos
                    );
                } catch (errorCarga) {
                    console.error(
                        "Error al cargar kits individuales:",
                        errorCarga
                    );

                    setKitsIndividuales([]);

                    setErrorKitsIndividuales(
                        obtenerMensajeError(
                            errorCarga,
                            "No se pudieron cargar los kits individuales."
                        )
                    );
                } finally {
                    setCargandoKitsIndividuales(
                        false
                    );
                }
            };

        void cargarKitsIndividuales();
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

    const totalPaginasKitsIndividuales =
        Math.max(
            1,
            Math.ceil(
                kitsIndividuales.length /
                tamanoPaginaKits
            )
        );

    const kitsIndividualesPaginados =
        useMemo(() => {
            const inicio =
                (
                    paginaKitsIndividuales -
                    1
                ) *
                tamanoPaginaKits;

            return kitsIndividuales.slice(
                inicio,
                inicio + tamanoPaginaKits
            );
        }, [
            kitsIndividuales,
            paginaKitsIndividuales,
        ]);



    // Regresa a la primera página
    // cuando cambia la lista de kits.
    useEffect(() => {
        setPaginaKitsIndividuales(1);
    }, [
        fecha,
        proyecto,
        familia,
        kitsIndividuales.length,
    ]);

    useEffect(() => {
        setPaginaKitsNoRecibidos(1);
    }, [
        fecha,
        proyecto,
        familia,
        kitsNoRecibidos.length,
    ]);

    // Agrupa los kits no recibidos
    // por número de material.
    const materialesNoRecibidos =
        useMemo<
            MaterialNoRecibidoAgrupado[]
        >(() => {
            const agrupados =
                new Map<
                    string,
                    MaterialNoRecibidoAgrupado
                >();

            kitsNoRecibidos.forEach(
                (kit) => {
                    const numeroNormalizado =
                        normalizarTexto(
                            kit.numeroMaterial
                        );

                    const materialMrp =
                        materiales.find(
                            (material) =>
                                normalizarTexto(
                                    material.numeroMaterial
                                ) === numeroNormalizado
                        );

                    const existente =
                        agrupados.get(
                            numeroNormalizado
                        );

                    if (existente) {
                        existente.totalKits += 1;

                        existente.cantidadTotal +=
                            kit.cantidad;

                        return;
                    }

                    agrupados.set(
                        numeroNormalizado,
                        {
                            numeroMaterial:
                                kit.numeroMaterial,

                            nombreMaterial:
                                materialMrp
                                    ?.nombreMaterial ??
                                null,

                            tipoMaterial:
                                materialMrp
                                    ?.tipoMaterial ??
                                null,

                            cantidadRequeridaDia:
                                materialMrp
                                    ?.cantidadRequeridaDia ??
                                0,

                            totalKits: 1,

                            cantidadTotal:
                                kit.cantidad,
                        }
                    );
                }
            );

            return Array.from(
                agrupados.values()
            ).sort(
                (
                    materialA,
                    materialB
                ) =>
                    materialA.numeroMaterial
                        .localeCompare(
                            materialB
                                .numeroMaterial
                        )
            );
        }, [
            kitsNoRecibidos,
            materiales,
        ]);

    // Filtra materiales no recibidos
    // por búsqueda y tipo.
    const materialesNoRecibidosFiltrados =
        useMemo(() => {
            const texto =
                normalizarTexto(
                    busqueda
                );

            return materialesNoRecibidos.filter(
                (material) => {
                    const coincideBusqueda =
                        !texto ||
                        normalizarTexto(
                            material.numeroMaterial
                        ).includes(texto) ||
                        normalizarTexto(
                            material.nombreMaterial
                        ).includes(texto);

                    const coincideTipo =
                        tiposMaterial.length === 0 ||
                        (
                            material.tipoMaterial !==
                            null &&
                            tiposMaterial.includes(
                                material.tipoMaterial
                            )
                        );

                    return (
                        coincideBusqueda &&
                        coincideTipo
                    );
                }
            );
        }, [
            materialesNoRecibidos,
            busqueda,
            tiposMaterial,
        ]);






    const totalPaginasKitsNoRecibidos =
        Math.max(
            1,
            Math.ceil(
                materialesNoRecibidosFiltrados
                    .length /
                tamanoPaginaKits
            )
        );


    const materialesNoRecibidosPaginados =
        useMemo(() => {
            const inicio =
                (
                    paginaKitsNoRecibidos -
                    1
                ) *
                tamanoPaginaKits;

            return materialesNoRecibidosFiltrados.slice(
                inicio,
                inicio + tamanoPaginaKits
            );
        }, [
            materialesNoRecibidosFiltrados,
            paginaKitsNoRecibidos,
            tamanoPaginaKits,
        ]);






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
        recepcionPics,

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

    // Carga los kits asociados al material
    // seleccionado en el modal.
    const cargarDetalleKitsMaterial =
        async (
            material: MaterialSurtidoMrp
        ) => {
            if (mostrarDetalleKits) {
                setMostrarDetalleKits(false);
                setKitDetalleSeleccionado(null);

                return;
            }

            try {
                setMostrarDetalleKits(true);
                setCargandoDetalleKits(true);
                setErrorDetalleKits("");
                setKitDetalleSeleccionado(null);

                const kits =
                    await obtenerKitsIndividualesMrp(
                        fecha,
                        proyecto,
                        familia
                    );

                const numeroMaterial =
                    normalizarTexto(
                        material.numeroMaterial
                    );

                const kitsDelMaterial =
                    kits.filter(
                        (kit) =>
                            normalizarTexto(
                                kit.numeroMaterial
                            ) === numeroMaterial
                    );

                setKitsDetalleMaterial(
                    kitsDelMaterial
                );
            } catch (errorCarga) {
                console.error(
                    "Error al cargar el detalle de kits:",
                    errorCarga
                );

                setKitsDetalleMaterial([]);

                setErrorDetalleKits(
                    obtenerMensajeError(
                        errorCarga,
                        "No se pudieron cargar los kits del material."
                    )
                );
            } finally {
                setCargandoDetalleKits(false);
            }
        };





    const limpiarFiltros = () => {
        // Limpia filtros secundarios.
        setBusqueda("");
        setEstado("");
        setRecepcionPics("");
        setTiposMaterial([]);

        // Limpia la vista de kits no recibidos.
        setKitsNoRecibidos([]);
        setErrorKitsNoRecibidos("");
        setKitNoRecibidoSeleccionado(
            null
        );

        // Limpia la vista de kits individuales.
        setKitsIndividuales([]);
        setErrorKitsIndividuales("");
        setKitIndividualSeleccionado(
            null
        );

        // Reinicia las paginaciones.
        setPagina(1);
        setPaginaKitsIndividuales(1);
        setPaginaKitsNoRecibidos(1);

        setMaterialSeleccionado(null);
        setMostrarTiposMaterial(false);
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

                            <input
                                id="fechaSurtido"
                                type="date"
                                value={fecha}
                                disabled={cargandoFechas}
                                min={
                                    fechas.length > 0
                                        ? [...fechas].sort()[0]
                                        : undefined
                                }
                                max={
                                    fechas.length > 0
                                        ? [...fechas].sort()[
                                        fechas.length - 1
                                        ]
                                        : undefined
                                }
                                onChange={(event) => {
                                    const nuevaFecha =
                                        event.target.value;

                                    setFecha(nuevaFecha);

                                    setProyecto("");
                                    setFamilia("");
                                    setFamilias([]);
                                    setMateriales([]);
                                    setBusqueda("");
                                    setEstado("");
                                    setRecepcionPics("");
                                    setTiposMaterial([]);

                                    setKitsNoRecibidos([]);
                                    setErrorKitsNoRecibidos("");
                                    setKitNoRecibidoSeleccionado(
                                        null
                                    );

                                    setKitsIndividuales([]);
                                    setErrorKitsIndividuales("");
                                    setKitIndividualSeleccionado(
                                        null
                                    );

                                    setMostrarTiposMaterial(false);
                                    setMaterialSeleccionado(null);

                                    setPagina(1);
                                    setPaginaKitsIndividuales(1);
                                    setPaginaKitsNoRecibidos(1);

                                    setError("");
                                }}
                                style={{
                                    ...inputStyle,
                                    colorScheme: "light",

                                    cursor:
                                        cargandoFechas
                                            ? "not-allowed"
                                            : "pointer",
                                }}
                            />
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
                                disabled={
                                    !familia &&
                                    estado !== "NO_RECIBIDO"
                                }
                                onChange={(event) => {
                                    setBusqueda(
                                        event.target.value
                                    );

                                    setPagina(1);
                                    setPaginaKitsNoRecibidos(1);
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
                                    const nuevoProyecto =
                                        event.target.value;

                                    setProyecto(
                                        nuevoProyecto
                                    );

                                    setFamilia("");
                                    setFamilias([]);
                                    setMateriales([]);
                                    setBusqueda("");
                                    setTiposMaterial([]);
                                    setKitsNoRecibidos([]);
                                    setErrorKitsNoRecibidos("");
                                    setPagina(1);
                                    setPaginaKitsNoRecibidos(1);
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    {cargandoFamilias
                                        ? "Cargando familias..."
                                        : estado === "NO_RECIBIDO"
                                            ? "Todas las familias"
                                            : !proyecto
                                                ? "Selecciona primero un proyecto"
                                                : "Selecciona una familia"}
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
                                    cargandoFamilias ||
                                    (
                                        !proyecto &&
                                        estado !== "NO_RECIBIDO"
                                    )
                                }
                                onChange={(event) => {
                                    setFamilia(
                                        event.target.value
                                    );

                                    setBusqueda("");
                                    setTiposMaterial([]);
                                    setRecepcionPics("");
                                    setKitsNoRecibidos([]);
                                    setErrorKitsNoRecibidos("");
                                    setMostrarTiposMaterial(false);
                                    setPagina(1);
                                    setPaginaKitsNoRecibidos(1);
                                }}
                                style={inputStyle}
                            >
                                <option value="">
                                    {cargandoFamilias
                                        ? "Cargando familias..."
                                        : estado === "NO_RECIBIDO"
                                            ? "Todas las familias"
                                            : !proyecto
                                                ? "Selecciona primero un proyecto"
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
                                disabled={!fecha}
                                onChange={(event) => {
                                    const nuevoEstado =
                                        event.target.value as
                                        | EstadoAbastecimiento
                                        | "";

                                    setEstado(nuevoEstado);

                                    setBusqueda("");
                                    setTiposMaterial([]);
                                    setMostrarTiposMaterial(false);

                                    setKitsNoRecibidos([]);
                                    setErrorKitsNoRecibidos("");

                                    setMaterialSeleccionado(null);
                                    setKitDetalleSeleccionado(null);

                                    setPagina(1);
                                    setPaginaKitsIndividuales(1);
                                    setPaginaKitsNoRecibidos(1);
                                }}

                                style={inputStyle}
                            >
                                <option value="">
                                    Todos
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
                                    disabled={
                                        !familia &&
                                        estado !== "NO_RECIBIDO"
                                    }
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
                                            !familia &&
                                                estado !== "NO_RECIBIDO"
                                                ? 0.55
                                                : 1,

                                        cursor:
                                            !familia &&
                                                estado !== "NO_RECIBIDO"
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
                                    (
                                        familia ||
                                        estado === "NO_RECIBIDO"
                                    ) && (


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

                    {recepcionPics === "KITS_INDIVIDUALES" && (
                        <>
                            <div style={resultsHeaderStyle}>
                                <div>
                                    <h2 style={sectionTitleStyle}>
                                        Kits individuales por serial
                                    </h2>

                                    <p style={resultsDescriptionStyle}>
                                        Cada fila corresponde a un kit
                                        o caja registrada en PICS.
                                    </p>
                                </div>

                                <span style={counterStyle}>
                                    {kitsIndividuales.length.toLocaleString(
                                        "es-MX"
                                    )}{" "}
                                    kits
                                </span>
                            </div>

                            {errorKitsIndividuales && (
                                <div style={errorStyle}>
                                    {errorKitsIndividuales}
                                </div>
                            )}

                            {cargandoKitsIndividuales ? (
                                <div style={emptyStyle}>
                                    Cargando kits individuales...
                                </div>
                            ) : kitsIndividuales.length === 0 ? (
                                <div style={emptyStyle}>
                                    No existen kits PICS para
                                    esta selección.
                                </div>
                            ) : (
                                <div style={tableContainerStyle}>
                                    <table style={kitsIndividualTableStyle}>
                                        <thead>
                                            <tr style={tableHeaderStyle}>
                                                <th style={materialKitThStyle}>
                                                    Material
                                                </th>

                                                <th style={descriptionKitThStyle}>
                                                    Descripción
                                                </th>
                                                <th style={serialKitThStyle}>
                                                    Serial Kit
                                                </th>

                                                <th style={typeKitThStyle}>
                                                    Tipo
                                                </th>



                                                <th style={quantityKitThStyle}>
                                                    Cantidad del kit
                                                </th>

                                                <th style={quantityKitThStyle}>
                                                    Disponible
                                                </th>

                                                <th style={statusKitThStyle}>
                                                    Estado
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {kitsIndividualesPaginados.map(
                                                (kit) => (
                                                    <tr
                                                        key={kit.idMaterialKit}
                                                        tabIndex={0}
                                                        onClick={() => {
                                                            setKitIndividualSeleccionado(
                                                                kit
                                                            );
                                                        }}
                                                        onKeyDown={(event) => {
                                                            if (
                                                                event.key === "Enter" ||
                                                                event.key === " "
                                                            ) {
                                                                event.preventDefault();

                                                                setKitIndividualSeleccionado(
                                                                    kit
                                                                );
                                                            }
                                                        }}
                                                        style={kitRowStyle}
                                                        title="Haz clic para ver los detalles del kit"
                                                    >
                                                        <td style={materialKitTdStyle}>
                                                            <strong style={materialNumberStyle}>
                                                                {kit.numeroMaterial}
                                                            </strong>
                                                        </td>

                                                        <td style={descriptionKitTdStyle}>
                                                            {kit.nombreMaterial ??
                                                                "Sin descripción"}
                                                        </td>

                                                        <td style={serialKitTdStyle}>
                                                            <strong>
                                                                {kit.serialCaja}
                                                            </strong>
                                                        </td>


                                                        <td style={typeKitTdStyle}>
                                                            <span
                                                                style={{
                                                                    ...typeBadgeStyle,
                                                                    background:
                                                                        obtenerColorTipo(
                                                                            kit.tipoMaterial
                                                                        ).fondo,
                                                                    color:
                                                                        obtenerColorTipo(
                                                                            kit.tipoMaterial
                                                                        ).texto,
                                                                }}
                                                            >
                                                                {kit.tipoMaterial ??
                                                                    "N/A"}
                                                            </span>
                                                        </td>


                                                        <td style={quantityKitTdStyle}>
                                                            {formatearCantidad(
                                                                kit.cantidadInicial
                                                            )}
                                                        </td>

                                                        <td style={quantityAvailableKitTdStyle}>
                                                            <strong>
                                                                {formatearCantidad(
                                                                    kit.estadoKit === "POR_RECIBIR"
                                                                        ? 0
                                                                        : kit.cantidadDisponible
                                                                )}
                                                            </strong>
                                                        </td>

                                                        <td style={statusKitTdStyle}>
                                                            <span
                                                                style={obtenerEstiloEstadoKit(
                                                                    kit.estadoKit
                                                                )}
                                                            >
                                                                {obtenerTextoEstadoKit(
                                                                    kit.estadoKit
                                                                )}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {kitsIndividuales.length > 0 && (
                                <div style={paginationStyle}>
                                    <button
                                        type="button"
                                        disabled={
                                            paginaKitsIndividuales <= 1
                                        }
                                        onClick={() => {
                                            setPaginaKitsIndividuales(
                                                (paginaActual) =>
                                                    Math.max(
                                                        1,
                                                        paginaActual - 1
                                                    )
                                            );
                                        }}
                                        style={{
                                            ...paginationButtonStyle,

                                            opacity:
                                                paginaKitsIndividuales <= 1
                                                    ? 0.5
                                                    : 1,

                                            cursor:
                                                paginaKitsIndividuales <= 1
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        Anterior
                                    </button>

                                    <span style={paginationTextStyle}>
                                        Página{" "}
                                        {paginaKitsIndividuales} de{" "}
                                        {totalPaginasKitsIndividuales}
                                    </span>



                                    <button
                                        type="button"
                                        disabled={
                                            paginaKitsIndividuales >=
                                            totalPaginasKitsIndividuales
                                        }
                                        onClick={() => {
                                            setPaginaKitsIndividuales(
                                                (paginaActual) =>
                                                    Math.min(
                                                        totalPaginasKitsIndividuales,
                                                        paginaActual + 1
                                                    )
                                            );
                                        }}
                                        style={{
                                            ...paginationButtonStyle,

                                            opacity:
                                                paginaKitsIndividuales >=
                                                    totalPaginasKitsIndividuales
                                                    ? 0.5
                                                    : 1,

                                            cursor:
                                                paginaKitsIndividuales >=
                                                    totalPaginasKitsIndividuales
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    {estado === "NO_RECIBIDO" && (<>
                        <div style={resultsHeaderStyle}>
                            <div>
                                <h2 style={sectionTitleStyle}>
                                    Kits no recibidos
                                </h2>

                                <p style={resultsDescriptionStyle}>
                                    Solo se muestran los seriales que
                                    PICS todavía marca sin recepción.
                                </p>
                            </div>

                            <span style={counterStyle}>
                                {materialesNoRecibidosFiltrados
                                    .length
                                    .toLocaleString(
                                        "es-MX"
                                    )}{" "}
                                materiales
                            </span>
                        </div>

                        {errorKitsNoRecibidos && (
                            <div style={errorStyle}>
                                {errorKitsNoRecibidos}
                            </div>
                        )}

                        {cargandoKitsNoRecibidos ? (
                            <div style={emptyStyle}>
                                Cargando kits no recibidos...
                            </div>
                        ) : materialesNoRecibidosFiltrados
                            .length === 0 ? (
                            <div style={emptyStyle}>
                                {busqueda ||
                                    tiposMaterial.length > 0
                                    ? "No hay materiales no recibidos que coincidan con los filtros."
                                    : "No existen materiales pendientes de recepción para esta fecha."}
                            </div>
                        ) : (
                            <div style={tableContainerStyle}>
                                <table style={kitsMissingTableStyle}>
                                    <thead>
                                        <tr style={tableHeaderStyle}>
                                            <th style={materialTotalThStyle}>
                                                Material
                                            </th>

                                            <th style={descriptionTotalThStyle}>
                                                Descripción
                                            </th>

                                            <th style={typeTotalThStyle}>
                                                Tipo
                                            </th>

                                            <th style={quantityTotalThStyle}>
                                                Requerido del día
                                            </th>

                                            <th style={quantityTotalThStyle}>
                                                Total de kits
                                            </th>

                                            <th style={quantityTotalThStyle}>
                                                Cantidad faltante
                                            </th>

                                            <th style={statusTotalThStyle}>
                                                Estado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materialesNoRecibidosPaginados.map(
                                            (material) => {
                                                const colorTipo =
                                                    obtenerColorTipo(
                                                        material.tipoMaterial
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            material.numeroMaterial
                                                        }
                                                        style={
                                                            materialTotalRowStyle
                                                        }
                                                        title="Material pendiente de recepción"
                                                    >
                                                        <td
                                                            style={
                                                                materialTotalTdStyle
                                                            }
                                                        >
                                                            <strong
                                                                style={
                                                                    materialNumberStyle
                                                                }
                                                            >
                                                                {
                                                                    material
                                                                        .numeroMaterial
                                                                }
                                                            </strong>
                                                        </td>

                                                        <td
                                                            style={
                                                                descriptionTotalTdStyle
                                                            }
                                                            title={
                                                                material
                                                                    .nombreMaterial ??
                                                                "Sin descripción"
                                                            }
                                                        >
                                                            {material
                                                                .nombreMaterial ??
                                                                "Sin descripción"}
                                                        </td>

                                                        <td
                                                            style={
                                                                typeTotalTdStyle
                                                            }
                                                        >
                                                            <span
                                                                style={{
                                                                    ...typeBadgeStyle,
                                                                    background:
                                                                        colorTipo.fondo,
                                                                    color:
                                                                        colorTipo.texto,
                                                                }}
                                                            >
                                                                {material
                                                                    .tipoMaterial ??
                                                                    "N/A"}
                                                            </span>
                                                        </td>

                                                        <td
                                                            style={
                                                                quantityTotalTdStyle
                                                            }
                                                        >
                                                            <strong>
                                                                {formatearCantidad(
                                                                    material
                                                                        .cantidadRequeridaDia
                                                                )}
                                                            </strong>
                                                        </td>

                                                        <td
                                                            style={
                                                                quantityTotalTdStyle
                                                            }
                                                        >
                                                            <span
                                                                style={
                                                                    kitsPendingStyle
                                                                }
                                                            >
                                                                {material
                                                                    .totalKits
                                                                    .toLocaleString(
                                                                        "es-MX"
                                                                    )}{" "}
                                                                kits
                                                            </span>
                                                        </td>

                                                        <td
                                                            style={
                                                                pendingQuantityTdStyle
                                                            }
                                                        >
                                                            <strong>
                                                                {formatearCantidad(
                                                                    material
                                                                        .cantidadTotal
                                                                )}
                                                            </strong>
                                                        </td>

                                                        <td
                                                            style={
                                                                statusTotalTdStyle
                                                            }
                                                        >
                                                            <span
                                                                style={
                                                                    unavailableBadgeStyle
                                                                }
                                                            >
                                                                No disponible
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
                        {materialesNoRecibidosFiltrados
                            .length > 0 && (
                                <div style={paginationStyle}>
                                    <button
                                        type="button"
                                        disabled={
                                            paginaKitsNoRecibidos <= 1
                                        }
                                        onClick={() => {
                                            setPaginaKitsNoRecibidos(
                                                (paginaActual) =>
                                                    Math.max(
                                                        1,
                                                        paginaActual - 1
                                                    )
                                            );
                                        }}
                                        style={{
                                            ...paginationButtonStyle,

                                            opacity:
                                                paginaKitsNoRecibidos <= 1
                                                    ? 0.5
                                                    : 1,

                                            cursor:
                                                paginaKitsNoRecibidos <= 1
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        Anterior
                                    </button>

                                    <span style={paginationTextStyle}>
                                        Página{" "}
                                        {paginaKitsNoRecibidos} de{" "}
                                        {totalPaginasKitsNoRecibidos}
                                    </span>


                                    <button
                                        type="button"
                                        disabled={
                                            paginaKitsNoRecibidos >=
                                            totalPaginasKitsNoRecibidos
                                        }
                                        onClick={() => {
                                            setPaginaKitsNoRecibidos(
                                                (paginaActual) =>
                                                    Math.min(
                                                        totalPaginasKitsNoRecibidos,
                                                        paginaActual + 1
                                                    )
                                            );
                                        }}
                                        style={{
                                            ...paginationButtonStyle,

                                            opacity:
                                                paginaKitsNoRecibidos >=
                                                    totalPaginasKitsNoRecibidos
                                                    ? 0.5
                                                    : 1,

                                            cursor:
                                                paginaKitsNoRecibidos >=
                                                    totalPaginasKitsNoRecibidos
                                                    ? "not-allowed"
                                                    : "pointer",
                                        }}
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}


                    </>
                    )}

                    {estado !== "NO_RECIBIDO" && (

                        <>

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
                                    <table style={materialTotalTableStyle}>

                                        <thead>
                                            <tr style={tableHeaderStyle}>
                                                <th style={materialTotalThStyle}>
                                                    Material
                                                </th>

                                                <th style={descriptionTotalThStyle}>
                                                    Descripción
                                                </th>

                                                <th style={typeTotalThStyle}>
                                                    Tipo
                                                </th>

                                                <th style={quantityTotalThStyle}>
                                                    Requerido del día
                                                </th>

                                                <th style={quantityTotalThStyle}>
                                                    Total de kits
                                                </th>

                                                <th style={quantityTotalThStyle}>
                                                    Cantidad total
                                                </th>

                                                <th style={statusTotalThStyle}>
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
                                                            key={material.idRequerimiento}
                                                            tabIndex={0}
                                                            onClick={() => {
                                                                setMaterialSeleccionado(
                                                                    material
                                                                );

                                                                setMostrarDetalleKits(false);
                                                                setKitsDetalleMaterial([]);
                                                                setKitDetalleSeleccionado(null);
                                                                setErrorDetalleKits("");
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

                                                                    setMostrarDetalleKits(false);
                                                                    setKitsDetalleMaterial([]);
                                                                    setKitDetalleSeleccionado(null);
                                                                    setErrorDetalleKits("");
                                                                }
                                                            }}
                                                            style={materialTotalRowStyle}
                                                            title="Haz clic para ver los detalles del material"
                                                        >
                                                            <td style={materialTotalTdStyle}>
                                                                <strong style={materialNumberStyle}>
                                                                    {material.numeroMaterial}
                                                                </strong>
                                                            </td>

                                                            <td
                                                                style={descriptionTotalTdStyle}
                                                                title={
                                                                    material.nombreMaterial ??
                                                                    "Sin descripción"
                                                                }
                                                            >
                                                                {material.nombreMaterial ??
                                                                    "Sin descripción"}
                                                            </td>

                                                            <td style={typeTotalTdStyle}>
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
                                                            </td>

                                                            <td style={quantityTotalTdStyle}>
                                                                <strong>
                                                                    {formatearCantidad(
                                                                        material
                                                                            .cantidadRequeridaDia
                                                                    )}
                                                                </strong>
                                                            </td>

                                                            <td style={quantityTotalTdStyle}>
                                                                <span style={kitsAvailableStyle}>
                                                                    {material.kitsDisponibles.toLocaleString(
                                                                        "es-MX"
                                                                    )}{" "}
                                                                    kits
                                                                </span>
                                                            </td>

                                                            <td style={physicalTotalTdStyle}>
                                                                <strong>
                                                                    {formatearCantidad(
                                                                        material
                                                                            .cantidadDisponible
                                                                    )}
                                                                </strong>
                                                            </td>

                                                            <td style={statusTotalTdStyle}>
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
                        </>
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

                                setKitDetalleSeleccionado(
                                    null
                                );

                                setMostrarDetalleKits(false);
                                setKitsDetalleMaterial([]);
                                setErrorDetalleKits("");
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

                                        setKitDetalleSeleccionado(
                                            null
                                        );

                                        setMostrarDetalleKits(false);
                                        setKitsDetalleMaterial([]);
                                        setErrorDetalleKits("");
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
                                    etiqueta="Requerido hoy"
                                    valor={
                                        materialSeleccionado
                                            .cantidadRequeridaDia
                                    }
                                    color="#1d4ed8"
                                />

                                <DetalleCantidad
                                    etiqueta="Surtido hoy"
                                    valor={
                                        materialSeleccionado
                                            .cantidadSurtidaDia
                                    }
                                    color="#0f766e"
                                />

                                <DetalleCantidad
                                    etiqueta="Pendiente hoy"
                                    valor={
                                        materialSeleccionado
                                            .cantidadPendienteDia
                                    }
                                    color="#b45309"
                                />

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
                                            etiqueta="Faltante del día"
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

                                <button
                                    type="button"
                                    onClick={() => {
                                        void cargarDetalleKitsMaterial(
                                            materialSeleccionado
                                        );
                                    }}
                                    style={kitDetailsToggleStyle}
                                >
                                    <span>
                                        {mostrarDetalleKits
                                            ? "Ocultar detalle de kits"
                                            : "Ver detalle de kits"}
                                    </span>

                                    <span style={kitDetailsCountStyle}>
                                        {(
                                            materialSeleccionado
                                                .kitsDisponibles +
                                            materialSeleccionado
                                                .kitsNoRecibidos
                                        ).toLocaleString(
                                            "es-MX"
                                        )}
                                    </span>

                                    <span
                                        aria-hidden="true"
                                        style={{
                                            ...kitDetailsArrowStyle,
                                            transform:
                                                mostrarDetalleKits
                                                    ? "rotate(180deg)"
                                                    : "rotate(0deg)",
                                        }}
                                    >
                                        ▼
                                    </span>
                                </button>
                            </div>


                            {mostrarDetalleKits && (
                                <div style={kitDetailsContainerStyle}>
                                    {errorDetalleKits && (
                                        <div style={errorStyle}>
                                            {errorDetalleKits}
                                        </div>
                                    )}

                                    {cargandoDetalleKits ? (
                                        <div style={kitDetailsLoadingStyle}>
                                            Cargando kits del material...
                                        </div>
                                    ) : kitsDetalleMaterial.length === 0 ? (
                                        <div style={kitDetailsLoadingStyle}>
                                            No existen kits relacionados con
                                            este material.
                                        </div>
                                    ) : (
                                        <div style={kitDetailsTableContainerStyle}>
                                            <table style={kitDetailsTableStyle}>
                                                <thead>
                                                    <tr style={tableHeaderStyle}>
                                                        <th style={kitDetailSerialThStyle}>
                                                            Serial Kit
                                                        </th>

                                                        <th style={kitDetailQuantityThStyle}>
                                                            Cantidad del kit
                                                        </th>

                                                        <th style={kitDetailQuantityThStyle}>
                                                            Disponible
                                                        </th>

                                                        <th style={kitDetailStatusThStyle}>
                                                            Estado
                                                        </th>
                                                    </tr>
                                                </thead>

                                                <tbody>
                                                    {kitsDetalleMaterial.map(
                                                        (kit) => {
                                                            const disponible =
                                                                kit.estadoKit ===
                                                                    "POR_RECIBIR"
                                                                    ? 0
                                                                    : kit
                                                                        .cantidadDisponible;

                                                            return (
                                                                <tr
                                                                    key={
                                                                        kit.idMaterialKit
                                                                    }
                                                                    tabIndex={0}
                                                                    onClick={() => {
                                                                        setKitDetalleSeleccionado(
                                                                            kit
                                                                        );
                                                                    }}
                                                                    onKeyDown={(event) => {
                                                                        if (
                                                                            event.key ===
                                                                            "Enter" ||
                                                                            event.key === " "
                                                                        ) {
                                                                            event.preventDefault();

                                                                            setKitDetalleSeleccionado(
                                                                                kit
                                                                            );
                                                                        }
                                                                    }}
                                                                    style={
                                                                        kitDetailTableRowStyle
                                                                    }
                                                                    title="Haz clic para ver los detalles del kit"
                                                                >
                                                                    <td
                                                                        style={
                                                                            kitDetailSerialTdStyle
                                                                        }
                                                                    >
                                                                        <strong>
                                                                            {kit.serialCaja}
                                                                        </strong>
                                                                    </td>

                                                                    <td
                                                                        style={
                                                                            kitDetailQuantityTdStyle
                                                                        }
                                                                    >
                                                                        {formatearCantidad(
                                                                            kit.cantidadInicial
                                                                        )}
                                                                    </td>

                                                                    <td
                                                                        style={
                                                                            kitDetailQuantityTdStyle
                                                                        }
                                                                    >
                                                                        <strong>
                                                                            {formatearCantidad(
                                                                                disponible
                                                                            )}
                                                                        </strong>
                                                                    </td>

                                                                    <td
                                                                        style={
                                                                            kitDetailStatusTdStyle
                                                                        }
                                                                    >
                                                                        <span
                                                                            style={obtenerEstiloEstadoKit(
                                                                                kit.estadoKit
                                                                            )}
                                                                        >
                                                                            {obtenerTextoEstadoKit(
                                                                                kit.estadoKit
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
                                </div>
                            )}
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

                                        setKitDetalleSeleccionado(
                                            null
                                        );

                                        setMostrarDetalleKits(false);
                                        setKitsDetalleMaterial([]);
                                        setErrorDetalleKits("");
                                    }}
                                    style={modalActionStyle}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </section>
                    </div>
                )}

                {kitDetalleSeleccionado && (
                    <div
                        style={miniModalOverlayStyle}
                        role="presentation"
                        onMouseDown={(event) => {
                            if (
                                event.target ===
                                event.currentTarget
                            ) {
                                setKitDetalleSeleccionado(
                                    null
                                );
                            }
                        }}
                    >
                        <section
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="detalleSerialKitTitulo"
                            style={miniModalStyle}
                            onMouseDown={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <header style={modalHeaderStyle}>
                                <div>
                                    <span style={modalEyebrowStyle}>
                                        Detalle del kit
                                    </span>

                                    <h2
                                        id="detalleSerialKitTitulo"
                                        style={miniModalTitleStyle}
                                    >
                                        {
                                            kitDetalleSeleccionado
                                                .serialCaja
                                        }
                                    </h2>

                                    <p style={modalDescriptionStyle}>
                                        Material{" "}
                                        <strong>
                                            {
                                                kitDetalleSeleccionado
                                                    .numeroMaterial
                                            }
                                        </strong>
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    aria-label="Cerrar detalle del kit"
                                    onClick={() => {
                                        setKitDetalleSeleccionado(
                                            null
                                        );
                                    }}
                                    style={modalCloseStyle}
                                >
                                    ×
                                </button>
                            </header>

                            <div style={miniModalSummaryStyle}>
                                <DetalleCantidad
                                    etiqueta="Cantidad del kit"
                                    valor={
                                        kitDetalleSeleccionado
                                            .cantidadInicial
                                    }
                                    color="#1d4ed8"
                                />

                                <DetalleCantidad
                                    etiqueta="Disponible"
                                    valor={
                                        kitDetalleSeleccionado
                                            .estadoKit ===
                                            "POR_RECIBIR"
                                            ? 0
                                            : kitDetalleSeleccionado
                                                .cantidadDisponible
                                    }
                                    color={
                                        kitDetalleSeleccionado
                                            .estadoKit ===
                                            "POR_RECIBIR"
                                            ? "#b91c1c"
                                            : "#166534"
                                    }
                                />
                            </div>

                            <div style={miniModalStatusStyle}>
                                <span
                                    style={obtenerEstiloEstadoKit(
                                        kitDetalleSeleccionado
                                            .estadoKit
                                    )}
                                >
                                    {obtenerTextoEstadoKit(
                                        kitDetalleSeleccionado
                                            .estadoKit
                                    )}
                                </span>
                            </div>

                            <div style={miniModalSectionStyle}>
                                <h3 style={modalSectionTitleStyle}>
                                    Información logística
                                </h3>

                                <div style={miniModalDetailsGridStyle}>
                                    <DetalleTexto
                                        etiqueta="ASN"
                                        valor={
                                            kitDetalleSeleccionado
                                                .numeroAsn ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Camión"
                                        valor={
                                            kitDetalleSeleccionado
                                                .numeroCamion ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Pallet"
                                        valor={
                                            kitDetalleSeleccionado
                                                .numeroPallet ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Localidad"
                                        valor={
                                            kitDetalleSeleccionado
                                                .localidad ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Rack"
                                        valor={
                                            kitDetalleSeleccionado
                                                .rack ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Ship From"
                                        valor={
                                            kitDetalleSeleccionado
                                                .shipFrom ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Estado PICS"
                                        valor={
                                            kitDetalleSeleccionado
                                                .estadoOrigen ??
                                            "Sin dato"
                                        }
                                    />

                                    <DetalleTexto
                                        etiqueta="Fecha de importación"
                                        valor={formatearFechaHora(
                                            kitDetalleSeleccionado
                                                .fechaImportacion
                                        )}
                                    />
                                </div>
                            </div>

                            <div style={modalActionsStyle}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKitDetalleSeleccionado(
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


function formatearFechaHora(
    valor: string
) {
    if (!valor) {
        return "Sin dato";
    }

    const fechaNormalizada =
        valor.replace(
            " ",
            "T"
        );

    const fechaValor =
        new Date(
            fechaNormalizada
        );

    if (
        Number.isNaN(
            fechaValor.getTime()
        )
    ) {
        return valor;
    }

    return fechaValor.toLocaleString(
        "es-MX",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }
    );
}

// Calcula cuánto no puede cubrirse
// con la existencia física actual.
function obtenerFaltante(
    material: MaterialSurtidoMrp
) {
    return Math.max(
        material.cantidadPendienteDia -
        material.cantidadDisponible,
        0
    );
}
function formatearCantidad(
    cantidad:
        | number
        | null
        | undefined
) {
    if (
        cantidad === null ||
        cantidad === undefined ||
        !Number.isFinite(cantidad)
    ) {
        return "0";
    }

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
        "DISPONIBLE"
    ) {
        return (
            `Hay existencia suficiente para surtir ` +
            `${formatearCantidad(
                material.cantidadRequeridaDia
            )} piezas requeridas para esta fecha.`
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

function obtenerTextoEstadoKit(
    estadoKit: string
) {
    switch (estadoKit) {
        case "DISPONIBLE":
            return "Recibido";

        case "POR_RECIBIR":
            return "No recibido";

        case "AGOTADO":
            return "Agotado";

        case "BLOQUEADO":
            return "Bloqueado";

        default:
            return estadoKit;
    }
}

function obtenerEstiloEstadoKit(
    estadoKit: string
) {
    const estiloBase = {
        display: "inline-block",
        padding: "6px 9px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: "900",
        whiteSpace: "nowrap" as const,
    };

    switch (estadoKit) {
        case "DISPONIBLE":
            return {
                ...estiloBase,
                background: "#dcfce7",
                color: "#166534",
            };

        case "POR_RECIBIR":
            return {
                ...estiloBase,
                background: "#eff6ff",
                color: "#1d4ed8",
            };

        case "AGOTADO":
            return {
                ...estiloBase,
                background: "#f1f5f9",
                color: "#64748b",
            };

        case "BLOQUEADO":
            return {
                ...estiloBase,
                background: "#fee2e2",
                color: "#b91c1c",
            };

        default:
            return {
                ...estiloBase,
                background: "#f1f5f9",
                color: "#475569",
            };
    }
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

const tableHeaderStyle = {
    background: "#f1f5f9",
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
const kitsMissingTableStyle = {
    width: "100%",
    minWidth: "1000px",
    tableLayout: "fixed" as const,
    borderCollapse: "collapse" as const,
};


const kitsIndividualTableStyle:
    CSSProperties = {
    width: "100%",
    minWidth: "1000px",
    tableLayout: "fixed",
    borderCollapse: "collapse",
};

const kitHeaderBaseStyle = {
    padding: "10px 8px",
    borderBottom:
        "2px solid #cbd5e1",
    color: "#102957",
    fontSize: "12px",
    fontWeight: "800",
    textAlign: "left" as const,
    verticalAlign: "middle" as const,
    whiteSpace: "nowrap" as const,
};

const materialKitThStyle = {
    ...kitHeaderBaseStyle,
    width: "11%",
};

const descriptionKitThStyle = {
    ...kitHeaderBaseStyle,
    width: "24%",
};

const typeKitThStyle = {
    ...kitHeaderBaseStyle,
    width: "6%",
    textAlign: "center" as const,
};

const serialKitThStyle = {
    ...kitHeaderBaseStyle,
    width: "23%",
};

const quantityKitThStyle = {
    ...kitHeaderBaseStyle,
    width: "13%",
    textAlign: "center" as const,
};

const statusKitThStyle = {
    ...kitHeaderBaseStyle,
    width: "10%",
    textAlign: "center" as const,
};

const kitCellBaseStyle = {
    padding: "8px",
    height: "44px",
    boxSizing: "border-box" as const,
    borderBottom:
        "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "13px",
    verticalAlign: "middle" as const,
};

const materialKitTdStyle = {
    ...kitCellBaseStyle,
    whiteSpace: "nowrap" as const,
};

const descriptionKitTdStyle = {
    ...kitCellBaseStyle,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
};



const typeKitTdStyle = {
    ...kitCellBaseStyle,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};

const serialKitTdStyle = {
    ...kitCellBaseStyle,
    color: "#17335f",
    whiteSpace: "nowrap" as const,
};

const quantityKitTdStyle = {
    ...kitCellBaseStyle,
    width: "13%",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    fontVariantNumeric:
        "tabular-nums",
};

const quantityAvailableKitTdStyle = {
    ...quantityKitTdStyle,
    color: "#102957",
    fontWeight: "800",
};


const statusKitTdStyle = {
    ...kitCellBaseStyle,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};
const kitRowStyle = {
    cursor: "pointer",
    transition:
        "background-color 0.15s ease",
};

const materialTotalTableStyle = {
    width: "100%",
    minWidth: "1000px",
    tableLayout: "fixed" as const,
    borderCollapse: "collapse" as const,
};

const materialTotalHeaderBaseStyle = {
    padding: "10px 9px",
    borderBottom:
        "2px solid #cbd5e1",
    color: "#102957",
    fontSize: "12px",
    fontWeight: "800",
    verticalAlign: "middle" as const,
    whiteSpace: "nowrap" as const,
};

const materialTotalThStyle = {
    ...materialTotalHeaderBaseStyle,
    width: "13%",
    textAlign: "left" as const,
};

const descriptionTotalThStyle = {
    ...materialTotalHeaderBaseStyle,
    width: "27%",
    textAlign: "left" as const,
};

const typeTotalThStyle = {
    ...materialTotalHeaderBaseStyle,
    width: "7%",
    textAlign: "center" as const,
};

const quantityTotalThStyle = {
    ...materialTotalHeaderBaseStyle,
    width: "14%",
    textAlign: "center" as const,
};

const statusTotalThStyle = {
    ...materialTotalHeaderBaseStyle,
    width: "11%",
    textAlign: "center" as const,
};

const materialTotalCellBaseStyle = {
    height: "46px",
    boxSizing: "border-box" as const,
    padding: "8px 9px",
    borderBottom:
        "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "13px",
    verticalAlign: "middle" as const,
};

const materialTotalTdStyle = {
    ...materialTotalCellBaseStyle,
    whiteSpace: "nowrap" as const,
};

const descriptionTotalTdStyle = {
    ...materialTotalCellBaseStyle,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
};

const typeTotalTdStyle = {
    ...materialTotalCellBaseStyle,
    textAlign: "center" as const,
};

const quantityTotalTdStyle = {
    ...materialTotalCellBaseStyle,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    fontVariantNumeric:
        "tabular-nums",
};

const physicalTotalTdStyle = {
    ...quantityTotalTdStyle,
    color: "#166534",
    fontWeight: "800",
};

const statusTotalTdStyle = {
    ...materialTotalCellBaseStyle,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};

const materialTotalRowStyle = {
    cursor: "pointer",
    transition:
        "background-color 0.15s ease",
};


const kitDetailsToggleStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    width: "100%",
    minHeight: "44px",
    marginTop: "4px",
    padding: "10px 13px",
    border: "1px solid #cbd5e1",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#102957",
    fontSize: "13px",
    fontWeight: "800",
    textAlign: "left" as const,
    cursor: "pointer",
};

const kitDetailsCountStyle = {
    marginLeft: "auto",
    padding: "4px 9px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "600",
};

const kitDetailsArrowStyle = {
    display: "inline-block",
    color: "#475569",
    fontSize: "10px",
    transition:
        "transform 0.15s ease",
};

const kitDetailsContainerStyle = {
    marginTop: "10px",
};

const kitDetailsLoadingStyle = {
    padding: "20px",
    border: "1px dashed #cbd5e1",
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#64748b",
    textAlign: "center" as const,
    fontSize: "13px",
};

const kitDetailsTableContainerStyle = {
    width: "100%",
    maxHeight: "350px",
    overflowX: "auto" as const,
    overflowY: "auto" as const,
    border: "1px solid #e2e8f0",
    borderRadius: "9px",
};

const kitDetailsTableStyle = {
    width: "100%",
    minWidth: "650px",
    tableLayout: "fixed" as const,
    borderCollapse: "collapse" as const,
    background: "#ffffff",
};

const kitDetailHeaderBaseStyle = {
    position: "sticky" as const,
    top: 0,
    zIndex: 1,
    padding: "10px",
    borderBottom:
        "2px solid #cbd5e1",
    background: "#f1f5f9",
    color: "#102957",
    fontSize: "11px",
    fontWeight: "900",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
};

const kitDetailSerialThStyle = {
    ...kitDetailHeaderBaseStyle,
    width: "42%",
    textAlign: "left" as const,
};

const kitDetailQuantityThStyle = {
    ...kitDetailHeaderBaseStyle,
    width: "19%",
    textAlign: "center" as const,
};

const kitDetailStatusThStyle = {
    ...kitDetailHeaderBaseStyle,
    width: "20%",
    textAlign: "center" as const,
};

const kitDetailCellBaseStyle = {
    height: "46px",
    boxSizing: "border-box" as const,
    padding: "8px 10px",
    borderBottom:
        "1px solid #e2e8f0",
    color: "#334155",
    fontSize: "12px",
    verticalAlign: "middle" as const,
};

const kitDetailSerialTdStyle = {
    ...kitDetailCellBaseStyle,
    color: "#102957",
    textAlign: "left" as const,
    whiteSpace: "nowrap" as const,
};

const kitDetailQuantityTdStyle = {
    ...kitDetailCellBaseStyle,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
    fontVariantNumeric:
        "tabular-nums",
};

const kitDetailStatusTdStyle = {
    ...kitDetailCellBaseStyle,
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};

const kitDetailTableRowStyle = {
    cursor: "pointer",
    background: "#ffffff",
    transition:
        "background-color 0.15s ease",
};



const miniModalOverlayStyle = {
    position: "fixed" as const,
    inset: 0,
    zIndex: 3000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background:
        "rgba(15, 23, 42, 0.45)",
};

const miniModalStyle = {
    width: "100%",
    maxWidth: "650px",
    maxHeight: "85vh",
    overflowY: "auto" as const,
    boxSizing: "border-box" as const,
    padding: "22px",
    border: "1px solid #cbd5e1",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow:
        "0 25px 65px rgba(15, 23, 42, 0.4)",
};

const miniModalTitleStyle = {
    margin: 0,
    color: "#102957",
    fontSize: "21px",
    overflowWrap: "anywhere" as const,
};

const miniModalSummaryStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(2, minmax(0, 1fr))",
    gap: "10px",
    marginBottom: "12px",
};

const miniModalStatusStyle = {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: "14px",
};

const miniModalSectionStyle = {
    padding: "15px",
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#ffffff",
};

const miniModalDetailsGridStyle = {
    display: "grid",
    gridTemplateColumns:
        "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "9px",
};

// Total de kits pendientes de recepción.
const kitsPendingStyle = {
    display: "inline-block",
    minWidth: "60px",
    padding: "5px 8px",
    borderRadius: "999px",
    background: "#fff7ed",
    color: "#c2410c",
    fontSize: "11px",
    fontWeight: "900",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};

// Cantidad documentada aún no recibida.
const pendingQuantityTdStyle = {
    ...quantityTotalTdStyle,
    color: "#c2410c",
    fontWeight: "800",
};

// Estado fijo para material no recibido.
const unavailableBadgeStyle = {
    display: "inline-block",
    minWidth: "100px",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#b91c1c",
    fontSize: "11px",
    fontWeight: "900",
    textAlign: "center" as const,
    whiteSpace: "nowrap" as const,
};