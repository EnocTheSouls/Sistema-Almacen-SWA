import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  FormEvent,
} from "react";

import axios from "axios";

import {
  obtenerProyectos,
} from "../../services/proyectoService";

import {
  obtenerFamilias,
} from "../../services/familiaService";

import {
  obtenerEstaciones,
} from "../../services/estacionService";

import {
  obtenerContextoMaterialEstacion,
  obtenerMateriales,
  validarMaterialQr,
} from "../../services/materialService";

import type {
  MaterialQrContexto,
} from "../../services/materialService";

import {
  crearSolicitud,
} from "../../services/solicitudService";

import type {
  Proyecto,
} from "../../types/proyecto";

import type {
  Familia,
} from "../../types/familia";

import type {
  Estacion,
} from "../../types/estacion";

import type {
  MaterialCatalogo,
} from "../../types/material";

import type {
  Solicitud,
} from "../../types/solicitud";


interface NuevaSolicitudModalProps {
  onCerrar: () => void;

  onSolicitudCreada: (
    solicitud: Solicitud
  ) => void;
}

interface MaterialSeleccionado {
  idMaterial: number;
  numeroParte: string;
  descripcion: string;
  cantidad: string;

  idBomDetalle: number | null;
  idArnes: number | null;
  numeroArnes: string | null;

  idEstacion: number | null;
  nombreEstacion: string | null;

  origen: "MANUAL" | "ESCANEO";

  requiereCantidad: boolean;

  cantidadBolsas: number | null;

  stdPackHistorico: number | null;

  bolsasCalculadas: number | null;

  maximoBolsas: number | null;
}

