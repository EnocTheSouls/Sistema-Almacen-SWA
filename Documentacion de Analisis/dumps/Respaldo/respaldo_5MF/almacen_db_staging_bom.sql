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
