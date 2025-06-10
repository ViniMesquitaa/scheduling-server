-- CreateTable
CREATE TABLE `agendamentos` (
    `id_agendamento` INTEGER NOT NULL AUTO_INCREMENT,
    `dia_agendado` DATETIME(3) NOT NULL,
    `turno_agendado` VARCHAR(191) NOT NULL,
    `observacoes` VARCHAR(191) NULL,
    `dia_realizado` DATETIME(3) NULL,
    `horario_realizado` VARCHAR(191) NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `id_zona` INTEGER NULL,
    `status` ENUM('PENDENTE', 'REALIZADO', 'CANCELADO') NOT NULL DEFAULT 'PENDENTE',

    INDEX `agendamentos_id_cliente_fkey`(`id_cliente`),
    INDEX `agendamentos_id_usuario_fkey`(`id_usuario`),
    INDEX `agendamentos_id_zona_fkey`(`id_zona`),
    PRIMARY KEY (`id_agendamento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_cliente` VARCHAR(191) NOT NULL,
    `telefone_cliente` VARCHAR(191) NOT NULL,
    `qr_code` VARCHAR(191) NULL,
    `id_endereco` INTEGER NOT NULL,
    `tipo` ENUM('GRANDE_GERADOR', 'PEQUENO_GERADOR') NOT NULL DEFAULT 'PEQUENO_GERADOR',

    UNIQUE INDEX `clientes_telefone_cliente_key`(`telefone_cliente`),
    UNIQUE INDEX `clientes_qr_code_key`(`qr_code`),
    INDEX `clientes_id_endereco_fkey`(`id_endereco`),
    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coletas` (
    `id_coleta` INTEGER NOT NULL AUTO_INCREMENT,
    `dia_realizado` DATETIME(3) NOT NULL,
    `horario_realizado` DATETIME(3) NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,

    INDEX `coletas_id_cliente_fkey`(`id_cliente`),
    INDEX `coletas_id_usuario_fkey`(`id_usuario`),
    PRIMARY KEY (`id_coleta`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `enderecos` (
    `id_endereco` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_rua` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(191) NOT NULL,
    `bairro` VARCHAR(191) NOT NULL,
    `id_zona` INTEGER NOT NULL,

    INDEX `enderecos_id_zona_fkey`(`id_zona`),
    PRIMARY KEY (`id_endereco`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id_usuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `tipo_usuario` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id_usuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zonas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome_da_zona` VARCHAR(191) NOT NULL,
    `qtd_coletas_esperadas` INTEGER NOT NULL,
    `dias` JSON NOT NULL,
    `cor` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `zonas_nome_da_zona_key`(`nome_da_zona`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agendamentos` ADD CONSTRAINT `agendamentos_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `zonas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_id_endereco_fkey` FOREIGN KEY (`id_endereco`) REFERENCES `enderecos`(`id_endereco`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coletas` ADD CONSTRAINT `coletas_id_cliente_fkey` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coletas` ADD CONSTRAINT `coletas_id_usuario_fkey` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `enderecos` ADD CONSTRAINT `enderecos_id_zona_fkey` FOREIGN KEY (`id_zona`) REFERENCES `zonas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