export function NuevaSolicitudModal({
  onCerrar,
  onSolicitudCreada,
}: NuevaSolicitudModalProps) {
  const [proyectos, setProyectos] =
    useState<Proyecto[]>([]);

  const [familias, setFamilias] =
    useState<Familia[]>([]);


  const [estaciones, setEstaciones] =
    useState<Estacion[]>([]);

  const [
    catalogoMateriales,
    setCatalogoMateriales,
  ] = useState<MaterialCatalogo[]>([]);

  const [
    idProyecto,
    setIdProyecto,
  ] = useState(0);

  const [
    idFamilia,
    setIdFamilia,
  ] = useState(0);

  const [
    idEstacion,
    setIdEstacion,
  ] = useState(0);

  const [
    busquedaMaterial,
    setBusquedaMaterial,
  ] = useState("");
  // Contexto completo validado desde el QR.
  const [
    contextoQrPendiente,
    setContextoQrPendiente,
  ] = useState<MaterialQrContexto | null>(
    null
  );

  // Indica que el QR se está validando.
  const [
    validandoQr,
    setValidandoQr,
  ] = useState(false);

  const [
    solicitudConQr,
    setSolicitudConQr,
  ] = useState(false);




  // Material seleccionado antes de agregarlo a la lista.
  const [
    materialPendiente,
    setMaterialPendiente,
  ] = useState<MaterialCatalogo | null>(
    null
  );

  // Cantidad que se agregará a la solicitud.
  const [
    cantidadPendiente,
    setCantidadPendiente,
  ] = useState("1");

  // Referencias para devolver el foco.
  const inputEscaneoRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const [
    materiales,
    setMateriales,
  ] = useState<MaterialSeleccionado[]>([]);

  const [
    mostrarBusquedaManual,
    setMostrarBusquedaManual,
  ] = useState(false);

  const [cargando, setCargando] =
    useState(true);

  const [enviando, setEnviando] =
    useState(false);

  const [error, setError] =
    useState("");


  // Devuelve el cursor al campo de escaneo.
  const enfocarEscaneo = () => {
    window.setTimeout(() => {
      inputEscaneoRef.current?.focus();
      inputEscaneoRef.current?.select();
    }, 0);
  };


  // Abre o cierra Proyecto, Familia y Estación.
  const alternarSeleccionManual = () => {
    setMostrarBusquedaManual(
      (estadoActual) => {
        const nuevoEstado =
          !estadoActual;

        // Cuando se oculta Destino,
        // regresa el cursor al escaneo.
        if (!nuevoEstado) {
          setBusquedaMaterial("");
          setMaterialPendiente(null);
          setContextoQrPendiente(null);
          setCantidadPendiente("1");
          setError("");

          enfocarEscaneo();
        }

        return nuevoEstado;
      }
    );
  };

  // Detecta la vista móvil del dispositivo.
  const [
    modoMovil,
    setModoMovil,
  ] = useState(
    () =>
      window.matchMedia(
        "(max-width: 768px)"
      ).matches
  );

  // Carga los catálogos usados por la solicitud.
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        setCargando(true);
        setError("");

        const [
          proyectosData,
          familiasData,
          estacionesData,
          materialesData,
        ] = await Promise.all([
          obtenerProyectos(),
          obtenerFamilias(),
          obtenerEstaciones(),
          obtenerMateriales(),
        ]);

        setProyectos(proyectosData);
        setFamilias(familiasData);
        setEstaciones(estacionesData);
        setCatalogoMateriales(
          materialesData
        );
      } catch (errorCarga) {
        console.error(
          "Error al cargar catálogos:",
          errorCarga
        );

        setError(
          "No se pudieron cargar los catálogos."
        );
      } finally {
        setCargando(false);
      }
    };

    cargarCatalogos();
  }, []);

  useEffect(() => {
    if (cargando) {
      return;
    }

    const temporizador =
      window.setTimeout(() => {
        inputEscaneoRef.current?.focus();
        inputEscaneoRef.current?.select();
      }, 0);

    return () => {
      window.clearTimeout(
        temporizador
      );
    };
  }, [cargando]);

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(max-width: 768px)"
      );

    const actualizarModoMovil = (
      event: MediaQueryListEvent
    ) => {
      setModoMovil(
        event.matches
      );
    };

    setModoMovil(
      mediaQuery.matches
    );

    mediaQuery.addEventListener(
      "change",
      actualizarModoMovil
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        actualizarModoMovil
      );
    };
  }, []);




  const proyectosDisponibles =
    useMemo(
      () =>
        proyectos.filter(
          (proyecto) =>
            proyecto.activo
        ),
      [proyectos]
    );

  const familiasDisponibles =
    useMemo(
      () =>
        familias.filter(
          (familia) =>
            familia.activo &&
            familia.idProyecto ===
            idProyecto
        ),
      [
        familias,
        idProyecto,
      ]
    );

  const estacionesDisponibles =
    useMemo(
      () =>
        estaciones.filter(
          (estacion) =>
            estacion.activo &&
            estacion.idFamilia ===
            idFamilia
        ),
      [
        estaciones,
        idFamilia,
      ]
    );
  const materialesEncontrados =
    useMemo(() => {
      const termino =
        busquedaMaterial
          .trim()
          .toLowerCase();

      if (!termino) {
        return [];
      }

      return catalogoMateriales
        .filter(
          (material) =>
            material.activo &&
            (
              material.genericCode === "C" ||
              material.genericCode === "P"
            )
        )

        .filter((material) => {
          const numeroParte =
            material.numeroParteMaterial
              .toLowerCase();

          const descripcion =
            material.descripcion
              .toLowerCase();

          const codigoBarras =
            material.codigoBarras
              ?.toLowerCase() ?? "";

          const serialKits =
            material.serialKits
              ?.toLowerCase() ?? "";

          return (
            numeroParte.includes(
              termino
            ) ||
            descripcion.includes(
              termino
            ) ||
            codigoBarras.includes(
              termino
            ) ||
            serialKits.includes(
              termino
            )
          );
        })
        .slice(0, 8);
    }, [
      busquedaMaterial,
      catalogoMateriales,
    ]);

  const manejarCambioProyecto = (
    nuevoIdProyecto: number
  ) => {
    setIdProyecto(
      nuevoIdProyecto
    );

    setIdFamilia(0);
    setIdEstacion(0);
    setError("");
  };

  const manejarCambioFamilia = (
    nuevoIdFamilia: number
  ) => {
    setIdFamilia(
      nuevoIdFamilia
    );
    setIdEstacion(0);
    setError("");
  };
  // Valida el QR y completa automáticamente
  // proyecto, familia y estación.
  const procesarQrContextual = async (
    contenidoQr: string
  ) => {
    const contenidoLimpio =
      contenidoQr.trim();

    if (
      !contenidoLimpio
        .toUpperCase()
        .startsWith("SWA|")
    ) {
      return false;
    }

    try {
      setValidandoQr(true);
      setError("");

      const contexto =
        await validarMaterialQr(
          contenidoLimpio
        );

      // Después del primer material, solamente
      // se exige el mismo proyecto y familia.
      // La estación puede ser diferente.
      if (materiales.length > 0) {
        if (
          idProyecto !==
          contexto.idProyecto
        ) {
          setError(
            `El material pertenece al proyecto ${contexto.proyecto}, pero la solicitud actual corresponde a otro proyecto.`
          );

          setBusquedaMaterial("");

          window.setTimeout(() => {
            inputEscaneoRef.current?.focus();
          }, 0);

          return true;
        }

        if (
          idFamilia !==
          contexto.idFamilia
        ) {
          setError(
            `El material pertenece a la familia ${contexto.familia}, pero la solicitud actual corresponde a otra familia.`
          );

          setBusquedaMaterial("");

          window.setTimeout(() => {
            inputEscaneoRef.current?.focus();
          }, 0);

          return true;
        }
      }

      setIdProyecto(
        contexto.idProyecto
      );

      setIdFamilia(
        contexto.idFamilia
      );

      setIdEstacion(
        contexto.idEstacion
      );

      setContextoQrPendiente(
        contexto
      );
      setSolicitudConQr(
        true
      );

      // Localiza el material real dentro
      // del catálogo previamente cargado.
      const materialCatalogo =
        catalogoMateriales.find(
          (material) =>
            material.idMaterial ===
            contexto.idMaterial
        );

      if (!materialCatalogo) {
        setContextoQrPendiente(
          null
        );

        setError(
          "El material del QR no está disponible en el catálogo activo."
        );

        setBusquedaMaterial("");

        window.setTimeout(() => {
          inputEscaneoRef.current?.focus();
        }, 0);

        return true;
      }

      setMaterialPendiente(
        materialCatalogo
      );

      setCantidadPendiente(
        contexto.maximoBolsas != null &&
          contexto.maximoBolsas > 0
          ? "1"
          : "0"
      );

      // Si solamente puede solicitar una bolsa,
      // se agrega automáticamente.
      if (
        Number(contexto.stdPack ?? 0) > 0 &&
        (contexto.maximoBolsas ?? 0) === 1
      ) {
        autoAgregarUnaBolsa(
          materialCatalogo,
          contexto
        );
        return;
      }


      setBusquedaMaterial("");
      setError("");

      return true;
    } catch (errorQr) {
      console.error(
        "Error al validar QR:",
        errorQr
      );

      setBusquedaMaterial("");
      setContextoQrPendiente(null);
      setMaterialPendiente(null);

      setError(
        obtenerMensajeErrorQr(
          errorQr
        )
      );

      window.setTimeout(() => {
        inputEscaneoRef.current?.focus();
      }, 0);

      return true;
    } finally {
      setValidandoQr(false);
    }
  };

  // Consulta el contexto BOM del material
  // para la estación seleccionada.
  const agregarMaterial = async (
    material: MaterialCatalogo
  ) => {
    if (idEstacion <= 0) {
      setError(
        "Primero selecciona una estación."
      );

      return;
    }

    try {
      setValidandoQr(true);
      setError("");

      const contexto =
        await obtenerContextoMaterialEstacion(
          material.idMaterial,
          idEstacion
        );

      setContextoQrPendiente(
        contexto
      );

      setMaterialPendiente(
        material
      );

      setCantidadPendiente(
        contexto.maximoBolsas != null &&
          contexto.maximoBolsas > 0
          ? "1"
          : "0"
      );

      if (
        Number(contexto.stdPack ?? 0) > 0 &&
        (contexto.maximoBolsas ?? 0) === 1
      ) {
        autoAgregarUnaBolsa(
          material,
          contexto
        );

        return;
      }

      setBusquedaMaterial("");
      


    } catch (errorContexto) {
      console.error(
        "Error al obtener contexto BOM:",
        errorContexto
      );

      setContextoQrPendiente(null);
      setMaterialPendiente(null);
      setBusquedaMaterial("");

      if (
        axios.isAxiosError(
          errorContexto
        )
      ) {
        const mensaje =
          errorContexto.response
            ?.data?.mensaje;

        if (
          typeof mensaje === "string"
        ) {
          setError(mensaje);
          return;
        }
      }

      setError(
        "El material no pertenece a la estación seleccionada."
      );
    } finally {
      setValidandoQr(false);
    }
  };



  // Descarta el material y prepara
  // inmediatamente el siguiente escaneo.
  const cancelarMaterialPendiente = () => {
    setMaterialPendiente(null);

    setContextoQrPendiente(
      null
    );

    setCantidadPendiente("1");
    setBusquedaMaterial("");
    setMostrarBusquedaManual(false);
    setError("");

    enfocarEscaneo();
  };
  const agregarDirectamenteMaterial = (
    materialPendiente: MaterialCatalogo,
    contextoQrPendiente: MaterialQrContexto
  ) => {

    const stdPackDisponible =
      Number(
        contextoQrPendiente.stdPack ?? 0
      );

    setMateriales((materialesActuales) => {

      const materialExistente =
        materialesActuales.find(
          (material) =>
            material.idMaterial ===
            materialPendiente.idMaterial &&
            material.idBomDetalle ===
            contextoQrPendiente.idBomDetalle &&
            material.idEstacion ===
            contextoQrPendiente.idEstacion
        );

      if (materialExistente) {

        const nuevasBolsas =
          (materialExistente.cantidadBolsas ?? 0) + 1;

        return materialesActuales.map(
          (material) =>
            material.idMaterial ===
              materialPendiente.idMaterial &&
              material.idBomDetalle ===
              contextoQrPendiente.idBomDetalle &&
              material.idEstacion ===
              contextoQrPendiente.idEstacion
              ? {
                ...material,
                cantidadBolsas: nuevasBolsas,
                cantidad: String(
                  nuevasBolsas *
                  stdPackDisponible
                ),
              }
              : material
        );
      }

      return [
        ...materialesActuales,
        {
          idMaterial:
            materialPendiente.idMaterial,

          numeroParte:
            materialPendiente.numeroParteMaterial,

          descripcion:
            materialPendiente.descripcion,

          cantidad: String(
            stdPackDisponible
          ),

          idBomDetalle:
            contextoQrPendiente.idBomDetalle,

          idArnes:
            contextoQrPendiente.idArnes,

          numeroArnes:
            contextoQrPendiente.numeroArnes,

          idEstacion:
            contextoQrPendiente.idEstacion,

          nombreEstacion:
            contextoQrPendiente.estacion,

          origen: "ESCANEO",

          requiereCantidad: true,

          cantidadBolsas: 1,

          stdPackHistorico:
            stdPackDisponible,

          bolsasCalculadas:
            contextoQrPendiente.bolsasCalculadas,

          maximoBolsas:
            contextoQrPendiente.maximoBolsas,
        },
      ];
    });
    setMaterialPendiente(null);
    setContextoQrPendiente(null);
    setCantidadPendiente("1");
    setBusquedaMaterial("");
    setMostrarBusquedaManual(false);
    setError("");

    enfocarEscaneo();

  };

  const autoAgregarUnaBolsa = (
    material: MaterialCatalogo,
    contexto: MaterialQrContexto
  ) => {

    agregarDirectamenteMaterial(
      material,
      contexto
    );

  };

  // Confirma y agrega el material a la lista.
  const confirmarMaterialPendiente = () => {
    if (!materialPendiente) {
      setError(
        "Escanea o selecciona un material."
      );

      inputEscaneoRef.current?.focus();
      return;
    }

    const cantidad =
      Number(cantidadPendiente);

    const stdPackDisponible =
      Number(
        contextoQrPendiente
          ?.stdPack ??
        materialPendiente.stdPack ??
        0
      );

    const requiereCantidad =
      stdPackDisponible > 0;

    if (
      requiereCantidad &&
      (
        !Number.isInteger(cantidad) ||
        cantidad <= 0
      )
    ) {
      setError(
        "La cantidad de bolsas debe ser un número entero mayor que cero."
      );
      return;
    }

    if (
      requiereCantidad &&
      contextoQrPendiente
        ?.maximoBolsas != null &&
      cantidad >
      contextoQrPendiente.maximoBolsas
    ) {
      setError(
        `Solo quedan disponibles ${contextoQrPendiente.maximoBolsas} bolsas para hoy.`
      );

      return;
    }



    setMateriales(
      (materialesActuales) => {
        const idBomDetallePendiente =
          contextoQrPendiente
            ?.idBomDetalle ?? null;

        const idEstacionPendiente =
          contextoQrPendiente
            ?.idEstacion ?? null;

        const materialExistente =
          materialesActuales.find(
            (material) =>
              material.idMaterial ===
              materialPendiente.idMaterial &&
              material.idBomDetalle ===
              idBomDetallePendiente &&
              material.idEstacion ===
              idEstacionPendiente
          );

        if (materialExistente) {
          if (!requiereCantidad) {
            return materialesActuales;
          }

          const bolsasActuales =
            materialExistente
              .cantidadBolsas ?? 0;

          const nuevasBolsas =
            bolsasActuales +
            cantidad;

          const maximoBolsas =
            contextoQrPendiente
              ?.maximoBolsas ??
            materialExistente
              .maximoBolsas;

          if (
            maximoBolsas != null &&
            nuevasBolsas >
            maximoBolsas
          ) {
            setError(
              `El máximo permitido para este material es ${maximoBolsas} bolsas.`
            );

            return materialesActuales;
          }

          const stdPack =
            contextoQrPendiente
              ?.stdPack ??
            materialExistente
              .stdPackHistorico ??
            0;

          return materialesActuales.map(
            (material) =>
              material.idMaterial ===
                materialPendiente.idMaterial &&
                material.idBomDetalle ===
                idBomDetallePendiente &&
                material.idEstacion ===
                idEstacionPendiente
                ? {
                  ...material,

                  cantidadBolsas:
                    nuevasBolsas,

                  cantidad:
                    String(
                      nuevasBolsas *
                      stdPack
                    ),
                }
                : material
          );
        }

        return [
          ...materialesActuales,
          {
            idMaterial:
              materialPendiente.idMaterial,

            numeroParte:
              materialPendiente
                .numeroParteMaterial,

            descripcion:
              materialPendiente.descripcion,

            // Para materiales con empaque guarda
            // las piezas equivalentes.
            cantidad:
              requiereCantidad
                ? String(
                  cantidad *
                  stdPackDisponible
                )
                : "0",

            idBomDetalle:
              contextoQrPendiente
                ?.idBomDetalle ?? null,

            idArnes:
              contextoQrPendiente
                ?.idArnes ?? null,

            numeroArnes:
              contextoQrPendiente
                ?.numeroArnes ?? null,

            idEstacion:
              contextoQrPendiente
                ?.idEstacion ?? null,

            nombreEstacion:
              contextoQrPendiente
                ?.estacion ?? null,

            origen:
              contextoQrPendiente
                ? "ESCANEO"
                : "MANUAL",

            requiereCantidad,

            cantidadBolsas:
              requiereCantidad
                ? cantidad
                : null,

            stdPackHistorico:
              requiereCantidad
                ? stdPackDisponible
                : null,

            bolsasCalculadas:
              contextoQrPendiente
                ?.bolsasCalculadas ?? null,

            maximoBolsas:
              contextoQrPendiente
                ?.maximoBolsas ?? null,
          },

        ];
      }
    );

    setMaterialPendiente(null);
    setContextoQrPendiente(null);
    setCantidadPendiente("1");
    setBusquedaMaterial("");
    setError("");


    // Recupera el foco para continuar escaneando.
    window.setTimeout(() => {
      inputEscaneoRef.current?.focus();
    }, 0);
  };


  const quitarMaterial = (
    idMaterial: number,
    idBomDetalle: number | null,
    idEstacion: number | null
  ) => {
    setMateriales(
      (materialesActuales) =>
        materialesActuales.filter(
          (material) =>
            !(
              material.idMaterial ===
              idMaterial &&
              material.idBomDetalle ===
              idBomDetalle &&
              material.idEstacion ===
              idEstacion
            )
        )
    );
    setMaterialPendiente(null);
    setContextoQrPendiente(null);
    setCantidadPendiente("1");
    setBusquedaMaterial("");
    setMostrarBusquedaManual(false);
    setError("");

    enfocarEscaneo();


  };

  const obtenerMensajeErrorQr = (
    errorQr: unknown
  ) => {
    if (
      axios.isAxiosError(
        errorQr
      )
    ) {
      const mensaje =
        errorQr.response
          ?.data?.mensaje;

      if (
        typeof mensaje === "string"
      ) {
        return mensaje;
      }

      const detalle =
        errorQr.response
          ?.data?.detail;

      if (
        typeof detalle === "string"
      ) {
        return detalle;
      }
    }

    return "No se pudo validar la etiqueta QR.";
  };

  const obtenerMensajeError = (
    errorSolicitud: unknown
  ) => {
    if (
      axios.isAxiosError(
        errorSolicitud
      )
    ) {
      const mensaje =
        errorSolicitud.response
          ?.data?.mensaje;

      if (
        typeof mensaje === "string"
      ) {
        return mensaje;
      }

      const detalle =
        errorSolicitud.response
          ?.data?.detail;

      if (
        typeof detalle === "string"
      ) {
        return detalle;
      }
    }

    return "No se pudo registrar la solicitud.";
  };

  const guardarSolicitud = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");

    if (idProyecto <= 0) {
      setError(
        "Debes seleccionar un proyecto."
      );

      return;
    }

    if (idFamilia <= 0) {
      setError(
        "Debes seleccionar una familia."
      );

      return;
    }

    if (idEstacion <= 0) {
      setError(
        "Debes seleccionar una estación."
      );

      return;
    }

    if (materiales.length === 0) {
      setError(
        "Debes agregar al menos un material."
      );

      return;
    }

    const cantidadInvalida =
      materiales.some(
        (material) => {
          if (
            !material.requiereCantidad
          ) {
            return false;
          }

          const bolsas =
            material.cantidadBolsas;

          return (
            bolsas == null ||
            !Number.isInteger(
              bolsas
            ) ||
            bolsas <= 0 ||
            (
              material.maximoBolsas !=
              null &&
              bolsas >
              material.maximoBolsas
            )
          );
        }
      );

    if (cantidadInvalida) {
      setError(
        "Las bolsas deben ser números enteros y respetar el máximo permitido."
      );

      return;
    }

    try {
      setEnviando(true);

      const solicitudCreada =
        await crearSolicitud({
          idProyecto,
          idFamilia,
          idEstacion,

          origenSolicitud:
            solicitudConQr
              ? "ESCANEO"
              : "MANUAL",

          materiales:
            materiales.map(
              (material) => ({
                idMaterial:
                  material.idMaterial,

                idBomDetalle:
                  material.idBomDetalle,

                idArnes:
                  material.idArnes,

                idEstacion:
                  material.idEstacion,

                requiereCantidad:
                  material.requiereCantidad,

                cantidadBolsas:
                  material.requiereCantidad
                    ? material
                      .cantidadBolsas
                    : null,

                stdPackHistorico:
                  material.requiereCantidad
                    ? material
                      .stdPackHistorico
                    : null,

                cantidadSolicitada:
                  material.requiereCantidad
                    ? Number(
                      material.cantidad
                    )
                    : 0,
              })
            ),
        });

      onSolicitudCreada(
        solicitudCreada
      );
    } catch (errorSolicitud) {
      console.error(
        "Error al crear solicitud:",
        errorSolicitud
      );

      setError(
        obtenerMensajeError(
          errorSolicitud
        )
      );
    } finally {
      setEnviando(false);
    }
  };





  const cerrarModal = () => {
    if (enviando) {
      return;
    }

    onCerrar();
  };

  return (
    <div
      style={{
        ...overlayStyle,
        alignItems:
          modoMovil
            ? "stretch"
            : "center",
        padding:
          modoMovil
            ? 0
            : "24px",
      }}
    >

      <section
        style={{
          ...modalStyle,
          maxWidth:
            modoMovil
              ? "100%"
              : "1050px",
          maxHeight:
            modoMovil
              ? "100vh"
              : "92vh",
          minHeight:
            modoMovil
              ? "100vh"
              : "auto",
          padding:
            modoMovil
              ? "16px"
              : "28px",
          borderRadius:
            modoMovil
              ? 0
              : "16px",
        }}
      >
        <div
          style={{
            ...headerStyle,
            gap:
              modoMovil
                ? "12px"
                : "20px",
            marginBottom:
              modoMovil
                ? "18px"
                : "24px",
          }}
        >
          <div>
            <h2
              style={{
                ...titleStyle,
                fontSize:
                  modoMovil
                    ? "22px"
                    : "25px",
              }}
            >
              Nueva solicitud
            </h2>

            <p style={descriptionStyle}>
              Selecciona el destino y agrega
              los materiales requeridos.
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={enviando}
            style={closeButtonStyle}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        {cargando ? (
          <div style={messageStyle}>
            Cargando catálogos...
          </div>
        ) : (
          <form
            onSubmit={
              guardarSolicitud
            }
          >
            <div style={materialsHeaderStyle}>
              <h3 style={sectionTitleStyle}>
                Materiales
              </h3>

              <span style={counterStyle}>
                {materiales.length}{" "}
                {materiales.length === 1
                  ? "material"
                  : "materiales"}
              </span>
            </div>

            <div style={searchContainerStyle}>
              <label
                htmlFor="buscarMaterialSolicitud"
                style={labelStyle}
              >
                Buscar o escanear material
              </label>

              <input
                ref={inputEscaneoRef}
                id="buscarMaterialSolicitud"
                type="text"
                value={busquedaMaterial}
                onChange={(event) => {
                  setBusquedaMaterial(
                    event.target.value
                  );

                  setMaterialPendiente(null);
                  setContextoQrPendiente(null);
                  setError("");
                }}
                onKeyDown={async (event) => {
                  if (event.key !== "Enter") {
                    return;
                  }

                  event.preventDefault();

                  const contenido =
                    busquedaMaterial.trim();

                  if (!contenido) {
                    enfocarEscaneo();
                    return;
                  }

                  const esQr =
                    await procesarQrContextual(
                      contenido
                    );

                  if (esQr) {
                    return;
                  }

                  const contenidoNormalizado =
                    contenido.toUpperCase();

                  const materialExacto =
                    materialesEncontrados.find(
                      (material) =>
                        material
                          .numeroParteMaterial
                          .trim()
                          .toUpperCase() ===
                        contenidoNormalizado ||
                        (
                          material.codigoBarras
                            ?.trim()
                            .toUpperCase() ??
                          ""
                        ) ===
                        contenidoNormalizado
                    );

                  if (materialExacto) {
                    await agregarMaterial(
                      materialExacto
                    );

                    return;
                  }

                  setError(
                    "No se encontró una coincidencia exacta para el código escaneado."
                  );

                  setBusquedaMaterial("");
                  enfocarEscaneo();
                }}
                disabled={
                  enviando ||
                  validandoQr
                }
                placeholder={
                  validandoQr
                    ? "Validando etiqueta QR..."
                    : "Escanea un QR o busca un material"
                }
                autoComplete="off"
                autoFocus
                style={inputStyle}
              />

              <button
                type="button"
                onClick={
                  alternarSeleccionManual
                }
                disabled={
                  enviando ||
                  validandoQr
                }
                aria-expanded={
                  mostrarBusquedaManual
                }
                style={{
                  ...secondaryButtonStyle,
                  width: "100%",
                  marginTop: "8px",
                }}
              >
                {mostrarBusquedaManual
                  ? "Ocultar selección manual"
                  : "Selección manual"}
              </button>

              {mostrarBusquedaManual &&
                busquedaMaterial.trim() &&
                materialesEncontrados.length > 0 &&
                !busquedaMaterial
                  .trim()
                  .toUpperCase()
                  .startsWith("SWA|") && (
                  <div style={resultsStyle}>
                    {materialesEncontrados.map(
                      (material) => (
                        <button
                          key={
                            material.idMaterial
                          }
                          type="button"
                          disabled={
                            enviando ||
                            validandoQr
                          }
                          onClick={async () => {
                            await agregarMaterial(
                              material
                            );
                          }}
                          style={resultButtonStyle}
                        >
                          <strong>
                            {
                              material
                                .numeroParteMaterial
                            }
                          </strong>

                          <span
                            style={
                              resultDescriptionStyle
                            }
                          >
                            {material.descripcion}
                          </span>

                          {material.codigoBarras && (
                            <small>
                              Código:{" "}
                              {
                                material
                                  .codigoBarras
                              }
                            </small>
                          )}
                        </button>
                      )
                    )}
                  </div>
                )}

              {mostrarBusquedaManual &&
                busquedaMaterial.trim() &&
                materialesEncontrados.length === 0 &&
                !validandoQr &&
                !busquedaMaterial
                  .trim()
                  .toUpperCase()
                  .startsWith("SWA|") && (
                  <div style={noResultsStyle}>
                    No se encontraron materiales activos.
                  </div>
                )}
            </div>

            {mostrarBusquedaManual && (
              <div
                style={{
                  marginBottom: "20px",
                  padding: "16px",
                  border:
                    "1px solid #e2e8f0",
                  borderRadius: "10px",
                  background: "#f8fafc",
                }}
              >
                <h3 style={sectionTitleStyle}>
                  Destino
                </h3>

                <div
                  style={{
                    ...selectorsGridStyle,

                    gridTemplateColumns:
                      modoMovil
                        ? "1fr"
                        : "repeat(auto-fit, minmax(220px, 1fr))",

                    gap:
                      modoMovil
                        ? "12px"
                        : "15px",
                  }}
                >
                  <div style={formGroupStyle}>
                    <label
                      htmlFor="nuevoProyecto"
                      style={labelStyle}
                    >
                      Proyecto *
                    </label>

                    <select
                      id="nuevoProyecto"
                      value={
                        idProyecto > 0
                          ? idProyecto
                          : ""
                      }
                      onChange={(event) =>
                        manejarCambioProyecto(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      disabled={enviando}
                      style={inputStyle}
                    >
                      <option value="">
                        Seleccionar proyecto
                      </option>

                      {proyectosDisponibles.map(
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
                  </div>

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="nuevaFamilia"
                      style={labelStyle}
                    >
                      Familia *
                    </label>

                    <select
                      id="nuevaFamilia"
                      value={
                        idFamilia > 0
                          ? idFamilia
                          : ""
                      }
                      onChange={(event) =>
                        manejarCambioFamilia(
                          Number(
                            event.target.value
                          )
                        )
                      }
                      disabled={
                        enviando ||
                        idProyecto <= 0 ||
                        materiales.length > 0
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        {idProyecto > 0
                          ? "Seleccionar familia"
                          : "Selecciona un proyecto"}
                      </option>

                      {familiasDisponibles.map(
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

                  <div style={formGroupStyle}>
                    <label
                      htmlFor="nuevaEstacion"
                      style={labelStyle}
                    >
                      Estación *
                    </label>

                    <select
                      id="nuevaEstacion"
                      value={
                        idEstacion > 0
                          ? idEstacion
                          : ""
                      }
                      onChange={(event) => {
                        setIdEstacion(
                          Number(
                            event.target.value
                          )
                        );

                        setMaterialPendiente(
                          null
                        );

                        setContextoQrPendiente(
                          null
                        );

                        setCantidadPendiente("1");
                        setBusquedaMaterial("");
                        setError("");
                      }}
                      disabled={
                        enviando ||
                        idFamilia <= 0
                      }
                      style={inputStyle}
                    >
                      <option value="">
                        {idFamilia > 0
                          ? "Seleccionar estación"
                          : "Selecciona una familia"}
                      </option>

                      {estacionesDisponibles.map(
                        (estacion) => (
                          <option
                            key={
                              estacion.idEstacion
                            }
                            value={
                              estacion.idEstacion
                            }
                          >
                            {estacion.nombre}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {idProyecto > 0 &&
                  familiasDisponibles.length ===
                  0 && (
                    <div style={warningStyle}>
                      El proyecto no tiene familias activas.
                    </div>
                  )}

                {idFamilia > 0 &&
                  estacionesDisponibles.length ===
                  0 && (
                    <div style={warningStyle}>
                      La familia no tiene estaciones activas.
                    </div>
                  )}
              </div>
            )}

            <div
              style={{
                ...separatorStyle,

                margin:
                  modoMovil
                    ? "20px 0"
                    : "26px 0",
              }}
            />

            {materialPendiente && (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "14px",
                  border: "1px solid #bfdbfe",
                  borderRadius: "10px",
                  background: "#eff6ff",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#102957",
                    fontSize: "15px",
                  }}
                >
                  {
                    materialPendiente
                      .numeroParteMaterial
                  }
                </strong>
                <p
                  style={{
                    margin: "5px 0 14px",
                    color: "#475569",
                    fontSize: "13px",
                  }}
                >
                  {materialPendiente.descripcion}
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      modoMovil
                        ? "1fr"
                        : "minmax(160px, 1fr) auto",
                    alignItems: "end",
                    gap: "10px",
                  }}
                >
                  <div style={formGroupStyle}>
                    {Number(
                      contextoQrPendiente
                        ?.stdPack ??
                      materialPendiente.stdPack ??
                      0
                    ) > 0 ? (
                      <>
                        <label
                          htmlFor="cantidadMaterialPendiente"
                          style={labelStyle}
                        >
                          Seleccionar cantidad de bolsas *
                        </label>

                        {contextoQrPendiente
                          ?.maximoBolsas != null &&
                          contextoQrPendiente.maximoBolsas > 0 ? (
                          <>
                            <select
                              id="cantidadMaterialPendiente"
                              value={cantidadPendiente}
                              onChange={(event) => {
                                setCantidadPendiente(
                                  event.target.value
                                );

                                setError("");
                              }}
                              disabled={enviando}
                              style={inputStyle}
                            >
                              {Array.from(
                                {
                                  length:
                                    contextoQrPendiente
                                      .maximoBolsas,
                                },
                                (_, indice) =>
                                  indice + 1
                              ).map((bolsas) => (
                                <option
                                  key={bolsas}
                                  value={bolsas}
                                >
                                  {bolsas}{" "}
                                  {bolsas === 1
                                    ? "bolsa"
                                    : "bolsas"}
                                </option>
                              ))}
                            </select>

                            <div
                              style={{
                                padding: "10px 12px",
                                borderRadius: "8px",
                                background: "#dbeafe",
                                color: "#1e3a8a",
                                fontSize: "13px",
                                fontWeight: "700",
                              }}
                            >
                              Selección:{" "}
                              {cantidadPendiente}{" "}
                              {Number(
                                cantidadPendiente
                              ) === 1
                                ? "bolsa"
                                : "bolsas"}

                              {" = "}

                              {Number(
                                cantidadPendiente
                              ) *
                                Number(
                                  contextoQrPendiente
                                    ?.stdPack ??
                                  materialPendiente
                                    .stdPack ??
                                  0
                                )}{" "}
                              piezas
                            </div>

                            <small
                              style={{
                                color: "#475569",
                                lineHeight: 1.5,
                              }}
                            >
                              Plan diario:{" "}
                              <strong>
                                {contextoQrPendiente
                                  ?.plan ??
                                  "Sin plan"}
                              </strong>

                              {" · "}

                              BOM Qty:{" "}
                              <strong>
                                {contextoQrPendiente
                                  ?.bomQty ??
                                  "Sin BOM"}
                              </strong>

                              {" · "}

                              Std Pack:{" "}
                              <strong>
                                {contextoQrPendiente
                                  ?.stdPack ??
                                  materialPendiente
                                    .stdPack ??
                                  "Sin Standard Pack"}
                              </strong>

                              {" · "}

                              Disponible hoy:{" "}
                              <strong>
                                {contextoQrPendiente
                                  .maximoBolsas}{" "}
                                {contextoQrPendiente
                                  .maximoBolsas === 1
                                  ? "bolsa"
                                  : "bolsas"}
                              </strong>
                            </small>
                          </>
                        ) : (
                          <div style={warningStyle}>
                            El requerimiento diario de este
                            material ya fue solicitado.
                          </div>
                        )}
                      </>
                    ) : (
                      <div
                        style={{
                          padding: "12px",
                          border:
                            "1px solid #fed7aa",
                          borderRadius: "8px",
                          background: "#fff7ed",
                          color: "#9a3412",
                          fontSize: "13px",
                          fontWeight: "700",
                        }}
                      >
                        Material sin Standard Pack.
                        Se agregará sin cantidad.
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",

                      width:
                        modoMovil
                          ? "100%"
                          : "145px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={
                        confirmarMaterialPendiente
                      }
                      disabled={
                        enviando ||
                        validandoQr ||
                        (
                          Number(
                            contextoQrPendiente
                              ?.stdPack ?? 0
                          ) > 0 &&
                          (
                            contextoQrPendiente
                              ?.maximoBolsas == null ||
                            contextoQrPendiente
                              .maximoBolsas <= 0
                          )
                        )
                      }
                      style={{
                        ...primaryButtonStyle,

                        width: "100%",
                        minHeight: "44px",

                        opacity:
                          enviando ||
                            validandoQr ||
                            (
                              Number(
                                contextoQrPendiente
                                  ?.stdPack ?? 0
                              ) > 0 &&
                              (
                                contextoQrPendiente
                                  ?.maximoBolsas == null ||
                                contextoQrPendiente
                                  .maximoBolsas <= 0
                              )
                            )
                            ? 0.65
                            : 1,

                        cursor:
                          enviando ||
                            validandoQr ||
                            (
                              Number(
                                contextoQrPendiente
                                  ?.stdPack ?? 0
                              ) > 0 &&
                              (
                                contextoQrPendiente
                                  ?.maximoBolsas == null ||
                                contextoQrPendiente
                                  .maximoBolsas <= 0
                              )
                            )
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {validandoQr
                        ? "Validando..."
                        : "Agregar"}
                    </button>

                    <button
                      type="button"
                      onClick={
                        cancelarMaterialPendiente
                      }
                      disabled={enviando}
                      style={{
                        ...secondaryButtonStyle,

                        width: "100%",
                        minHeight: "40px",
                        padding: "8px 12px",

                        opacity:
                          enviando
                            ? 0.65
                            : 1,

                        cursor:
                          enviando
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      Cancelar material
                    </button>
                  </div>
                </div>
              </div>
            )}

            {materiales.length === 0 ? (
              <div style={emptyStyle}>
                Busca o escanea un material para
                agregarlo.
              </div>
            ) : modoMovil ? (
              <div
                style={{
                  display: "grid",
                  gap: "12px",
                }}
              >
                {materiales.map(
                  (material) => (
                    <article
                      key={
                        `${material.idMaterial}-${material.idBomDetalle ?? "manual"}-${material.idEstacion ?? "sin-estacion"}`
                      }
                      style={{
                        padding: "14px",
                        borderRadius: "10px",
                        background: "#eef4ff",
                        border: "1px solid #93c5fd",
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          color: "#102957",
                          fontSize: "15px",
                        }}
                      >
                        {material.numeroParte}
                      </strong>

                      <p
                        style={{
                          margin: "6px 0 14px",
                          color: "#64748b",
                          fontSize: "13px",
                          lineHeight: 1.4,
                        }}
                      >
                        {material.descripcion}
                      </p>
                      <div style={labelStyle}>
                        {material.requiereCantidad
                          ? "Bolsas solicitadas"
                          : "Solicitud"}
                      </div>

                      <div
                        style={{
                          marginTop: "7px",
                          padding: "10px 12px",
                          border:
                            "1px solid #cbd5e1",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          color: "#102957",
                          fontWeight: "700",
                        }}
                      >
                        {material.requiereCantidad
                          ? `${material.cantidadBolsas} bolsa${material.cantidadBolsas === 1
                            ? ""
                            : "s"
                          }`
                          : "Sin cantidad"}
                      </div>

                      {material.requiereCantidad && (
                        <small
                          style={{
                            display: "block",
                            marginTop: "5px",
                            color: "#64748b",
                          }}
                        >
                          {material.cantidad} piezas
                          {" · "}
                          Std Pack:{" "}
                          {material.stdPackHistorico}
                        </small>
                      )}
                      <button
                        type="button"
                        disabled={enviando}
                        onClick={() =>
                          quitarMaterial(
                            material.idMaterial,
                            material.idBomDetalle,
                            material.idEstacion
                          )
                        }
                        style={{
                          ...removeButtonStyle,
                          width: "100%",
                          minHeight: "42px",
                          marginTop: "12px",
                        }}
                      >
                        Quitar material
                      </button>
                    </article>
                  )
                )}
              </div>
            ) : (
              <div style={tableContainerStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderStyle}>
                      <th style={thStyle}>
                        Material
                      </th>

                      <th style={thStyle}>
                        Descripción
                      </th>

                      <th style={thStyle}>
                        Bolsas / piezas
                      </th>

                      <th
                        style={{
                          ...thStyle,
                          textAlign: "right",
                        }}
                      >
                        Acción
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {materiales.map(
                      (material) => (
                        <tr
                          key={
                            `${material.idMaterial}-${material.idBomDetalle ?? "manual"}-${material.idEstacion ?? "sin-estacion"}`
                          }
                        >
                          <td style={tdStyle}>
                            <strong>
                              {material.numeroParte}
                            </strong>
                          </td>

                          <td style={tdStyle}>
                            {material.descripcion}
                          </td>

                          <td style={tdStyle}>
                            <div
                              style={{
                                fontWeight: "700",
                                color: "#102957",
                              }}
                            >
                              {material.requiereCantidad
                                ? `${material.cantidadBolsas} bolsa${material.cantidadBolsas === 1
                                  ? ""
                                  : "s"
                                }`
                                : "Sin cantidad"}
                            </div>

                            {material.requiereCantidad && (
                              <small
                                style={{
                                  display: "block",
                                  marginTop: "4px",
                                  color: "#64748b",
                                }}
                              >
                                {material.cantidad} piezas
                                {" · "}
                                Std Pack:{" "}
                                {material.stdPackHistorico}
                              </small>
                            )}
                          </td>

                          <td
                            style={{
                              ...tdStyle,
                              textAlign: "right",
                            }}
                          >
                            <button
                              type="button"
                              disabled={enviando}
                              onClick={() =>
                                quitarMaterial(
                                  material.idMaterial,
                                  material.idBomDetalle,
                                  material.idEstacion
                                )
                              }
                              style={removeButtonStyle}
                            >
                              Quitar
                            </button>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {error && (
              <div style={errorStyle}>
                {error}
              </div>
            )}

            <div
              style={{
                ...actionsStyle,
                flexDirection:
                  modoMovil
                    ? "column-reverse"
                    : "row",
                position:
                  modoMovil
                    ? "sticky"
                    : "static",
                bottom:
                  modoMovil
                    ? 0
                    : undefined,
                padding:
                  modoMovil
                    ? "12px 0 4px"
                    : 0,
                background: "#ffffff",
              }}
            >
              <button
                type="button"
                onClick={cerrarModal}
                disabled={enviando}
                style={{
                  ...secondaryButtonStyle,
                  width:
                    modoMovil
                      ? "100%"
                      : "auto",
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  enviando ||
                  cargando ||
                  materiales.length === 0
                }
                style={{
                  ...primaryButtonStyle,
                  opacity:
                    enviando ||
                      materiales.length === 0
                      ? 0.65
                      : 1,
                }}
              >
                {enviando
                  ? "Enviando..."
                  : "Enviar solicitud"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div >
  );
}

const overlayStyle = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 1100,
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
  maxWidth: "1050px",
  maxHeight: "92vh",
  overflowY: "auto" as const,
  padding: "28px",
  boxSizing: "border-box" as const,
  borderRadius: "16px",
  background: "#ffffff",
  boxShadow:
    "0 25px 70px rgba(15, 23, 42, 0.3)",
};

const headerStyle = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "20px",
  marginBottom: "24px",
};

const titleStyle = {
  margin: 0,
  color: "#102957",
  fontSize: "25px",
};

const descriptionStyle = {
  margin: "7px 0 0",
  color: "#64748b",
};

const closeButtonStyle = {
  width: "38px",
  height: "38px",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#475569",
  fontSize: "24px",
  cursor: "pointer",
};

const sectionTitleStyle = {
  margin: "0 0 15px",
  color: "#102957",
  fontSize: "18px",
};

const selectorsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "15px",
};

const formGroupStyle = {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
};

const labelStyle = {
  color: "#17335f",
  fontSize: "14px",
  fontWeight: "700",
};

const inputStyle = {
  width: "100%",
  minHeight: "44px",
  boxSizing: "border-box" as const,
  padding: "9px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#102957",
  fontSize: "14px",
  outline: "none",
};

const separatorStyle = {
  height: "1px",
  margin: "26px 0",
  background: "#e2e8f0",
};

const materialsHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "15px",
};

const emptyStyle = {
  padding: "28px",
  border: "1px dashed #93c5fd",
  borderRadius: "9px",
  background: "#eef4ff",
  color: "#64748b",
  textAlign: "center" as const,
};

const searchContainerStyle = {
  position: "relative" as const,
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginBottom: "18px",
};

const resultsStyle = {
  position: "absolute" as const,
  top: "74px",
  left: 0,
  right: 0,
  zIndex: 30,
  maxHeight: "280px",
  overflowY: "auto" as const,
  padding: "6px",
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  background: "#ffffff",
  boxShadow:
    "0 15px 35px rgba(15, 23, 42, 0.16)",
};

const resultButtonStyle = {
  width: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "flex-start",
  gap: "4px",
  padding: "11px 12px",
  border: "none",
  borderBottom:
    "1px solid #e2e8f0",
  background: "#ffffff",
  color: "#102957",
  textAlign: "left" as const,
  cursor: "pointer",
};

const resultDescriptionStyle = {
  color: "#475569",
  fontSize: "13px",
};

const noResultsStyle = {
  color: "#64748b",
  fontSize: "13px",
};

const tableContainerStyle = {
  width: "100%",
  overflowX: "auto" as const,
  border: "1px solid #e2e8f0",
  borderRadius: "9px",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse" as const,
};

const tableHeaderStyle = {
  background: "#f8fafc",
};

const thStyle = {
  padding: "12px",
  borderBottom:
    "2px solid #e2e8f0",
  color: "#102957",
  fontSize: "13px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "12px",
  borderBottom:
    "1px solid #e5e7eb",
  color: "#334155",
  fontSize: "14px",
};



const removeButtonStyle = {
  padding: "7px 11px",
  border: "1px solid #fecaca",
  borderRadius: "7px",
  background: "#fef2f2",
  color: "#b91c1c",
  fontWeight: "700",
  cursor: "pointer",
};

const warningStyle = {
  marginTop: "13px",
  padding: "11px 13px",
  borderRadius: "8px",
  background: "#fff7ed",
  color: "#9a3412",
  fontSize: "13px",
};

const errorStyle = {
  marginTop: "18px",
  padding: "13px 15px",
  border: "1px solid #fecaca",
  borderRadius: "9px",
  background: "#fef2f2",
  color: "#991b1b",
  fontSize: "14px",
};

const messageStyle = {
  padding: "35px",
  borderRadius: "9px",
  background: "#f8fafc",
  color: "#64748b",
  textAlign: "center" as const,
};

const actionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
  marginTop: "23px",
};

const primaryButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "none",
  borderRadius: "8px",
  background: "#102957",
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
};

const secondaryButtonStyle = {
  minHeight: "43px",
  padding: "10px 18px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  background: "#ffffff",
  color: "#334155",
  fontWeight: "700",
  cursor: "pointer",
};

const counterStyle = {
  padding: "7px 12px",
  borderRadius: "999px",
  background: "#dbeafe",
  color: "#1e40af",
  fontSize: "12px",
  fontWeight: "700",
};