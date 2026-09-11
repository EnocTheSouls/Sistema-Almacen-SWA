SELECT VERSION();
CREATE DATABASE IF NOT EXISTS almacen_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
USE almacen_db;
SELECT DATABASE();
 CREATE TABLE roles (
    id_rol INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    CONSTRAINT uq_roles_nombre UNIQUE (nombre)
);
CREATE TABLE usuarios (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(50) NOT NULL,
    password_hash VARCHAR(500) NOT NULL,
    id_rol INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_registro DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_usuarios_usuario UNIQUE (usuario),
    CONSTRAINT fk_usuario_rol
		FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
);
CREATE TABLE proyectos (
    id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_proyectos_nombre UNIQUE (nombre)
);
CREATE TABLE familias (
    id_familia INT AUTO_INCREMENT PRIMARY KEY,
    id_proyecto INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_familia_proyecto
        FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto),
    CONSTRAINT uq_familia_proyecto UNIQUE (id_proyecto, nombre)
);
CREATE TABLE estaciones (
    id_estacion INT AUTO_INCREMENT PRIMARY KEY,
    id_familia INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_estacion_familia
        FOREIGN KEY (id_familia) REFERENCES familias(id_familia),
    CONSTRAINT uq_estacion_familia UNIQUE (id_familia, nombre)
);
CREATE TABLE arneses (
    id_arnes INT AUTO_INCREMENT PRIMARY KEY,
    id_familia INT NOT NULL,
    numero_parte_arnes VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    nivel_diseno VARCHAR(50) NOT NULL,
    fecha_vigencia DATE NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_arnes_familia
        FOREIGN KEY (id_familia) REFERENCES familias(id_familia),
    CONSTRAINT uq_arnes_diseno UNIQUE (numero_parte_arnes, nivel_diseno)
);
CREATE TABLE materiales (
    id_material INT AUTO_INCREMENT PRIMARY KEY,
    numero_parte_material VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    unidad_medida VARCHAR(20) NULL,
    codigo_barras VARCHAR(100) NULL,
    serial_kits VARCHAR(100) NULL,
    generic_code CHAR(1) NOT NULL,
    std_pack DECIMAL(18,4) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_numero_parte UNIQUE (numero_parte_material),
    CONSTRAINT uq_codigo_barras UNIQUE (codigo_barras),
    CONSTRAINT uq_serial_kits UNIQUE (serial_kits),
    CONSTRAINT chk_material_generic_code
        CHECK (generic_code IN ('C', 'P', 'S', 'W'))
);
CREATE TABLE zonas (
    id_zona INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(10) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_zona_codigo UNIQUE (codigo)
);
CREATE TABLE zona_proyecto (
    id_zona_proyecto INT AUTO_INCREMENT PRIMARY KEY,
    id_zona INT NOT NULL,
    id_proyecto INT NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_zona_proyecto_zona
        FOREIGN KEY (id_zona) REFERENCES zonas(id_zona),
    CONSTRAINT fk_zona_proyecto_proyecto
        FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto),
    CONSTRAINT uq_zona_proyecto UNIQUE (id_zona, id_proyecto)
);
CREATE TABLE racks (
    id_rack INT AUTO_INCREMENT PRIMARY KEY,
    id_zona INT NOT NULL,
    nombre VARCHAR(30) NOT NULL,
    altura_total INT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_rack_zona
        FOREIGN KEY (id_zona) REFERENCES zonas(id_zona),
    CONSTRAINT uq_rack_zona UNIQUE (id_zona, nombre)
);
CREATE TABLE ubicaciones (
    id_ubicacion INT AUTO_INCREMENT PRIMARY KEY,
    id_rack INT NOT NULL,
    nivel CHAR(1) NOT NULL,
    posicion VARCHAR(10) NOT NULL,
    capacidad_maxima DECIMAL(18,2) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_ubicacion_rack
	FOREIGN KEY (id_rack) REFERENCES racks(id_rack),
    CONSTRAINT uq_ubicacion UNIQUE (id_rack, nivel, posicion)
);

CREATE TABLE inventario (
    id_inventario BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_material INT NOT NULL,
    id_ubicacion INT NOT NULL,
    disponible DECIMAL(18,2) NOT NULL DEFAULT 0,
    reservado DECIMAL(18,2) NOT NULL DEFAULT 0,
    no_disponible DECIMAL(18,2) NOT NULL DEFAULT 0,
    ultima_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inventario_material
        FOREIGN KEY (id_material) REFERENCES materiales(id_material),
    CONSTRAINT fk_inventario_ubicacion
        FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id_ubicacion),
    CONSTRAINT uq_inventario UNIQUE (id_material, id_ubicacion),
    CONSTRAINT chk_inventario_cantidades
        CHECK (disponible >= 0 AND reservado >= 0 AND no_disponible >= 0)
);

