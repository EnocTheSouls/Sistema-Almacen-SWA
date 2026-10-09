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

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '43783152-ac48-11f1-9a24-e8cf839b4fa0:1-232';

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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_inventario`
--

LOCK TABLES `movimiento_inventario` WRITE;
/*!40000 ALTER TABLE `movimiento_inventario` DISABLE KEYS */;
INSERT INTO `movimiento_inventario` VALUES (1,NULL,NULL,'2026-09-14 14:21:43',2,1000.00,'ENTRADA',NULL,1,1,'INVENTARIO-INICIAL','Entrada provisional de cinco bolsas'),(2,NULL,NULL,'2026-09-14 14:23:43',2,400.00,'ENTRADA',NULL,1,1,'ENTRADA-ADICIONAL','Entrada adicional de dos bolsas'),(3,NULL,NULL,'2026-09-15 06:22:24',2,100.00,'ENTRADA',NULL,1,1,'COMPRA-001','Entrada de prueba'),(4,NULL,NULL,'2026-09-15 10:42:15',6,500.00,'ENTRADA',NULL,1,1,'INVENTARIO-INICIAL-10136461','Existencia inicial para validar surtido de solicitud 1'),(5,NULL,NULL,'2026-09-15 10:44:56',6,500.00,'ENTRADA',NULL,1,1,'INVENTARIO-INICIAL-10136461','Existencia inicial para validar el surtido'),(6,1,NULL,'2026-09-15 10:55:11',2,200.00,'Surtido',1,NULL,1,'SOLICITUD-1','Surtido completo del material 10136462'),(7,1,NULL,'2026-09-15 11:01:38',6,100.00,'Surtido',1,NULL,1,'SOLICITUD-1','Surtido completo del material 10136461'),(8,2,NULL,'2026-09-15 12:40:31',2,50.00,'Surtido',1,NULL,55,'SOLICITUD-2','Surtido manual del material 10136462'),(9,2,NULL,'2026-09-15 12:40:50',6,25.00,'Surtido',1,NULL,55,'SOLICITUD-2','Surtido manual del material 10136461');
/*!40000 ALTER TABLE `movimiento_inventario` ENABLE KEYS */;
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

-- Dump completed on 2026-09-21  6:42:26
