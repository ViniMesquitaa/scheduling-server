/*
  Warnings:

  - You are about to drop the column `id_zona` on the `cliente` table. All the data in the column will be lost.
  - Added the required column `id_zona` to the `Endereco` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `cliente` DROP FOREIGN KEY `Cliente_id_zona_fkey`;

-- DropIndex
DROP INDEX `Cliente_id_zona_fkey` ON `cliente`;

-- AlterTable
ALTER TABLE `cliente` DROP COLUMN `id_zona`;

-- AlterTable
ALTER TABLE `endereco` ADD COLUMN `id_zona` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `Endereco` ADD CONSTRAINT `Endereco_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `Zona`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