CREATE TABLE importaciones_bom (
    id_importacion BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre_archivo VARCHAR(255) NOT NULL,
    fecha_importacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    total_filas INT NOT NULL DEFAULT 0,
    filas_correctas INT NOT NULL DEFAULT 0,
    filas_advertencia INT NOT NULL DEFAULT 0,
    filas_con_error INT NOT NULL DEFAULT 0,
    estado VARCHAR(30) NOT NULL,
    mensaje TEXT NULL,
    CONSTRAINT fk_importacion_bom_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
CREATE TABLE staging_bom (
    id_staging BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_importacion BIGINT NOT NULL,
    numero_fila INT NOT NULL,
    linea VARCHAR(50) NULL,
    material_number VARCHAR(100) NULL,
    material_name VARCHAR(255) NULL,
    generic_code CHAR(1) NULL,
    bom_qty VARCHAR(50) NULL,
    localizacion VARCHAR(50) NULL,
    std_pack VARCHAR(50) NULL,
    arnes VARCHAR(100) NULL,
    nivel_diseno_1 VARCHAR(20) NULL,
    nivel_diseno_2 VARCHAR(20) NULL,
    nivel_diseno_3 VARCHAR(20) NULL,
    nivel_diseno_completo VARCHAR(70) NULL,
    familia VARCHAR(255) NULL,
    es_valido BOOLEAN NOT NULL DEFAULT FALSE,
    tiene_advertencia BOOLEAN NOT NULL DEFAULT FALSE,
    detalle_validacion TEXT NULL,
    CONSTRAINT fk_staging_importacion
        FOREIGN KEY (id_importacion) REFERENCES importaciones_bom(id_importacion),
    CONSTRAINT uq_staging_fila UNIQUE (id_importacion, numero_fila)
);
CREATE TABLE bom (
    id_bom INT AUTO_INCREMENT PRIMARY KEY,
    id_importacion BIGINT NOT NULL,
    id_arnes INT NOT NULL,
    version VARCHAR(50) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_final DATE NULL,
    archivo_origen VARCHAR(255) NOT NULL,
    fecha_importacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usuario_importacion INT NOT NULL,
    vigente BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_bom_importacion
        FOREIGN KEY (id_importacion) REFERENCES importaciones_bom(id_importacion),
    CONSTRAINT fk_bom_arnes
        FOREIGN KEY (id_arnes) REFERENCES arneses(id_arnes),
    CONSTRAINT fk_bom_usuario
        FOREIGN KEY (usuario_importacion) REFERENCES usuarios(id_usuario),
    CONSTRAINT uq_bom_arnes_version UNIQUE (id_arnes, version)
);
CREATE TABLE bom_detalle (
    id_detalle BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_bom INT NOT NULL,
    id_material INT NOT NULL,
    numero_fila INT NOT NULL,
    cantidad_requerida DECIMAL(18,4) NOT NULL,
    localizacion_bom VARCHAR(50) NULL,
    std_pack_bom DECIMAL(18,4) NULL,
    tiene_advertencia BOOLEAN NOT NULL DEFAULT FALSE,
    detalle_advertencia VARCHAR(255) NULL,
    CONSTRAINT fk_bomdetalle_bom
        FOREIGN KEY (id_bom) REFERENCES bom(id_bom),
    CONSTRAINT fk_bomdetalle_material
        FOREIGN KEY (id_material) REFERENCES materiales(id_material),
    CONSTRAINT uq_bom_numero_fila UNIQUE (id_bom, numero_fila),
    CONSTRAINT chk_bom_cantidad CHECK (cantidad_requerida >= 0)
);

CREATE TABLE estado_solicitud (
    id_estado INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NULL,
    color VARCHAR(30) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_estado_solicitud_nombre UNIQUE (nombre)
);
CREATE TABLE solicitudes (
    id_solicitud BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_estado INT NOT NULL,
    fecha_solicitud DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_familia INT NOT NULL,
    id_proyecto INT NOT NULL,
    id_estacion INT NOT NULL,
    usuario_solicitud INT NOT NULL,
    CONSTRAINT fk_solicitud_estado
        FOREIGN KEY (id_estado) REFERENCES estado_solicitud(id_estado),
    CONSTRAINT fk_solicitud_familia
        FOREIGN KEY (id_familia) REFERENCES familias(id_familia),
    CONSTRAINT fk_solicitud_proyecto
        FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto),
    CONSTRAINT fk_solicitud_estacion
        FOREIGN KEY (id_estacion) REFERENCES estaciones(id_estacion),
    CONSTRAINT fk_solicitud_usuario
        FOREIGN KEY (usuario_solicitud) REFERENCES usuarios(id_usuario)
);


