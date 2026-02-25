-- Add structured mechanic note fields for behavior tracking
ALTER TABLE `MechanicNote`
  ADD COLUMN `partType` VARCHAR(191) NULL,
  ADD COLUMN `partsUsed` TEXT NULL;
