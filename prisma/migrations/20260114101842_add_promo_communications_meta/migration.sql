-- AlterTable
ALTER TABLE `CommunicationLog` ADD COLUMN `campaign` VARCHAR(191) NULL,
    ADD COLUMN `source` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Customer` ADD COLUMN `customerType` VARCHAR(191) NULL;