CREATE TABLE solicitud_detalle (
    id_detalle BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud BIGINT NOT NULL,
    id_material INT NOT NULL,
    cantidad_solicitada DECIMAL(18,2) NOT NULL,
    cantidad_surtida DECIMAL(18,2) NOT NULL DEFAULT 0,
    CONSTRAINT fk_soldet_solicitud
        FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
    CONSTRAINT fk_soldet_material
        FOREIGN KEY (id_material) REFERENCES materiales(id_material),
    CONSTRAINT uq_solicitud_material UNIQUE (id_solicitud, id_material),
    CONSTRAINT chk_solicitud_cantidades
        CHECK (cantidad_solicitada > 0 AND cantidad_surtida >= 0)

);
CREATE TABLE movimiento_inventario (
    id_movimiento BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_solicitud BIGINT NULL,
    id_arnes INT NULL,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_material INT NOT NULL,
    cantidad DECIMAL(18,2) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,
    id_ubicacion_origen INT NULL,
    id_ubicacion_destino INT NULL,
    id_usuario INT NOT NULL,
    referencia VARCHAR(100) NULL,
    comentarios VARCHAR(200) NULL,
    CONSTRAINT fk_mov_solicitud
        FOREIGN KEY (id_solicitud) REFERENCES solicitudes(id_solicitud),
    CONSTRAINT fk_mov_arnes
        FOREIGN KEY (id_arnes) REFERENCES arneses(id_arnes),
    CONSTRAINT fk_mov_material
        FOREIGN KEY (id_material) REFERENCES materiales(id_material),
    CONSTRAINT fk_mov_origen
        FOREIGN KEY (id_ubicacion_origen) REFERENCES ubicaciones(id_ubicacion),
    CONSTRAINT fk_mov_destino
        FOREIGN KEY (id_ubicacion_destino) REFERENCES ubicaciones(id_ubicacion),
    CONSTRAINT fk_mov_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    CONSTRAINT chk_tipo_movimiento
        CHECK (tipo_movimiento IN ('Entrada', 'Salida', 'Transferencia', 'Ajuste', 'Surtido')),
    CONSTRAINT chk_movimiento_cantidad CHECK (cantidad > 0)
);

CREATE TABLE bitacora (
    id_log BIGINT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_usuario INT NOT NULL,
    accion VARCHAR(255) NOT NULL,
    tabla_afectada VARCHAR(100) NULL,
    id_registro VARCHAR(50) NULL,
    detalle TEXT NULL,
    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
);
-- La tabla material_disponible se agregará en una fase posterior.
-- Su diseño dependerá de la validación del plan diario de producción,
-- el inventario por ubicación y las reglas oficiales del semáforo.

CREATE TABLE material_asignado_proyecto (
    id_material_asignado BIGINT AUTO_INCREMENT PRIMARY KEY,
    id_material INT NOT NULL,
    id_proyecto INT NOT NULL,
    id_ubicacion INT NULL,
    localizacion_bom VARCHAR(50) NULL,
    origen_localizacion VARCHAR(20) NOT NULL,
    estado_localizacion VARCHAR(20) NOT NULL DEFAULT 'Pendiente',
    prioridad INT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_map_material
        FOREIGN KEY (id_material) REFERENCES materiales(id_material),
    CONSTRAINT fk_map_proyecto
        FOREIGN KEY (id_proyecto) REFERENCES proyectos(id_proyecto),
    CONSTRAINT fk_map_ubicacion
        FOREIGN KEY (id_ubicacion) REFERENCES ubicaciones(id_ubicacion)
);

INSERT IGNORE INTO roles (nombre, descripcion)
VALUES
('Administrador', 'Acceso general al sistema'),
('Supervisor', 'Administración operativa y supervisión'),
('Materialista', 'Operación de almacén'),
('Produccion', 'Solicitud de materiales'),
('Consulta', 'Acceso de solo lectura');

INSERT IGNORE INTO estado_solicitud (nombre, descripcion, color, activo)
VALUES
('Pendiente', 'Solicitud registrada y pendiente de asignación', 'Amarillo', TRUE),
('Asignada', 'Solicitud asignada para atención', 'Azul', TRUE),
('En surtido', 'Solicitud en proceso de surtido', 'Azul', TRUE),
('Parcial', 'Solicitud surtida parcialmente', 'Naranja', TRUE),
('Faltante', 'Solicitud con material faltante', 'Rojo', TRUE),
('Completada', 'Todos los materiales fueron surtidos', 'Verde', TRUE),
('Entregada', 'Material entregado a producción', 'Verde', TRUE),
('Cancelada', 'Solicitud cancelada', 'Gris', TRUE);

SELECT DATABASE();
SHOW DATABASES;
SHOW TABLES;




