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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '43783152-ac48-11f1-9a24-e8cf839b4fa0:1-583';

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
  `id_familia` int DEFAULT NULL,
  `nombre_familia_historico` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_proyecto` int DEFAULT NULL,
  `nombre_proyecto_historico` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_estacion` int DEFAULT NULL,
  `nombre_estacion_historico` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuario_solicitud` int NOT NULL,
  `origen_solicitud` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ESCANEO',
  PRIMARY KEY (`id_solicitud`),
  KEY `fk_solicitud_estado` (`id_estado`),
  KEY `fk_solicitud_usuario` (`usuario_solicitud`),
  KEY `fk_solicitud_estacion` (`id_estacion`),
  KEY `fk_solicitud_proyecto` (`id_proyecto`),
  KEY `fk_solicitud_familia` (`id_familia`),
  CONSTRAINT `fk_solicitud_estacion` FOREIGN KEY (`id_estacion`) REFERENCES `estaciones` (`id_estacion`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_estado` FOREIGN KEY (`id_estado`) REFERENCES `estado_solicitud` (`id_estado`),
  CONSTRAINT `fk_solicitud_familia` FOREIGN KEY (`id_familia`) REFERENCES `familias` (`id_familia`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_proyecto` FOREIGN KEY (`id_proyecto`) REFERENCES `proyectos` (`id_proyecto`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_solicitud_usuario` FOREIGN KEY (`usuario_solicitud`) REFERENCES `usuarios` (`id_usuario`),
  CONSTRAINT `chk_solicitud_origen` CHECK ((`origen_solicitud` in (_utf8mb4'ESCANEO',_utf8mb4'MANUAL')))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solicitudes`
--

LOCK TABLES `solicitudes` WRITE;
/*!40000 ALTER TABLE `solicitudes` DISABLE KEYS */;
INSERT INTO `solicitudes` VALUES (1,8,'2026-09-21 11:13:19',27,'27MY ENGINE HARN EP6',2,'KM',2,'CLIPS',55,'MANUAL'),(2,8,'2026-09-21 14:50:10',28,'INSTRUMENT PANEL-506',3,'RIV',11,'S/A-1',55,'MANUAL'),(3,6,'2026-09-22 09:16:51',27,'27MY ENGINE HARN EP6',2,'KM',3,'SUB2',1,'MANUAL'),(4,6,'2026-09-22 09:53:52',28,'INSTRUMENT PANEL-506',3,'RIV',24,'COMBO',55,'MANUAL'),(5,6,'2026-09-22 10:50:56',27,'27MY ENGINE HARN EP6',2,'KM',2,'CLIPS',1,'MANUAL'),(6,6,'2026-09-22 11:21:58',28,'INSTRUMENT PANEL-506',3,'RIV',12,'S/A-5',1,'MANUAL'),(7,4,'2026-09-22 11:25:58',28,'INSTRUMENT PANEL-506',3,'RIV',8,'BK-4',55,'MANUAL');
/*!40000 ALTER TABLE `solicitudes` ENABLE KEYS */;
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

-- Dump completed on 2026-09-22 14:49:26
