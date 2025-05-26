/*
  Warnings:

  - You are about to drop the column `email` on the `cliente` table. All the data in the column will be lost.
  - You are about to drop the column `qtd_coletas_realizadas` on the `cliente` table. All the data in the column will be lost.
  - You are about to drop the column `id_zona` on the `endereco` table. All the data in the column will be lost.
  - The primary key for the `zona` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `dias_coleta` on the `zona` table. All the data in the column will be lost.
  - You are about to drop the column `id_zona` on the `zona` table. All the data in the column will be lost.
  - You are about to drop the column `nome_zona` on the `zona` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telefone_cliente]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[qr_code]` on the table `Cliente` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nome_da_zona]` on the table `Zona` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `cor` to the `Zona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dias` to the `Zona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `Zona` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nome_da_zona` to the `Zona` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `agendamento` DROP FOREIGN KEY `Agendamento_id_cliente_fkey`;

-- DropForeignKey
ALTER TABLE `agendamento` DROP FOREIGN KEY `Agendamento_id_zona_fkey`;

-- DropForeignKey
ALTER TABLE `coleta` DROP FOREIGN KEY `Coleta_id_cliente_fkey`;

-- DropForeignKey
ALTER TABLE `endereco` DROP FOREIGN KEY `Endereco_id_zona_fkey`;

-- DropIndex
DROP INDEX `Agendamento_id_cliente_fkey` ON `agendamento`;

-- DropIndex
DROP INDEX `Agendamento_id_zona_fkey` ON `agendamento`;

-- DropIndex
DROP INDEX `Coleta_id_cliente_fkey` ON `coleta`;

-- DropIndex
DROP INDEX `Endereco_id_zona_fkey` ON `endereco`;

-- AlterTable
ALTER TABLE `cliente` DROP COLUMN `email`,
    DROP COLUMN `qtd_coletas_realizadas`,
    ADD COLUMN `id_zona` INTEGER NULL;

-- AlterTable
ALTER TABLE `endereco` DROP COLUMN `id_zona`;

-- AlterTable
ALTER TABLE `zona` DROP PRIMARY KEY,
    DROP COLUMN `dias_coleta`,
    DROP COLUMN `id_zona`,
    DROP COLUMN `nome_zona`,
    ADD COLUMN `cor` VARCHAR(191) NOT NULL,
    ADD COLUMN `dias` JSON NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD COLUMN `nome_da_zona` VARCHAR(191) NOT NULL,
    ADD PRIMARY KEY (`id`);

-- CreateIndex
CREATE UNIQUE INDEX `Cliente_telefone_cliente_key` ON `Cliente`(`telefone_cliente`);

-- CreateIndex
CREATE UNIQUE INDEX `Cliente_qr_code_key` ON `Cliente`(`qr_code`);

-- CreateIndex
CREATE UNIQUE INDEX `Zona_nome_da_zona_key` ON `Zona`(`nome_da_zona`);

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `Zona`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `Zona`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coleta` ADD CONSTRAINT `Coleta_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE;
