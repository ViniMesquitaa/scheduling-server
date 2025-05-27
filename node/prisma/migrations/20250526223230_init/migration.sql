-- CreateTable
CREATE TABLE "Agendamento" (
    "id_agendamento" SERIAL NOT NULL,
    "dia_agendado" TIMESTAMP(3) NOT NULL,
    "turno_agendado" TEXT NOT NULL,
    "observacoes" TEXT,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "id_zona" INTEGER,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id_agendamento")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id_cliente" SERIAL NOT NULL,
    "nome_cliente" TEXT NOT NULL,
    "telefone_cliente" TEXT NOT NULL,
    "qr_code" TEXT,
    "id_endereco" INTEGER NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id_cliente")
);

-- CreateTable
CREATE TABLE "Coleta" (
    "id_coleta" SERIAL NOT NULL,
    "dia_realizado" TIMESTAMP(3) NOT NULL,
    "horario_realizado" TIMESTAMP(3) NOT NULL,
    "id_cliente" INTEGER NOT NULL,
    "id_usuario" INTEGER NOT NULL,

    CONSTRAINT "Coleta_pkey" PRIMARY KEY ("id_coleta")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id_endereco" SERIAL NOT NULL,
    "nome_rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "id_zona" INTEGER NOT NULL,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id_endereco")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "tipo_usuario" TEXT NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Zona" (
    "id" SERIAL NOT NULL,
    "nome_da_zona" TEXT NOT NULL,
    "qtd_coletas_esperadas" INTEGER NOT NULL,
    "dias" JSONB NOT NULL,
    "cor" TEXT NOT NULL,

    CONSTRAINT "Zona_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefone_cliente_key" ON "Cliente"("telefone_cliente");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_qr_code_key" ON "Cliente"("qr_code");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Zona_nome_da_zona_key" ON "Zona"("nome_da_zona");

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "Zona"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_id_endereco_fkey" FOREIGN KEY ("id_endereco") REFERENCES "Endereco"("id_endereco") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coleta" ADD CONSTRAINT "Coleta_id_cliente_fkey" FOREIGN KEY ("id_cliente") REFERENCES "Cliente"("id_cliente") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Coleta" ADD CONSTRAINT "Coleta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_id_zona_fkey" FOREIGN KEY ("id_zona") REFERENCES "Zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
