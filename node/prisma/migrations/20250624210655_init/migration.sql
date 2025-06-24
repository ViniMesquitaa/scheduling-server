-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('PENDENTE', 'REALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('GRANDE_GERADOR', 'PEQUENO_GERADOR');

-- CreateTable
CREATE TABLE "agendamentos" (
    "id_agendamento" SERIAL NOT NULL,
    "dia_agendado" TIMESTAMP(3) NOT NULL,
    "turno_agendado" TEXT NOT NULL,
    "observacoes" TEXT,
    "dia_realizado" TIMESTAMP(3),
    "horario_realizado" TEXT,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_zona" INTEGER,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'PENDENTE',

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id_agendamento")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id_cliente" SERIAL NOT NULL,
    "nome_cliente" TEXT NOT NULL,
    "telefone_cliente" TEXT NOT NULL,
    "qr_code" TEXT,
    "id_endereco" INTEGER NOT NULL,
    "tipo" "TipoCliente" NOT NULL DEFAULT 'PEQUENO_GERADOR',

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "coletas" (
    "id_coleta" SERIAL NOT NULL,
    "dia_realizado" TIMESTAMP(3) NOT NULL,
    "horario_realizado" TIMESTAMP(3) NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "coletas_pkey" PRIMARY KEY ("id_coleta")
);

-- CreateTable
CREATE TABLE "enderecos" (
    "id_endereco" SERIAL NOT NULL,
    "nome_rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "id_zona" INTEGER NOT NULL,

    CONSTRAINT "enderecos_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo_usuario" TEXT NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "admin" (
    "id_admin" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "precisa_redefinir" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("id_admin")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" SERIAL NOT NULL,
    "nome_da_zona" TEXT NOT NULL,
    "qtd_coletas_esperadas" INTEGER NOT NULL,
    "dias" JSONB NOT NULL,
    "cor" TEXT NOT NULL,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_agendamentos_id_cliente" ON "agendamentos"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_agendamentos_id_usuario" ON "agendamentos"("id_usuario");

-- CreateIndex
CREATE INDEX "idx_agendamentos_id_zona" ON "agendamentos"("id_zona");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_telefone_cliente_key" ON "clientes"("telefone_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_qr_code_key" ON "clientes"("qr_code");

-- CreateIndex
CREATE INDEX "idx_clientes_id_endereco" ON "clientes"("id_endereco");

-- CreateIndex
CREATE INDEX "idx_coletas_id_cliente" ON "coletas"("id_cliente");

-- CreateIndex
CREATE INDEX "idx_coletas_id_usuario" ON "coletas"("id_usuario");

-- CreateIndex
CREATE INDEX "idx_enderecos_id_zona" ON "enderecos"("id_zona");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "zonas_nome_da_zona_key" ON "zonas"("nome_da_zona");

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "enderecos"("id_endereco") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coletas" ADD CONSTRAINT "coletas_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "clientes"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coletas" ADD CONSTRAINT "coletas_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enderecos" ADD CONSTRAINT "enderecos_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
