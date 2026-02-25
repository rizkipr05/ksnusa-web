CREATE TABLE `PostServiceFeedback` (
  `id` VARCHAR(191) NOT NULL,
  `customerId` VARCHAR(191) NOT NULL,
  `serviceOrderId` VARCHAR(191) NULL,
  `question` TEXT NOT NULL,
  `answer` TEXT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'OPEN',
  `askedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `answeredAt` DATETIME(3) NULL,
  `answeredById` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  INDEX `PostServiceFeedback_customerId_askedAt_idx`(`customerId`, `askedAt`),
  INDEX `PostServiceFeedback_serviceOrderId_idx`(`serviceOrderId`),
  INDEX `PostServiceFeedback_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `PostServiceFeedback`
  ADD CONSTRAINT `PostServiceFeedback_customerId_fkey`
  FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `PostServiceFeedback`
  ADD CONSTRAINT `PostServiceFeedback_serviceOrderId_fkey`
  FOREIGN KEY (`serviceOrderId`) REFERENCES `ServiceOrder`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `PostServiceFeedback`
  ADD CONSTRAINT `PostServiceFeedback_answeredById_fkey`
  FOREIGN KEY (`answeredById`) REFERENCES `User`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
