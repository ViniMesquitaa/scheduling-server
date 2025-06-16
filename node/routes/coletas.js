const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Criar nova coleta
router.post("/", async (req, res) => {
  const { clienteId, diaRealizado, horarioRealizado, qtdColetas } = req.body;

  try {
    const coleta = await prisma.coleta.create({
      data: {
        clienteId,
        diaRealizado: new Date(diaRealizado),
        horarioRealizado,
        qtdColetas: Number(qtdColetas),
      },
    });

    res.status(201).json(coleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar coleta" });
  }
});

router.post("/coleta-qrcode", async (req, res) => {
  const {qr_code, diaRealizado, horarioRealizado, id_usuario} = req.body;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { qr_code },
      include: { endereco: true},
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const dataHoraRealizado = new Date(`${diaRealizado}T${horarioRealizado}:00.000Z`);

    const coleta = await prisma.coleta.create({
      data: {
        id_cliente: cliente.id_cliente,
        dia_realizado: new Date(diaRealizado),
        horario_realizado: dataHoraRealizado,
        id_usuario,
      },
    });

    res.status(201).json(coleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar coleta" });
  }
});

// Listar todas as coletas com dados do cliente
router.get("/", async (req, res) => {
  try {
    const coletas = await prisma.coleta.findMany({
      include: {
        cliente: true,
      },
    });

    const resultado = coletas.map(coleta => ({
      id: coleta.id,
      nomeCliente: coleta.cliente.nome,
      diaRealizado: coleta.diaRealizado,
      horarioRealizado: coleta.horarioRealizado,
      zona: coleta.cliente.bairro, // ou outro campo que represente "zona"
      qtdColetas: coleta.qtdColetas,
    }));

    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao listar coletas" });
  }
});

// Buscar coleta por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const coleta = await prisma.coleta.findUnique({
      where: { id },
      include: { cliente: true },
    });

    if (!coleta) {
      return res.status(404).json({ message: "Coleta não encontrada" });
    }

    res.status(200).json({
      id: coleta.id,
      nomeCliente: coleta.cliente.nome,
      diaRealizado: coleta.diaRealizado,
      horarioRealizado: coleta.horarioRealizado,
      zona: coleta.cliente.bairro,
      qtdColetas: coleta.qtdColetas,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar coleta" });
  }
});

// Atualizar coleta por ID
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { diaRealizado, horarioRealizado, qtdColetas } = req.body;

  try {
    const coleta = await prisma.coleta.update({
      where: { id },
      data: {
        diaRealizado: new Date(diaRealizado),
        horarioRealizado,
        qtdColetas: Number(qtdColetas),
      },
    });

    res.status(200).json(coleta);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar coleta" });
  }
});

// Deletar coleta por ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.coleta.delete({ where: { id } });
    res.status(200).json({ message: "Coleta deletada com sucesso" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao deletar coleta" });
  }
});

module.exports = router;
