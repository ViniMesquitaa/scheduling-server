-- CreateTable
CREATE TABLE `Agendamento` (
    `id_agendamento` INTEGER NOT NULL AUTO_INCREMENT,
    `dia_agendado` DATETIME(3) NOT NULL,
    `turno_agendado` VARCHAR(191) NOT NULL,
    `observacoes` VARCHAR(191) NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `zonaId_zona` INTEGER NULL,

    PRIMARY KEY (`id_agendamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cliente` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_cliente` VARCHAR(191) NOT NULL,
    `telefone_cliente` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `qr_code` VARCHAR(191) NULL,
    `qtd_coletas_realizadas` INTEGER NOT NULL DEFAULT 0,
    `id_endereco` INTEGER NOT NULL,

    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coleta` (
    `id_coleta` INTEGER NOT NULL AUTO_INCREMENT,
    `dia_realizado` DATETIME(3) NOT NULL,
    `horario_realizado` DATETIME(3) NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,

    PRIMARY KEY (`id_coleta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Endereco` (
    `id_endereco` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_rua` VARCHAR(191) NOT NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `id_zona` INTEGER NULL,

    PRIMARY KEY (`id_endereco`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Usuario` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `tipo_usuario` VARCHAR(191) NOT NULL,
    `enderecoId_endereco` INTEGER NULL,

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Zona` (
    `id_zona` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_zona` VARCHAR(100) NOT NULL,
    `qtd_coletas_esperadas` INTEGER NOT NULL,
    `dias_coleta` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_zona`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Agendamento` ADD CONSTRAINT `Agendamento_zonaId_zona_fkey` FOREIGN KEY (`zonaId_zona`) REFERENCES `Zona`(`id_zona`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cliente` ADD CONSTRAINT `Cliente_id_endereco_fkey` FOREIGN KEY (`id_endereco`) REFERENCES `Endereco`(`id_endereco`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coleta` ADD CONSTRAINT `Coleta_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `Cliente`(`id_cliente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coleta` ADD CONSTRAINT `Coleta_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Endereco` ADD CONSTRAINT `Endereco_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `Zona`(`id_zona`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Usuario` ADD CONSTRAINT `Usuario_enderecoId_endereco_fkey` FOREIGN KEY (`enderecoId_endereco`) REFERENCES `Endereco`(`id_endereco`) ON DELETE SET NULL ON UPDATE CASCADE;
