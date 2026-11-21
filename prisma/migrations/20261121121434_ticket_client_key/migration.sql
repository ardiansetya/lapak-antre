-- AlterTable
ALTER TABLE `ticket` ADD COLUMN `clientKey` VARCHAR(64) NULL;

-- CreateIndex
CREATE INDEX `Ticket_branchId_clientKey_createdAt_idx` ON `Ticket`(`branchId`, `clientKey`, `createdAt`);
