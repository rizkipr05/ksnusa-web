-- AlterTable
ALTER TABLE `MechanicNote` MODIFY `partsUsed` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ServiceLiveUpdate` MODIFY `mediaUrl` VARCHAR(191) NULL,
    MODIFY `caption` VARCHAR(191) NULL,
    MODIFY `directNote` VARCHAR(191) NULL;
