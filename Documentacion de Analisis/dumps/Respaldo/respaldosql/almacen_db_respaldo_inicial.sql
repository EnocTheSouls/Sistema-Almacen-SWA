-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: almacen_db
-- ------------------------------------------------------
-- Server version	26.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '43783152-ac48-11f1-9a24-e8cf839b4fa0:1-32';

--
-- Table structure for table `arneses`
--

DROP TABLE IF EXISTS `arneses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `arneses` (
  `id_arnes` int NOT NULL AUTO_INCREMENT,
  `id_familia` int NOT NULL,
  `numero_parte_arnes` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel_diseno` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_vigencia` date DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_arnes`),
  UNIQUE KEY `uq_arnes_diseno` (`numero_parte_arnes`,`nivel_diseno`),
  KEY `fk_arnes_familia` (`id_familia`),
  CONSTRAINT `fk_arnes_familia` FOREIGN KEY (`id_familia`) REFERENCES `familias` (`id_familia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arneses`
--

LOCK TABLES `arneses` WRITE;
/*!40000 ALTER TABLE `arneses` DISABLE KEYS */;
/*!40000 ALTER TABLE `arneses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bitacora`
--

DROP TABLE IF EXISTS `bitacora`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bitacora` (
  `id_log` bigint NOT NULL AUTO_INCREMENT,
  `fecha_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int NOT NULL,
  `accion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_registro` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `detalle` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_log`),
  KEY `fk_bitacora_usuario` (`id_usuario`),
  CONSTRAINT `fk_bitacora_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bitacora`
--

LOCK TABLES `bitacora` WRITE;
/*!40000 ALTER TABLE `bitacora` DISABLE KEYS */;
/*!40000 ALTER TABLE `bitacora` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bom`
--

DROP TABLE IF EXISTS `bom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bom` (
  `id_bom` int NOT NULL AUTO_INCREMENT,
  `id_importacion` bigint NOT NULL,
  `id_arnes` int NOT NULL,
  `version` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_final` date DEFAULT NULL,
  `archivo_origen` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_importacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuario_importacion` int NOT NULL,
  `vigente` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_bom`),
  UNIQUE KEY `uq_bom_arnes_version` (`id_arnes`,`version`),
  KEY `fk_bom_importacion` (`id_importacion`),
  KEY `fk_bom_usuario` (`usuario_importacion`),
  CONSTRAINT `fk_bom_arnes` FOREIGN KEY (`id_arnes`) REFERENCES `arneses` (`id_arnes`),
  CONSTRAINT `fk_bom_importacion` FOREIGN KEY (`id_importacion`) REFERENCES `importaciones_bom` (`id_importacion`),
  CONSTRAINT `fk_bom_usuario` FOREIGN KEY (`usuario_importacion`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bom`
--

LOCK TABLES `bom` WRITE;
/*!40000 ALTER TABLE `bom` DISABLE KEYS */;
/*!40000 ALTER TABLE `bom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bom_detalle`
--

DROP TABLE IF EXISTS `bom_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bom_detalle` (
  `id_detalle` bigint NOT NULL AUTO_INCREMENT,
  `id_bom` int NOT NULL,
  `id_material` int NOT NULL,
  `numero_fila` int NOT NULL,
  `cantidad_requerida` decimal(18,4) NOT NULL,
  `localizacion_bom` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `std_pack_bom` decimal(18,4) DEFAULT NULL,
  `tiene_advertencia` tinyint(1) NOT NULL DEFAULT '0',
  `detalle_advertencia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_detalle`),
  UNIQUE KEY `uq_bom_numero_fila` (`id_bom`,`numero_fila`),
  KEY `fk_bomdetalle_material` (`id_material`),
  CONSTRAINT `fk_bomdetalle_bom` FOREIGN KEY (`id_bom`) REFERENCES `bom` (`id_bom`),
  CONSTRAINT `fk_bomdetalle_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  CONSTRAINT `chk_bom_cantidad` CHECK ((`cantidad_requerida` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bom_detalle`
--

LOCK TABLES `bom_detalle` WRITE;
/*!40000 ALTER TABLE `bom_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `bom_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estaciones`
--

DROP TABLE IF EXISTS `estaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estaciones` (
  `id_estacion` int NOT NULL AUTO_INCREMENT,
  `id_familia` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_estacion`),
  UNIQUE KEY `uq_estacion_familia` (`id_familia`,`nombre`),
  CONSTRAINT `fk_estacion_familia` FOREIGN KEY (`id_familia`) REFERENCES `familias` (`id_familia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estaciones`
--

LOCK TABLES `estaciones` WRITE;
/*!40000 ALTER TABLE `estaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `estaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estado_solicitud`
--

DROP TABLE IF EXISTS `estado_solicitud`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estado_solicitud` (
  `id_estado` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `color` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_estado`),
  UNIQUE KEY `uq_estado_solicitud_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estado_solicitud`
--

LOCK TABLES `estado_solicitud` WRITE;
/*!40000 ALTER TABLE `estado_solicitud` DISABLE KEYS */;
INSERT INTO `estado_solicitud` VALUES (1,'Pendiente','Solicitud registrada y pendiente de asignación','Amarillo',1),(2,'Asignada','Solicitud asignada para atención','Azul',1),(3,'En surtido','Solicitud en proceso de surtido','Azul',1),(4,'Parcial','Solicitud surtida parcialmente','Naranja',1),(5,'Faltante','Solicitud con material faltante','Rojo',1),(6,'Completada','Todos los materiales fueron surtidos','Verde',1),(7,'Entregada','Material entregado a producción','Verde',1),(8,'Cancelada','Solicitud cancelada','Gris',1);
/*!40000 ALTER TABLE `estado_solicitud` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `familias`
--

DROP TABLE IF EXISTS `familias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `familias` (
  `id_familia` int NOT NULL AUTO_INCREMENT,
  `id_proyecto` int NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_familia`),
  UNIQUE KEY `uq_familia_proyecto` (`id_proyecto`,`nombre`),
  CONSTRAINT `fk_familia_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `familias`
--

LOCK TABLES `familias` WRITE;
/*!40000 ALTER TABLE `familias` DISABLE KEYS */;
/*!40000 ALTER TABLE `familias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `importaciones_bom`
--

DROP TABLE IF EXISTS `importaciones_bom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `importaciones_bom` (
  `id_importacion` bigint NOT NULL AUTO_INCREMENT,
  `nombre_archivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_importacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_usuario` int NOT NULL,
  `total_filas` int NOT NULL DEFAULT '0',
  `filas_correctas` int NOT NULL DEFAULT '0',
  `filas_advertencia` int NOT NULL DEFAULT '0',
  `filas_con_error` int NOT NULL DEFAULT '0',
  `estado` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mensaje` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_importacion`),
  KEY `fk_importacion_bom_usuario` (`id_usuario`),
  CONSTRAINT `fk_importacion_bom_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `importaciones_bom`
--

LOCK TABLES `importaciones_bom` WRITE;
/*!40000 ALTER TABLE `importaciones_bom` DISABLE KEYS */;
/*!40000 ALTER TABLE `importaciones_bom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventario`
--

DROP TABLE IF EXISTS `inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario` (
  `id_inventario` bigint NOT NULL AUTO_INCREMENT,
  `id_material` int NOT NULL,
  `id_ubicacion` int NOT NULL,
  `disponible` decimal(18,2) NOT NULL DEFAULT '0.00',
  `reservado` decimal(18,2) NOT NULL DEFAULT '0.00',
  `no_disponible` decimal(18,2) NOT NULL DEFAULT '0.00',
  `ultima_actualizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_inventario`),
  UNIQUE KEY `uq_inventario` (`id_material`,`id_ubicacion`),
  KEY `fk_inventario_ubicacion` (`id_ubicacion`),
  CONSTRAINT `fk_inventario_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  CONSTRAINT `fk_inventario_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicaciones` (`id_ubicacion`),
  CONSTRAINT `chk_inventario_cantidades` CHECK (((`disponible` >= 0) and (`reservado` >= 0) and (`no_disponible` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventario`
--

LOCK TABLES `inventario` WRITE;
/*!40000 ALTER TABLE `inventario` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material_asignado_proyecto`
--

DROP TABLE IF EXISTS `material_asignado_proyecto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_asignado_proyecto` (
  `id_material_asignado` bigint NOT NULL AUTO_INCREMENT,
  `id_material` int NOT NULL,
  `id_proyecto` int NOT NULL,
  `id_ubicacion` int DEFAULT NULL,
  `localizacion_bom` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origen_localizacion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `estado_localizacion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `prioridad` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_material_asignado`),
  KEY `fk_map_material` (`id_material`),
  KEY `fk_map_proyecto` (`id_proyecto`),
  KEY `fk_map_ubicacion` (`id_ubicacion`),
  CONSTRAINT `fk_map_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  CONSTRAINT `fk_map_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`),
  CONSTRAINT `fk_map_ubicacion` FOREIGN KEY (`id_ubicacion`) REFERENCES `ubicaciones` (`id_ubicacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material_asignado_proyecto`
--

LOCK TABLES `material_asignado_proyecto` WRITE;
/*!40000 ALTER TABLE `material_asignado_proyecto` DISABLE KEYS */;
/*!40000 ALTER TABLE `material_asignado_proyecto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materiales`
--

DROP TABLE IF EXISTS `materiales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materiales` (
  `id_material` int NOT NULL AUTO_INCREMENT,
  `numero_parte_material` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unidad_medida` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `codigo_barras` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serial_kits` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generic_code` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `std_pack` decimal(18,4) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_material`),
  UNIQUE KEY `uq_numero_parte` (`numero_parte_material`),
  UNIQUE KEY `uq_codigo_barras` (`codigo_barras`),
  UNIQUE KEY `uq_serial_kits` (`serial_kits`),
  CONSTRAINT `chk_material_generic_code` CHECK ((`generic_code` in (_utf8mb4'C',_utf8mb4'P',_utf8mb4'S',_utf8mb4'W')))
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materiales`
--

LOCK TABLES `materiales` WRITE;
/*!40000 ALTER TABLE `materiales` DISABLE KEYS */;
/*!40000 ALTER TABLE `materiales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_inventario`
--

DROP TABLE IF EXISTS `movimiento_inventario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimiento_inventario` (
  `id_movimiento` bigint NOT NULL AUTO_INCREMENT,
  `id_solicitud` bigint DEFAULT NULL,
  `id_arnes` int DEFAULT NULL,
  `fecha_hora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_material` int NOT NULL,
  `cantidad` decimal(18,2) NOT NULL,
  `tipo_movimiento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_ubicacion_origen` int DEFAULT NULL,
  `id_ubicacion_destino` int DEFAULT NULL,
  `id_usuario` int NOT NULL,
  `referencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `comentarios` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_movimiento`),
  KEY `fk_mov_solicitud` (`id_solicitud`),
  KEY `fk_mov_arnes` (`id_arnes`),
  KEY `fk_mov_material` (`id_material`),
  KEY `fk_mov_origen` (`id_ubicacion_origen`),
  KEY `fk_mov_destino` (`id_ubicacion_destino`),
  KEY `fk_mov_usuario` (`id_usuario`),
  CONSTRAINT `fk_mov_arnes` FOREIGN KEY (`id_arnes`) REFERENCES `arneses` (`id_arnes`),
  CONSTRAINT `fk_mov_destino` FOREIGN KEY (`id_ubicacion_destino`) REFERENCES `ubicaciones` (`id_ubicacion`),
  CONSTRAINT `fk_mov_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  CONSTRAINT `fk_mov_origen` FOREIGN KEY (`id_ubicacion_origen`) REFERENCES `ubicaciones` (`id_ubicacion`),
  CONSTRAINT `fk_mov_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`),
  CONSTRAINT `fk_mov_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `chk_movimiento_cantidad` CHECK ((`cantidad` > 0)),
  CONSTRAINT `chk_tipo_movimiento` CHECK ((`tipo_movimiento` in (_utf8mb4'Entrada',_utf8mb4'Salida',_utf8mb4'Transferencia',_utf8mb4'Ajuste',_utf8mb4'Surtido')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_inventario`
--

LOCK TABLES `movimiento_inventario` WRITE;
/*!40000 ALTER TABLE `movimiento_inventario` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimiento_inventario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proyectos`
--

DROP TABLE IF EXISTS `proyectos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proyectos` (
  `id_proyecto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_proyecto`),
  UNIQUE KEY `uq_proyectos_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proyectos`
--

LOCK TABLES `proyectos` WRITE;
/*!40000 ALTER TABLE `proyectos` DISABLE KEYS */;
/*!40000 ALTER TABLE `proyectos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `racks`
--

DROP TABLE IF EXISTS `racks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `racks` (
  `id_rack` int NOT NULL AUTO_INCREMENT,
  `id_zona` int NOT NULL,
  `nombre` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `altura_total` int DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_rack`),
  UNIQUE KEY `uq_rack_zona` (`id_zona`,`nombre`),
  CONSTRAINT `fk_rack_zona` FOREIGN KEY (`id_zona`) REFERENCES `zonas` (`id_zona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `racks`
--

LOCK TABLES `racks` WRITE;
/*!40000 ALTER TABLE `racks` DISABLE KEYS */;
/*!40000 ALTER TABLE `racks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id_rol` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id_rol`),
  UNIQUE KEY `uq_roles_nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador','Acceso general al sistema'),(2,'Supervisor','Administración operativa y supervisión'),(3,'Materialista','Operación de almacén'),(4,'Produccion','Solicitud de materiales'),(5,'Consulta','Acceso de solo lectura');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitud_detalle`
--

DROP TABLE IF EXISTS `solicitud_detalle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitud_detalle` (
  `id_detalle` bigint NOT NULL AUTO_INCREMENT,
  `id_solicitud` bigint NOT NULL,
  `id_material` int NOT NULL,
  `cantidad_solicitada` decimal(18,2) NOT NULL,
  `cantidad_surtida` decimal(18,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id_detalle`),
  UNIQUE KEY `uq_solicitud_material` (`id_solicitud`,`id_material`),
  KEY `fk_soldet_material` (`id_material`),
  CONSTRAINT `fk_soldet_material` FOREIGN KEY (`id_material`) REFERENCES `materiales` (`id_material`),
  CONSTRAINT `fk_soldet_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitudes` (`id_solicitud`),
  CONSTRAINT `chk_solicitud_cantidades` CHECK (((`cantidad_solicitada` > 0) and (`cantidad_surtida` >= 0)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitud_detalle`
--

LOCK TABLES `solicitud_detalle` WRITE;
/*!40000 ALTER TABLE `solicitud_detalle` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitud_detalle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solicitudes`
--

DROP TABLE IF EXISTS `solicitudes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solicitudes` (
  `id_solicitud` bigint NOT NULL AUTO_INCREMENT,
  `id_estado` int NOT NULL,
  `fecha_solicitud` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `id_familia` int NOT NULL,
  `id_proyecto` int NOT NULL,
  `id_estacion` int NOT NULL,
  `usuario_solicitud` int NOT NULL,
  PRIMARY KEY (`id_solicitud`),
  KEY `fk_solicitud_estado` (`id_estado`),
  KEY `fk_solicitud_familia` (`id_familia`),
  KEY `fk_solicitud_proyecto` (`id_proyecto`),
  KEY `fk_solicitud_estacion` (`id_estacion`),
  KEY `fk_solicitud_usuario` (`usuario_solicitud`),
  CONSTRAINT `fk_solicitud_estacion` FOREIGN KEY (`id_estacion`) REFERENCES `estaciones` (`id_estacion`),
  CONSTRAINT `fk_solicitud_estado` FOREIGN KEY (`id_estado`) REFERENCES `estado_solicitud` (`id_estado`),
  CONSTRAINT `fk_solicitud_familia` FOREIGN KEY (`id_familia`) REFERENCES `familias` (`id_familia`),
  CONSTRAINT `fk_solicitud_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`),
  CONSTRAINT `fk_solicitud_usuario` FOREIGN KEY (`usuario_solicitud`) REFERENCES `usuarios` (`id_usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staging_bom`
--

DROP TABLE IF EXISTS `staging_bom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staging_bom` (
  `id_staging` bigint NOT NULL AUTO_INCREMENT,
  `id_importacion` bigint NOT NULL,
  `numero_fila` int NOT NULL,
  `linea` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_number` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `material_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generic_code` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bom_qty` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localizacion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `std_pack` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `arnes` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel_diseno_1` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel_diseno_2` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel_diseno_3` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nivel_diseno_completo` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `familia` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `es_valido` tinyint(1) NOT NULL DEFAULT '0',
  `tiene_advertencia` tinyint(1) NOT NULL DEFAULT '0',
  `detalle_validacion` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id_staging`),
  UNIQUE KEY `uq_staging_fila` (`id_importacion`,`numero_fila`),
  CONSTRAINT `fk_staging_importacion` FOREIGN KEY (`id_importacion`) REFERENCES `importaciones_bom` (`id_importacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staging_bom`
--

LOCK TABLES `staging_bom` WRITE;
/*!40000 ALTER TABLE `staging_bom` DISABLE KEYS */;
/*!40000 ALTER TABLE `staging_bom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ubicaciones`
--

DROP TABLE IF EXISTS `ubicaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ubicaciones` (
  `id_ubicacion` int NOT NULL AUTO_INCREMENT,
  `id_rack` int NOT NULL,
  `nivel` char(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `posicion` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacidad_maxima` decimal(18,2) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_ubicacion`),
  UNIQUE KEY `uq_ubicacion` (`id_rack`,`nivel`,`posicion`),
  CONSTRAINT `fk_ubicacion_rack` FOREIGN KEY (`id_rack`) REFERENCES `racks` (`id_rack`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ubicaciones`
--

LOCK TABLES `ubicaciones` WRITE;
/*!40000 ALTER TABLE `ubicaciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `ubicaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_rol` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `uq_usuarios_usuario` (`usuario`),
  KEY `fk_usuario_rol` (`id_rol`),
  CONSTRAINT `fk_usuario_rol` FOREIGN KEY (`id_rol`) REFERENCES `roles` (`id_rol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zona_proyecto`
--

DROP TABLE IF EXISTS `zona_proyecto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zona_proyecto` (
  `id_zona_proyecto` int NOT NULL AUTO_INCREMENT,
  `id_zona` int NOT NULL,
  `id_proyecto` int NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_zona_proyecto`),
  UNIQUE KEY `uq_zona_proyecto` (`id_zona`,`id_proyecto`),
  KEY `fk_zona_proyecto_proyecto` (`id_proyecto`),
  CONSTRAINT `fk_zona_proyecto_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`),
  CONSTRAINT `fk_zona_proyecto_zona` FOREIGN KEY (`id_zona`) REFERENCES `zonas` (`id_zona`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zona_proyecto`
--

LOCK TABLES `zona_proyecto` WRITE;
/*!40000 ALTER TABLE `zona_proyecto` DISABLE KEYS */;
/*!40000 ALTER TABLE `zona_proyecto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zonas`
--

DROP TABLE IF EXISTS `zonas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zonas` (
  `id_zona` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id_zona`),
  UNIQUE KEY `uq_zona_codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zonas`
--

LOCK TABLES `zonas` WRITE;
/*!40000 ALTER TABLE `zonas` DISABLE KEYS */;
/*!40000 ALTER TABLE `zonas` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-10  6:34:51
