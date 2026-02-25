CREATE TABLE `ServiceLiveUpdate` (
  `id` VARCHAR(191) NOT NULL,
  `serviceOrderId` VARCHAR(191) NOT NULL,
  `updateType` VARCHAR(191) NOT NULL,
  `mediaType` VARCHAR(191) NULL,
  `mediaUrl` TEXT NULL,
  `caption` TEXT NULL,
  `directNote` TEXT NULL,
  `createdById` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ServiceLiveUpdate_serviceOrderId_createdAt_idx`(`serviceOrderId`, `createdAt`),
  INDEX `ServiceLiveUpdate_createdById_idx`(`createdById`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ServiceLiveUpdate`
  ADD CONSTRAINT `ServiceLiveUpdate_serviceOrderId_fkey`
  FOREIGN KEY (`serviceOrderId`) REFERENCES `ServiceOrder`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ServiceLiveUpdate`
  ADD CONSTRAINT `ServiceLiveUpdate_createdById_fkey`
  FOREIGN KEY (`createdById`) REFERENCES `User`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
