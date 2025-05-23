/*
  Warnings:

  - You are about to drop the column `zonaId_zona` on the `agendamento` table. All the data in the column will be lost.
  - You are about to drop the column `enderecoId_endereco` on the `usuario` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `agendamento` DROP FOREIGN KEY `Agendamento_zonaId_zona_fkey`;

-- DropForeignKey
ALTER TABLE `usuario` DROP FOREIGN KEY `Usuario_enderecoId_endereco_fkey`;

-- DropIndex
DROP INDEX `Agendamento_zonaId_zona_fkey` ON `agendamento`;

-- DropIndex
DROP INDEX `Usuario_enderecoId_endereco_fkey` ON `usuario`;

-- AlterTable
ALTER TABLE `agendamento` DROP COLUMN `zonaId_zona`,
    ADD COLUMN `id_zona` INTEGER NULL;

-- AlterTable
ALTER TABLE `usuario` DROP COLUMN `enderecoId_endereco`;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `Zona`(`id_zona`) ON DELETE SET NULL ON UPDATE CASCADE;
