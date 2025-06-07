const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Rota 1: Agendamentos Cancelados
router.get("/agendamentos-cancelados", async (req, res) => {
  const { startDate, endDate, nomeCliente } = req.query;

  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        status: "CANCELADO",
        dia_agendado: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
        cliente: {
          nome_cliente: {
            contains: nomeCliente || "",
            mode: "insensitive",
          },
        },
      },
      include: {
        cliente: {
          include: {
            endereco: true,
          },
        },
        zona: true,
      },
    });

    const resultado = agendamentos.map((a) => ({
      id: a.id_agendamento,
      cliente: a.cliente.nome_cliente,
      data_agendada: a.dia_agendado,
      turno: a.turno_agendado,
      status: a.status,
      endereco: `${a.cliente.endereco.nome_rua}, ${a.cliente.endereco.numero}, ${a.cliente.endereco.bairro}`,
      zona: a.zona?.nome_da_zona || "Não atribuída",
      observacoes: a.observacoes || "",
    }));

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos cancelados" });
  }
});

// Rota 2: Coletas por Cliente
router.get("/coletas-por-cliente", async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const dados = await prisma.agendamento.groupBy({
      by: ["id_cliente"],
      where: {
        status: "REALIZADO",
        dia_agendado: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      _count: {
        _all: true,
      },
    });

    const resultado = await Promise.all(
      dados.map(async (item) => {
        const cliente = await prisma.cliente.findUnique({
          where: { id_cliente: item.id_cliente },
        });

        return {
          nome_cliente: cliente?.nome_cliente || "Cliente não encontrado",
          quantidade_de_coletas: item._count._all,
        };
      })
    );

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar coletas por cliente" });
  }
});

module.exports = router;
