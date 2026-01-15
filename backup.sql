-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: ksnusa
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `ksnusa`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `ksnusa` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `ksnusa`;

--
-- Table structure for table `CommunicationLog`
--

DROP TABLE IF EXISTS `CommunicationLog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `CommunicationLog` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'SENT',
  `sentAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `campaign` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CommunicationLog_customerId_idx` (`customerId`),
  KEY `CommunicationLog_status_idx` (`status`),
  KEY `CommunicationLog_sentAt_idx` (`sentAt`),
  CONSTRAINT `CommunicationLog_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `CommunicationLog`
--

LOCK TABLES `CommunicationLog` WRITE;
/*!40000 ALTER TABLE `CommunicationLog` DISABLE KEYS */;
INSERT INTO `CommunicationLog` VALUES ('a2db7b15-2807-4516-9859-1cf994cc5967','07100016-6cbf-455e-b49d-f45f3d3e043c','CALL','Phone','Follow-up pasca servis, cek kondisi motor.','SENT','2025-12-16 00:00:00.000','2026-01-15 04:27:25.777','Follow-up Servis','MANUAL'),('ce0a6e3d-a93f-4741-b499-1e283aefa480','65867395-d3a5-445f-9804-31ca685915d4','WHATSAPP','WhatsApp','Reminder servis berkala bulan depan.','SENT','2025-12-08 00:00:00.000','2026-01-15 04:27:25.763','Reminder Berkala','MANUAL');
/*!40000 ALTER TABLE `CommunicationLog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Complaint`
--

DROP TABLE IF EXISTS `Complaint`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Complaint` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `channel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resolution` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Complaint_customerId_idx` (`customerId`),
  KEY `Complaint_serviceOrderId_idx` (`serviceOrderId`),
  KEY `Complaint_status_idx` (`status`),
  CONSTRAINT `Complaint_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `Complaint_serviceOrderId_fkey` FOREIGN KEY (`serviceOrderId`) REFERENCES `ServiceOrder` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Complaint`
--

LOCK TABLES `Complaint` WRITE;
/*!40000 ALTER TABLE `Complaint` DISABLE KEYS */;
INSERT INTO `Complaint` VALUES ('349102b1-67a7-4ee5-bd0b-020e50e5c7d5','51da9b17-7d89-45d0-bb97-242650efeba4','32c39a9d-f668-4ec1-bd0e-659695863d62','Jadwal servis tertunda','Ingin reschedule karena ada keperluan mendadak.','OPEN','Phone',NULL,'2026-01-15 04:27:25.542','2026-01-15 04:27:25.542'),('bb84aac2-6a47-4e30-80f1-84e078d39ef3','3138d4cc-d21a-4f9e-b620-bb17928bbabd','7edf3b84-42c6-4324-bc8f-af0e5dc98d67','Rem masih berdecit','Setelah ganti kampas rem, masih terdengar bunyi decit saat pengereman.','IN_PROGRESS','Whatsapp',NULL,'2026-01-15 04:27:25.528','2026-01-15 04:27:25.528');
/*!40000 ALTER TABLE `Complaint` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Customer`
--

DROP TABLE IF EXISTS `Customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Customer` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferredService` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `customerType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Customer`
--

LOCK TABLES `Customer` WRITE;
/*!40000 ALTER TABLE `Customer` DISABLE KEYS */;
INSERT INTO `Customer` VALUES ('07100016-6cbf-455e-b49d-f45f3d3e043c','Andi Wijaya','andi@example.com','081355566677','Tangerang','Servis rutin & tune up',NULL,'2026-01-15 04:27:25.321','2026-01-15 04:27:25.321','INDIVIDU'),('3138d4cc-d21a-4f9e-b620-bb17928bbabd','Siti Aminah','siti@example.com','081298765432','Depok','Perbaikan rem dan kaki-kaki',NULL,'2026-01-15 04:27:25.308','2026-01-15 04:27:25.308','KOMUNITAS'),('51da9b17-7d89-45d0-bb97-242650efeba4','Dewi Lestari','dewi@example.com','081322244455','Bekasi','Engine rebuild & performance upgrade',NULL,'2026-01-15 04:27:25.334','2026-01-15 04:27:25.334','RACING_TEAM'),('65867395-d3a5-445f-9804-31ca685915d4','Budi Santoso','budi@example.com','081234567890','Jakarta','Servis berkala & ganti oli',NULL,'2026-01-15 04:27:25.292','2026-01-15 04:27:25.292','INDIVIDU');
/*!40000 ALTER TABLE `Customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FactInventory`
--

DROP TABLE IF EXISTS `FactInventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FactInventory` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transactionDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int NOT NULL,
  `amount` int NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `productId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `approvalStatus` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `signatureId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedById` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approvedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FactInventory_productId_fkey` (`productId`),
  KEY `FactInventory_supplierId_fkey` (`supplierId`),
  KEY `FactInventory_signatureId_fkey` (`signatureId`),
  KEY `FactInventory_approvedById_fkey` (`approvedById`),
  CONSTRAINT `FactInventory_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FactInventory_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `FactInventory_signatureId_fkey` FOREIGN KEY (`signatureId`) REFERENCES `Signature` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `FactInventory_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FactInventory`
--

LOCK TABLES `FactInventory` WRITE;
/*!40000 ALTER TABLE `FactInventory` DISABLE KEYS */;
INSERT INTO `FactInventory` VALUES ('105669df-7699-4255-ab35-bc5acee884b0','2025-10-05 00:00:00.000','OUT',20,1000000,'completed',NULL,'95b00c45-5607-43d9-bc12-13a2ff020c51','5d16301c-c34e-4826-8040-e595b4f3e93a','APPROVED',NULL,NULL,NULL),('4c93c850-b72a-4cdd-8f14-fe52f88ce5f2','2025-10-10 00:00:00.000','OUT',5,250000,'completed',NULL,'db89de45-6820-4204-8767-c230e55212a4','82e7396d-751a-4ecf-92e1-c267092d604c','APPROVED',NULL,NULL,NULL),('91fe1ec3-e8ea-4f5b-a734-0b0e7e541aaf','2025-11-01 00:00:00.000','OUT',15,750000,'completed',NULL,'95b00c45-5607-43d9-bc12-13a2ff020c51','5d16301c-c34e-4826-8040-e595b4f3e93a','APPROVED',NULL,NULL,NULL),('a5ea65a8-99d1-4f72-ad42-49671f0afcee','2025-10-01 00:00:00.000','IN',50,2500000,'completed',NULL,'95b00c45-5607-43d9-bc12-13a2ff020c51','5d16301c-c34e-4826-8040-e595b4f3e93a','APPROVED',NULL,NULL,NULL),('b6de312f-8d96-4a49-94b2-5d3125ba8f40','2025-11-05 00:00:00.000','IN',10,500000,'completed',NULL,'1f8363c9-4b5c-4a8b-bac5-6da68e21d9bd','5d16301c-c34e-4826-8040-e595b4f3e93a','PENDING',NULL,NULL,NULL);
/*!40000 ALTER TABLE `FactInventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `FollowUp`
--

DROP TABLE IF EXISTS `FollowUp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `FollowUp` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `dueAt` datetime(3) NOT NULL,
  `message` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sentAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FollowUp_customerId_idx` (`customerId`),
  KEY `FollowUp_status_idx` (`status`),
  KEY `FollowUp_dueAt_idx` (`dueAt`),
  CONSTRAINT `FollowUp_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `FollowUp`
--

LOCK TABLES `FollowUp` WRITE;
/*!40000 ALTER TABLE `FollowUp` DISABLE KEYS */;
INSERT INTO `FollowUp` VALUES ('60bc64b2-b75f-4a20-aab9-bf571f51d7bf','65867395-d3a5-445f-9804-31ca685915d4','POST_SERVICE','PENDING','2025-12-08 00:00:00.000','Follow-up setelah servis berkala, tanyakan kondisi motor.',NULL,'2026-01-15 04:27:25.562','2026-01-15 04:27:25.562'),('eea54608-2ffe-4b36-ba22-b8ce1db52e2c','07100016-6cbf-455e-b49d-f45f3d3e043c','REMINDER','PENDING','2025-12-20 00:00:00.000','Reminder servis 10.000 km berikutnya.',NULL,'2026-01-15 04:27:25.577','2026-01-15 04:27:25.577');
/*!40000 ALTER TABLE `FollowUp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LoyaltyProfile`
--

DROP TABLE IF EXISTS `LoyaltyProfile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LoyaltyProfile` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL DEFAULT '0',
  `lifetimePoints` int NOT NULL DEFAULT '0',
  `tier` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Silver',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `LoyaltyProfile_customerId_key` (`customerId`),
  CONSTRAINT `LoyaltyProfile_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LoyaltyProfile`
--

LOCK TABLES `LoyaltyProfile` WRITE;
/*!40000 ALTER TABLE `LoyaltyProfile` DISABLE KEYS */;
INSERT INTO `LoyaltyProfile` VALUES ('4b6bf6ba-91f7-4cb2-b73b-4b47dcc8d463','07100016-6cbf-455e-b49d-f45f3d3e043c',1550,1550,'Platinum','2026-01-15 04:27:25.617','2026-01-15 04:27:25.617'),('778c325a-7fa2-4ad0-88cd-77218e22bacd','65867395-d3a5-445f-9804-31ca685915d4',120,120,'Silver','2026-01-15 04:27:25.591','2026-01-15 04:27:25.591'),('f08827be-6c70-4837-a71a-db411d6bdc5d','3138d4cc-d21a-4f9e-b620-bb17928bbabd',620,620,'Gold','2026-01-15 04:27:25.606','2026-01-15 04:27:25.606');
/*!40000 ALTER TABLE `LoyaltyProfile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LoyaltyTierBenefit`
--

DROP TABLE IF EXISTS `LoyaltyTierBenefit`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LoyaltyTierBenefit` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tier` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discountPercent` int DEFAULT NULL,
  `pointsCost` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `LoyaltyTierBenefit_tier_idx` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LoyaltyTierBenefit`
--

LOCK TABLES `LoyaltyTierBenefit` WRITE;
/*!40000 ALTER TABLE `LoyaltyTierBenefit` DISABLE KEYS */;
INSERT INTO `LoyaltyTierBenefit` VALUES ('027edc3d-1203-4a74-9d8c-ebbe5a17dc49','Platinum','Diskon servis 15%','Diskon besar + prioritas booking',15,NULL,'2026-01-15 04:27:25.688'),('84796f44-ffef-481e-b4a4-c4298ee43d9e','Platinum','Gratis check-up ringan','Free check-up setiap 3 bulan',NULL,NULL,'2026-01-15 04:27:25.688'),('858f5505-a370-4ba9-980c-c7c3d9172776','Gold','Diskon servis 10%','Diskon servis + prioritas booking',10,NULL,'2026-01-15 04:27:25.688'),('b606e976-9cfa-4d1b-9c93-8eb28935ae92','Silver','Diskon servis 5%','Diskon untuk servis berkala',5,NULL,'2026-01-15 04:27:25.688');
/*!40000 ALTER TABLE `LoyaltyTierBenefit` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `LoyaltyTransaction`
--

DROP TABLE IF EXISTS `LoyaltyTransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `LoyaltyTransaction` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profileId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` int NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `LoyaltyTransaction_profileId_idx` (`profileId`),
  KEY `LoyaltyTransaction_serviceOrderId_idx` (`serviceOrderId`),
  CONSTRAINT `LoyaltyTransaction_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `LoyaltyProfile` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `LoyaltyTransaction_serviceOrderId_fkey` FOREIGN KEY (`serviceOrderId`) REFERENCES `ServiceOrder` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `LoyaltyTransaction`
--

LOCK TABLES `LoyaltyTransaction` WRITE;
/*!40000 ALTER TABLE `LoyaltyTransaction` DISABLE KEYS */;
INSERT INTO `LoyaltyTransaction` VALUES ('4fdea620-c711-4880-9022-97aa25b1d59c','4b6bf6ba-91f7-4cb2-b73b-4b47dcc8d463',1550,'EARN','Servis rutin + tune up','4b3c9835-3684-436c-8dba-3e923ab674d5','2026-01-15 04:27:25.671'),('570870a3-6f70-44b4-a528-ac8af526f44e','f08827be-6c70-4837-a71a-db411d6bdc5d',620,'EARN','Perbaikan rem + sparepart','7edf3b84-42c6-4324-bc8f-af0e5dc98d67','2026-01-15 04:27:25.652'),('aba91b5c-7937-48fe-b998-1cfd91d60b00','778c325a-7fa2-4ad0-88cd-77218e22bacd',120,'EARN','Servis berkala','7cbece87-3f1f-4345-b33c-eead3ac70178','2026-01-15 04:27:25.629');
/*!40000 ALTER TABLE `LoyaltyTransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `MechanicNote`
--

DROP TABLE IF EXISTS `MechanicNote`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `MechanicNote` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceOrderId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdById` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `MechanicNote_serviceOrderId_fkey` (`serviceOrderId`),
  KEY `MechanicNote_createdById_fkey` (`createdById`),
  CONSTRAINT `MechanicNote_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `MechanicNote_serviceOrderId_fkey` FOREIGN KEY (`serviceOrderId`) REFERENCES `ServiceOrder` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `MechanicNote`
--

LOCK TABLES `MechanicNote` WRITE;
/*!40000 ALTER TABLE `MechanicNote` DISABLE KEYS */;
INSERT INTO `MechanicNote` VALUES ('46348ed3-639b-4f08-a390-5dc96a752662','7cbece87-3f1f-4345-b33c-eead3ac70178','Ganti oli Motul 5100, filter udara dibersihkan. Kondisi mesin bagus.','1b88d8c0-bd23-464b-b38a-24e81cc1b747','2026-01-15 04:27:25.492'),('ae9a9bd9-4976-4754-8001-602abdf716d7','7edf3b84-42c6-4324-bc8f-af0e5dc98d67','Kampas rem depan dan belakang sudah diganti. Tested dan aman.','1b88d8c0-bd23-464b-b38a-24e81cc1b747','2026-01-15 04:27:25.506'),('bb36d697-28c1-4d2d-9bd7-f68e74818509','4b3c9835-3684-436c-8dba-3e923ab674d5','Sedang proses pembersihan karburator dan penggantian busi.','1b88d8c0-bd23-464b-b38a-24e81cc1b747','2026-01-15 04:27:25.517');
/*!40000 ALTER TABLE `MechanicNote` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Permission`
--

DROP TABLE IF EXISTS `Permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Permission` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Permission_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Permission`
--

LOCK TABLES `Permission` WRITE;
/*!40000 ALTER TABLE `Permission` DISABLE KEYS */;
INSERT INTO `Permission` VALUES ('00f97bfc-ecb0-498e-bdc3-28a053eed768','inventory_delete','inventory','delete','Hapus produk inventory','2026-01-15 04:27:23.422'),('0d95f9a3-fc4b-4d4d-943e-4376fdc6163d','mechanic_notes_view','mechanic-notes','view','Lihat catatan mekanik','2026-01-15 04:27:23.582'),('2157893e-1953-40c7-ae99-0ce2c0285d22','orders_create','orders','create','Buat transaksi baru','2026-01-15 04:27:23.509'),('22d1e4f2-e20e-476f-93b4-e7c63ec5bc67','inventory_create','inventory','create','Tambah produk inventory','2026-01-15 04:27:23.395'),('2e97c78c-e521-4ab8-9e11-c5a9b80d0257','mechanic_notes_edit','mechanic-notes','edit','Edit catatan mekanik','2026-01-15 04:27:23.603'),('57d052ad-11db-4fec-bc97-bd773b105890','approvals_approve','approvals','approve','Approve/reject barang masuk','2026-01-15 04:27:23.572'),('68c74e06-58d8-4b2c-971a-a06be4a761cd','inventory_view','inventory','view','Lihat data inventory','2026-01-15 04:27:23.381'),('6bc4fa9a-fd5f-4c10-810f-b25a945dc6cc','role_management','admin','manage','Kelola role & permissions','2026-01-15 04:27:23.635'),('718d14c2-d8cb-4391-920d-11db73cfe0ea','suppliers_delete','suppliers','delete','Hapus supplier','2026-01-15 04:27:23.488'),('74c630ca-7029-490c-a010-bba30f08ffb2','mechanic_notes_create','mechanic-notes','create','Buat catatan mekanik','2026-01-15 04:27:23.590'),('782502fe-d8ed-44ee-bb00-277cb55ecc05','suppliers_view','suppliers','view','Lihat data supplier','2026-01-15 04:27:23.447'),('7f3d5526-fa96-4e03-a750-c218814d7522','approvals_view','approvals','view','Lihat pending approvals','2026-01-15 04:27:23.563'),('93268016-a4a1-484e-9494-fc242a3a07a1','crm_view','crm','view','Akses ke data pelanggan & CRM','2026-01-15 04:27:23.545'),('96332c82-3f53-4b8f-af7d-ce10fdbce6f9','crm_manage','crm','manage','Kelola data pelanggan & kendaraan','2026-01-15 04:27:23.555'),('9b709e37-3f7a-408f-ad57-9c73849f8708','suppliers_edit','suppliers','edit','Edit supplier','2026-01-15 04:27:23.474'),('b19a4510-24be-4e32-b4a2-f77bf50c8e31','dashboard_view','dashboard','view','Akses ke halaman dashboard','2026-01-15 04:27:23.358'),('b614da16-d23b-4370-b21a-cae3a4c3fc72','orders_delete','orders','delete','Hapus transaksi','2026-01-15 04:27:23.528'),('cbfeb3cf-6acb-470e-8abb-665cd920df5a','mechanic_notes_delete','mechanic-notes','delete','Hapus catatan mekanik','2026-01-15 04:27:23.613'),('d7c0118a-2de0-4b88-b8b5-e2b187a0869e','bi_view','bi','view','Akses ke dashboard BI & OLAP','2026-01-15 04:27:23.538'),('db7a5a3c-2b85-41ac-8060-08d7524962e0','inventory_edit','inventory','edit','Edit produk inventory','2026-01-15 04:27:23.409'),('e06f0520-e8fc-4b5c-8ceb-1d9b225d3124','settings_view','settings','view','Akses settings','2026-01-15 04:27:23.624'),('e74f4eb5-99e9-4049-98ab-0c926b949f7f','orders_view','orders','view','Lihat data transaksi','2026-01-15 04:27:23.501'),('f5d70ea0-b80a-457c-9ef8-b2bda1a98c74','suppliers_create','suppliers','create','Tambah supplier','2026-01-15 04:27:23.461'),('faf4281c-51dd-4482-802f-dea76ab4c9e2','orders_edit','orders','edit','Edit transaksi','2026-01-15 04:27:23.520');
/*!40000 ALTER TABLE `Permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Product`
--

DROP TABLE IF EXISTS `Product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Product` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sku` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `supplierId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Product_sku_key` (`sku`),
  KEY `Product_supplierId_fkey` (`supplierId`),
  CONSTRAINT `Product_supplierId_fkey` FOREIGN KEY (`supplierId`) REFERENCES `Supplier` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Product`
--

LOCK TABLES `Product` WRITE;
/*!40000 ALTER TABLE `Product` DISABLE KEYS */;
INSERT INTO `Product` VALUES ('1f8363c9-4b5c-4a8b-bac5-6da68e21d9bd','FLT-001','Filter Udara','Mesin','5d16301c-c34e-4826-8040-e595b4f3e93a'),('95b00c45-5607-43d9-bc12-13a2ff020c51','OIL-001','Motul 5100','Oli','5d16301c-c34e-4826-8040-e595b4f3e93a'),('db89de45-6820-4204-8767-c230e55212a4','BRK-001','Kampas Rem','Kaki-kaki','82e7396d-751a-4ecf-92e1-c267092d604c');
/*!40000 ALTER TABLE `Product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Reward`
--

DROP TABLE IF EXISTS `Reward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Reward` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `pointsCost` int DEFAULT NULL,
  `issuedAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `redeemedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Reward_customerId_idx` (`customerId`),
  KEY `Reward_status_idx` (`status`),
  CONSTRAINT `Reward_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Reward`
--

LOCK TABLES `Reward` WRITE;
/*!40000 ALTER TABLE `Reward` DISABLE KEYS */;
INSERT INTO `Reward` VALUES ('8e761927-bf75-4bbe-a5a8-14e8a29dcb9c','3138d4cc-d21a-4f9e-b620-bb17928bbabd','DISCOUNT','Voucher Diskon 10%','PENDING',200,'2026-01-15 04:27:25.703',NULL);
/*!40000 ALTER TABLE `Reward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `RolePermission`
--

DROP TABLE IF EXISTS `RolePermission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `RolePermission` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permissionId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `RolePermission_role_permissionId_key` (`role`,`permissionId`),
  KEY `RolePermission_role_idx` (`role`),
  KEY `RolePermission_userId_idx` (`userId`),
  KEY `RolePermission_permissionId_fkey` (`permissionId`),
  CONSTRAINT `RolePermission_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `Permission` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `RolePermission_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `RolePermission`
--

LOCK TABLES `RolePermission` WRITE;
/*!40000 ALTER TABLE `RolePermission` DISABLE KEYS */;
INSERT INTO `RolePermission` VALUES ('0415516d-5421-4ce6-9e8b-356b6b0fd376','ADMIN','718d14c2-d8cb-4391-920d-11db73cfe0ea',NULL,'2026-01-15 04:27:23.929'),('045a84a9-bfbb-4724-9bf1-53a30826f611','ADMIN','b614da16-d23b-4370-b21a-cae3a4c3fc72',NULL,'2026-01-15 04:27:23.977'),('04ab2751-e537-48b9-9884-6568fab01b7f','ADMIN','e74f4eb5-99e9-4049-98ab-0c926b949f7f',NULL,'2026-01-15 04:27:23.941'),('06afdd2e-831d-45ff-a9da-3f6fd6ae242c','OWNER','57d052ad-11db-4fec-bc97-bd773b105890',NULL,'2026-01-15 04:27:23.822'),('0c850a5a-c036-4c16-a831-8964051ac1f5','OWNER','e06f0520-e8fc-4b5c-8ceb-1d9b225d3124',NULL,'2026-01-15 04:27:23.854'),('112c86d8-e14d-48b7-9911-94b302805b1b','ADMIN','782502fe-d8ed-44ee-bb00-277cb55ecc05',NULL,'2026-01-15 04:27:23.905'),('1b6b6ca7-0981-4c0a-bb47-5387ca1cb1d0','OWNER','22d1e4f2-e20e-476f-93b4-e7c63ec5bc67',NULL,'2026-01-15 04:27:23.670'),('2008fc65-2159-4481-bf16-655dd6cc1d85','ADMIN','93268016-a4a1-484e-9494-fc242a3a07a1',NULL,'2026-01-15 04:27:24.011'),('21011244-62f4-4bb0-b994-0aa4e14f5ae6','OWNER','0d95f9a3-fc4b-4d4d-943e-4376fdc6163d',NULL,'2026-01-15 04:27:23.828'),('220e8957-22b1-47bc-b4d7-60019d770699','ADMIN','e06f0520-e8fc-4b5c-8ceb-1d9b225d3124',NULL,'2026-01-15 04:27:24.123'),('2c062de7-9781-4eee-abda-a4d929fc1e37','OWNER','cbfeb3cf-6acb-470e-8abb-665cd920df5a',NULL,'2026-01-15 04:27:23.846'),('2eaa5ff2-dd0e-43f5-afdf-010a8a33a78d','OWNER','db7a5a3c-2b85-41ac-8060-08d7524962e0',NULL,'2026-01-15 04:27:23.680'),('2fa26bc7-016c-4899-8a7e-56363b57bf92','OWNER','6bc4fa9a-fd5f-4c10-810f-b25a945dc6cc',NULL,'2026-01-15 04:27:23.860'),('31925e99-d681-4d56-aef6-19786548c43f','OWNER','b19a4510-24be-4e32-b4a2-f77bf50c8e31',NULL,'2026-01-15 04:27:23.644'),('343d7522-85b4-4c33-aa4d-ff2ebabe4147','MEKANIK','e74f4eb5-99e9-4049-98ab-0c926b949f7f',NULL,'2026-01-15 04:27:24.156'),('362f7791-414d-43cf-91ed-c4d5a87b9eb0','ADMIN','22d1e4f2-e20e-476f-93b4-e7c63ec5bc67',NULL,'2026-01-15 04:27:23.883'),('399f8f96-6339-4d8e-85db-1bf8e7a16567','OWNER','f5d70ea0-b80a-457c-9ef8-b2bda1a98c74',NULL,'2026-01-15 04:27:23.721'),('3b0e2234-0769-42e1-962b-1e1d6ad7f7fb','ADMIN','9b709e37-3f7a-408f-ad57-9c73849f8708',NULL,'2026-01-15 04:27:23.921'),('3e773098-01bf-4a73-842c-f2132e1da0bd','OWNER','2157893e-1953-40c7-ae99-0ce2c0285d22',NULL,'2026-01-15 04:27:23.767'),('3f14ad05-ff05-4949-b233-6cdf6535f346','OWNER','2e97c78c-e521-4ab8-9e11-c5a9b80d0257',NULL,'2026-01-15 04:27:23.841'),('43c4d7b1-79cb-435c-b27c-3d36293e423a','ADMIN','74c630ca-7029-490c-a010-bba30f08ffb2',NULL,'2026-01-15 04:27:24.089'),('445e59ff-c1ef-49cf-ac2f-a39f49c0d418','ADMIN','faf4281c-51dd-4482-802f-dea76ab4c9e2',NULL,'2026-01-15 04:27:23.967'),('480f67fa-f03a-4a5c-8613-f9fc245afcb1','OWNER','faf4281c-51dd-4482-802f-dea76ab4c9e2',NULL,'2026-01-15 04:27:23.774'),('4ad7f294-ced3-4a31-9cbe-f6cb5d4a73c7','ADMIN','57d052ad-11db-4fec-bc97-bd773b105890',NULL,'2026-01-15 04:27:24.058'),('50849d5f-99b1-4463-9c81-3f1ee0cd129c','ADMIN','68c74e06-58d8-4b2c-971a-a06be4a761cd',NULL,'2026-01-15 04:27:23.875'),('543539d2-6650-4384-90ce-67121e28c2c7','OWNER','e74f4eb5-99e9-4049-98ab-0c926b949f7f',NULL,'2026-01-15 04:27:23.755'),('58d0aee0-c92e-406f-bf18-dfc2208e88ca','MEKANIK','cbfeb3cf-6acb-470e-8abb-665cd920df5a',NULL,'2026-01-15 04:27:24.211'),('6b646795-cbb4-4ebc-9671-5a3dce90d3a0','ADMIN','2157893e-1953-40c7-ae99-0ce2c0285d22',NULL,'2026-01-15 04:27:23.955'),('74b6b126-4843-447f-91f3-646deb16ea20','ADMIN','96332c82-3f53-4b8f-af7d-ce10fdbce6f9',NULL,'2026-01-15 04:27:24.022'),('7540e609-35f2-44ec-a670-bb26effd4cfa','MEKANIK','93268016-a4a1-484e-9494-fc242a3a07a1',NULL,'2026-01-15 04:27:24.168'),('76d8f42d-693c-4f6d-a16c-ba8c46e17ccc','OWNER','74c630ca-7029-490c-a010-bba30f08ffb2',NULL,'2026-01-15 04:27:23.835'),('8027697d-500f-4da6-a6e1-060d87bb36bb','ADMIN','0d95f9a3-fc4b-4d4d-943e-4376fdc6163d',NULL,'2026-01-15 04:27:24.074'),('808aae4f-7092-4828-912f-9ed93d0ff0d6','OWNER','b614da16-d23b-4370-b21a-cae3a4c3fc72',NULL,'2026-01-15 04:27:23.785'),('86a153e9-c625-46df-a553-9d207187d4a0','ADMIN','2e97c78c-e521-4ab8-9e11-c5a9b80d0257',NULL,'2026-01-15 04:27:24.104'),('88c5646c-30b6-414e-85c7-c83890deb6ba','OWNER','7f3d5526-fa96-4e03-a750-c218814d7522',NULL,'2026-01-15 04:27:23.815'),('8dfa8eb9-9ac9-4755-8135-53945da5cd31','OWNER','68c74e06-58d8-4b2c-971a-a06be4a761cd',NULL,'2026-01-15 04:27:23.655'),('95c617fa-4806-430f-98e0-c583b1d2813b','OWNER','93268016-a4a1-484e-9494-fc242a3a07a1',NULL,'2026-01-15 04:27:23.803'),('9d09cd57-841a-4bdc-99ae-f3dff6c4bc94','ADMIN','7f3d5526-fa96-4e03-a750-c218814d7522',NULL,'2026-01-15 04:27:24.039'),('a2a76b21-3f92-4c97-a998-7ac48a8818ed','ADMIN','b19a4510-24be-4e32-b4a2-f77bf50c8e31',NULL,'2026-01-15 04:27:23.868'),('a8acc7ca-bc8e-46d5-b023-e8c6a9429aaf','MEKANIK','b19a4510-24be-4e32-b4a2-f77bf50c8e31',NULL,'2026-01-15 04:27:24.133'),('b2ad04fe-24d2-4d2d-8eef-8b6e63d9f6d1','OWNER','718d14c2-d8cb-4391-920d-11db73cfe0ea',NULL,'2026-01-15 04:27:23.742'),('b6069193-9a59-45af-8c3e-d749625b766d','MEKANIK','74c630ca-7029-490c-a010-bba30f08ffb2',NULL,'2026-01-15 04:27:24.193'),('bc58ad32-4c24-4f26-81d1-0de7007e9e98','ADMIN','00f97bfc-ecb0-498e-bdc3-28a053eed768',NULL,'2026-01-15 04:27:23.897'),('c5dbd48f-db0a-4cee-a291-80c91fd4c5bd','OWNER','9b709e37-3f7a-408f-ad57-9c73849f8708',NULL,'2026-01-15 04:27:23.733'),('d01e4c68-8c86-4f3f-a39c-540ffff80a06','MEKANIK','68c74e06-58d8-4b2c-971a-a06be4a761cd',NULL,'2026-01-15 04:27:24.144'),('d6c266d8-cd84-4b16-88c7-869fc4206096','OWNER','782502fe-d8ed-44ee-bb00-277cb55ecc05',NULL,'2026-01-15 04:27:23.708'),('d960b03e-afc1-42ba-85bb-1f5305a2037e','MEKANIK','0d95f9a3-fc4b-4d4d-943e-4376fdc6163d',NULL,'2026-01-15 04:27:24.178'),('decbc6c9-8e31-414f-b714-423e5c89747f','ADMIN','d7c0118a-2de0-4b88-b8b5-e2b187a0869e',NULL,'2026-01-15 04:27:23.994'),('e845ffae-c183-4d00-97d5-9fe76313c58c','ADMIN','cbfeb3cf-6acb-470e-8abb-665cd920df5a',NULL,'2026-01-15 04:27:24.114'),('e8aa4e1c-fee2-45a6-84cb-4fd2dbe79e13','ADMIN','db7a5a3c-2b85-41ac-8060-08d7524962e0',NULL,'2026-01-15 04:27:23.889'),('eb8321d6-2867-4b61-a060-3dc41252471d','OWNER','00f97bfc-ecb0-498e-bdc3-28a053eed768',NULL,'2026-01-15 04:27:23.694'),('f3de2778-ee25-4a64-843d-f2375d7d5633','ADMIN','f5d70ea0-b80a-457c-9ef8-b2bda1a98c74',NULL,'2026-01-15 04:27:23.913'),('f9cca030-deaa-4e7e-a263-f98f0cffcd63','OWNER','96332c82-3f53-4b8f-af7d-ce10fdbce6f9',NULL,'2026-01-15 04:27:23.809'),('fafe2eb4-06f9-4e86-8da0-eb776eae3bbe','OWNER','d7c0118a-2de0-4b88-b8b5-e2b187a0869e',NULL,'2026-01-15 04:27:23.794'),('ff195f4b-dd58-45d2-8291-7d2f0752ef3d','MEKANIK','2e97c78c-e521-4ab8-9e11-c5a9b80d0257',NULL,'2026-01-15 04:27:24.204');
/*!40000 ALTER TABLE `RolePermission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SatisfactionSurvey`
--

DROP TABLE IF EXISTS `SatisfactionSurvey`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SatisfactionSurvey` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `serviceOrderId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL,
  `feedback` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `SatisfactionSurvey_customerId_idx` (`customerId`),
  KEY `SatisfactionSurvey_serviceOrderId_idx` (`serviceOrderId`),
  KEY `SatisfactionSurvey_rating_idx` (`rating`),
  CONSTRAINT `SatisfactionSurvey_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `SatisfactionSurvey_serviceOrderId_fkey` FOREIGN KEY (`serviceOrderId`) REFERENCES `ServiceOrder` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SatisfactionSurvey`
--

LOCK TABLES `SatisfactionSurvey` WRITE;
/*!40000 ALTER TABLE `SatisfactionSurvey` DISABLE KEYS */;
INSERT INTO `SatisfactionSurvey` VALUES ('aa9da9c2-bce0-4809-884a-9d2bc9a01f1d','3138d4cc-d21a-4f9e-b620-bb17928bbabd','7edf3b84-42c6-4324-bc8f-af0e5dc98d67',3,'Perbaikan oke, tapi masih ada suara.','Phone','2026-01-15 04:27:25.745'),('e9ede56d-4266-4b81-b34c-b64150a18ef1','65867395-d3a5-445f-9804-31ca685915d4','7cbece87-3f1f-4345-b33c-eead3ac70178',5,'Servis cepat, mekanik ramah.','WhatsApp','2026-01-15 04:27:25.725');
/*!40000 ALTER TABLE `SatisfactionSurvey` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ServiceOrder`
--

DROP TABLE IF EXISTS `ServiceOrder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ServiceOrder` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `orderNumber` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `vehicleInfo` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `serviceType` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `scheduledDate` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `completedDate` datetime(3) DEFAULT NULL,
  `totalCost` int DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicleId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ServiceOrder_orderNumber_key` (`orderNumber`),
  KEY `ServiceOrder_customerId_fkey` (`customerId`),
  KEY `ServiceOrder_vehicleId_fkey` (`vehicleId`),
  CONSTRAINT `ServiceOrder_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `ServiceOrder_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ServiceOrder`
--

LOCK TABLES `ServiceOrder` WRITE;
/*!40000 ALTER TABLE `ServiceOrder` DISABLE KEYS */;
INSERT INTO `ServiceOrder` VALUES ('32c39a9d-f668-4ec1-bd0e-659695863d62','SO-2025-004','Dewi Lestari','Honda Vario - B 3456 GHI','Tune Up Mesin','Tune up lengkap mesin motor','PENDING','2025-12-20 00:00:00.000',NULL,250000,'2026-01-15 04:27:25.467','2026-01-15 04:27:25.467','51da9b17-7d89-45d0-bb97-242650efeba4','fccb809c-09ec-40bf-bb60-fcb4e4cb07c3'),('4b3c9835-3684-436c-8dba-3e923ab674d5','SO-2025-003','Andi Wijaya','Suzuki Nex - B 9012 DEF','Servis Rutin','Servis berkala 10000 km','IN_PROGRESS','2025-12-15 00:00:00.000',NULL,300000,'2026-01-15 04:27:25.454','2026-01-15 04:27:25.454','07100016-6cbf-455e-b49d-f45f3d3e043c','709a440a-1f64-42ce-9694-5c843974d611'),('7cbece87-3f1f-4345-b33c-eead3ac70178','SO-2025-001','Budi Santoso','Honda Beat - B 1234 ABC','Ganti Oli & Filter','Servis berkala 5000 km','COMPLETED','2025-12-01 00:00:00.000','2025-12-01 00:00:00.000',150000,'2026-01-15 04:27:25.412','2026-01-15 04:27:25.412','65867395-d3a5-445f-9804-31ca685915d4','aa44aa93-27ea-45fe-8ab5-85d66888e937'),('7edf3b84-42c6-4324-bc8f-af0e5dc98d67','SO-2025-002','Siti Aminah','Yamaha Mio - B 5678 XYZ','Perbaikan Rem','Ganti kampas rem depan dan belakang','COMPLETED','2025-12-05 00:00:00.000','2025-12-05 00:00:00.000',200000,'2026-01-15 04:27:25.439','2026-01-15 04:27:25.439','3138d4cc-d21a-4f9e-b620-bb17928bbabd','ca677a18-6ca5-4726-a4f9-b6bd33103481');
/*!40000 ALTER TABLE `ServiceOrder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Signature`
--

DROP TABLE IF EXISTS `Signature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Signature` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `imageData` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filePath` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `signerUserId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Signature_signerUserId_fkey` (`signerUserId`),
  CONSTRAINT `Signature_signerUserId_fkey` FOREIGN KEY (`signerUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Signature`
--

LOCK TABLES `Signature` WRITE;
/*!40000 ALTER TABLE `Signature` DISABLE KEYS */;
/*!40000 ALTER TABLE `Signature` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Supplier`
--

DROP TABLE IF EXISTS `Supplier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Supplier` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Supplier`
--

LOCK TABLES `Supplier` WRITE;
/*!40000 ALTER TABLE `Supplier` DISABLE KEYS */;
INSERT INTO `Supplier` VALUES ('5d16301c-c34e-4826-8040-e595b4f3e93a','PT. Mitra Oli Sejati'),('82e7396d-751a-4ecf-92e1-c267092d604c','CV. Sparepart Racing');
/*!40000 ALTER TABLE `Supplier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MEKANIK',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `User`
--

LOCK TABLES `User` WRITE;
/*!40000 ALTER TABLE `User` DISABLE KEYS */;
INSERT INTO `User` VALUES ('1b88d8c0-bd23-464b-b38a-24e81cc1b747','mekanik@example.com','Mekanik','$2b$10$8fITocdac7h/rVTdp0As4e/RcE9haXC3dugE5/Zc9YY3DHZ917/ty','MEKANIK','2026-01-15 04:27:25.129','2026-01-15 04:27:25.129'),('80630d38-06c5-4a56-8f15-982bb5a98e34','admin@example.com','Admin','$2b$10$BeEb/hl1sot4ApuG3AeNPOGoMb4eH4EM4X21NHobBCRqX2hMYxkiy','ADMIN','2026-01-15 04:27:25.112','2026-01-15 04:27:25.112'),('935d5baa-65e8-4016-8147-377faf45b83a','owner@example.com','Owner','$2b$10$5NEzGCtKKQdBLr2P/F4uu.RUJEdFVcz1E5pu9pMJUqJ.V8dXafgwS','OWNER','2026-01-15 04:27:25.088','2026-01-15 04:27:25.088'),('b5df4aa0-a4bc-4aff-bc49-66924668a4e3','mekanik2@example.com','Mekanik 2','$2b$10$8fITocdac7h/rVTdp0As4e/RcE9haXC3dugE5/Zc9YY3DHZ917/ty','MEKANIK','2026-01-15 04:27:25.145','2026-01-15 04:27:25.145');
/*!40000 ALTER TABLE `User` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `Vehicle`
--

DROP TABLE IF EXISTS `Vehicle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `Vehicle` (
  `id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerId` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `plateNumber` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `brand` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `model` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year` int DEFAULT NULL,
  `notes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Vehicle_customerId_idx` (`customerId`),
  CONSTRAINT `Vehicle_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `Vehicle`
--

LOCK TABLES `Vehicle` WRITE;
/*!40000 ALTER TABLE `Vehicle` DISABLE KEYS */;
INSERT INTO `Vehicle` VALUES ('709a440a-1f64-42ce-9694-5c843974d611','07100016-6cbf-455e-b49d-f45f3d3e043c','B 9012 DEF','Suzuki','Nex',2019,NULL,'2026-01-15 04:27:25.384','2026-01-15 04:27:25.384'),('aa44aa93-27ea-45fe-8ab5-85d66888e937','65867395-d3a5-445f-9804-31ca685915d4','B 1234 ABC','Honda','Beat',2021,NULL,'2026-01-15 04:27:25.346','2026-01-15 04:27:25.346'),('ca677a18-6ca5-4726-a4f9-b6bd33103481','3138d4cc-d21a-4f9e-b620-bb17928bbabd','B 5678 XYZ','Yamaha','Mio',2020,NULL,'2026-01-15 04:27:25.365','2026-01-15 04:27:25.365'),('fccb809c-09ec-40bf-bb60-fcb4e4cb07c3','51da9b17-7d89-45d0-bb97-242650efeba4','B 3456 GHI','Honda','Vario',2022,NULL,'2026-01-15 04:27:25.398','2026-01-15 04:27:25.398');
/*!40000 ALTER TABLE `Vehicle` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('815d4ebc-fa19-4cab-9776-ff55b69d7ae0','2ada6008f3b57bc8fa22fb8dd4c6f451fd22a7d73df97d8fa1b7c9000518af92','2026-01-14 09:36:42.622','20260114093642_add_loyalty_rewards',NULL,NULL,'2026-01-14 09:36:42.511',1),('bc39b09a-2b73-4d20-b056-87b3cdb99b1d','d5d20de06bd4b9bcbe8a19e629b68366e013464e7256745e57100a19b4cfa842','2026-01-13 21:57:19.431','20260113215718_init_mysql',NULL,NULL,'2026-01-13 21:57:18.501',1),('c0dd62de-90e7-484b-ab58-6a78fd0914a6','bb78058989d629e78c8d9c8eb3bf9d1db185f1dbacefcbc8ecf092d43c96e8d0','2026-01-14 10:18:42.432','20260114101842_add_promo_communications_meta',NULL,NULL,'2026-01-14 10:18:42.297',1),('e5f787a2-388f-4574-94aa-4c818583e38b','b9e880910683780302afbf43c09eb23c2b89e8edf83e8bc20d45981c37d8bcdc','2026-01-13 23:01:15.125','20260113230114_add_crm',NULL,NULL,'2026-01-13 23:01:14.706',1),('e84747cd-0f03-485e-a8ee-0eb93c1448c0','3aba1decbd33974c15fb7c9f3da0396fe076d210ee7c12e5b6b107a0ff488c1e','2026-01-14 05:24:17.970','20260114052417_add_loyalty',NULL,NULL,'2026-01-14 05:24:17.724',1),('f195f310-facc-4553-982c-a5b4bd68801e','1f3a59a617c544e5e58352d532789b8311211dcf49ad23cf83ef1b90a00b4486','2026-01-14 06:48:31.474','20260114064831_add_crm_satisfaction_communications',NULL,NULL,'2026-01-14 06:48:31.229',1),('f1d50782-b6aa-4910-8fbc-ff43765db8a7','dfc6e37c598073567cef25a0dfd2539e251a5158fe62c7fd6a9bd28596cb0c95','2026-01-13 23:22:24.778','20260113232224_add_crm_complaints_followups',NULL,NULL,'2026-01-13 23:22:24.495',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-15 11:28:44
