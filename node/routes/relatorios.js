const express = require("express");
const router = express.Router();
const {
  montarFiltros,
  agruparPorCliente,
  agruparPrevisoesPorCliente,
} = require("../utils/utilsRelatorios");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

router.get("/agendamentos-cancelados", async (req, res) => {
  const { nomeCliente } = req.query;

  try {
    const agendamentos = await prisma.agendamento.findMany({
      orderBy: {
        id_agendamento: "asc",
      },
      where: {
        status: "CANCELADO",
        cliente: {
          nome_cliente: {
            contains: nomeCliente || "",
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
      zona: a.zona
        ? { nome_da_zona: a.zona.nome_da_zona, cor: a.zona.cor }
        : { nome_da_zona: "Não atribuída", cor: "default" },
      observacoes: a.observacoes || "",
    }));

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos cancelados" });
  }
});

router.get("/coletas-por-cliente", async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Datas inválidas ou ausentes" });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (isNaN(start) || isNaN(end)) {
    return res.status(400).json({ error: "Datas inválidas" });
  }

  try {
    // 1. Agrupar agendamentos por cliente e status, filtrando pela data
    const dados = await prisma.agendamento.groupBy({
      by: ["id_cliente", "status"],
      where: {
        dia_agendado: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        _all: true,
      },
    });

    if (dados.length === 0) return res.json([]);

    // 2. Pegar ids únicos dos clientes
    const clienteIds = [...new Set(dados.map((item) => item.id_cliente))];

    // 3. Buscar clientes junto com endereço e zona (via relacionamento)
    const clientes = await prisma.cliente.findMany({
      where: { id_cliente: { in: clienteIds } },
      select: {
        id_cliente: true,
        nome_cliente: true,
        endereco: {
          select: {
            zona: {
              select: {
                nome_da_zona: true,
              },
            },
          },
        },
      },
    });

    // 4. Criar mapa clienteId -> { nome_cliente, zona }
    const clienteMap = new Map(
      clientes.map((cli) => [
        cli.id_cliente,
        {
          nome: cli.nome_cliente,
          zona: cli.endereco?.zona?.nome_da_zona || "Indefinida",
        },
      ])
    );

    // 5. Montar resultado agregando os status
    const resultadoMap = new Map();

    dados.forEach(({ id_cliente, status, _count }) => {
      if (!resultadoMap.has(id_cliente)) {
        resultadoMap.set(id_cliente, {
          nome_cliente: clienteMap.get(id_cliente)?.nome || "Cliente não encontrado",
          zona: clienteMap.get(id_cliente)?.zona || "Indefinida",
          coletasRealizadas: 0,
          coletasPrevistas: 0,
          coletasCanceladas: 0,
        });
      }
      const clienteData = resultadoMap.get(id_cliente);

      if (status === "REALIZADO") clienteData.coletasRealizadas = _count._all;
      else if (status === "PENDENTE") clienteData.coletasPrevistas = _count._all;
      else if (status === "CANCELADO") clienteData.coletasCanceladas = _count._all;
    });

    // 6. Garantir que clientes sem agendamento apareçam também (opcional)
    clientes.forEach(({ id_cliente }) => {
      if (!resultadoMap.has(id_cliente)) {
        resultadoMap.set(id_cliente, {
          nome_cliente: clienteMap.get(id_cliente)?.nome || "Cliente não encontrado",
          zona: clienteMap.get(id_cliente)?.zona || "Indefinida",
          coletasRealizadas: 0,
          coletasPrevistas: 0,
          coletasCanceladas: 0,
        });
      }
    });

    const resultado = Array.from(resultadoMap.values());

    return res.json(resultado);
  } catch (err) {
    console.error("Erro ao buscar coletas por cliente:", err);
    return res.status(500).json({ error: "Erro ao buscar coletas por cliente" });
  }
});


router.get("/coletas-realizadas", async (req, res) => {
  const { nomeCliente, nomeZona, startDate, endDate } = req.query;

  try {
    let zonaId = null;

    if (nomeZona) {
      const zona = await prisma.zona.findUnique({
        where: { nome_da_zona: nomeZona },
      });

      if (!zona) {
        return res.status(404).json({ error: "Zona não encontrada" });
      }

      zonaId = zona.id;
    }

    const { filtroColeta, filtroAgendamento } = montarFiltros({
      nomeCliente: nomeCliente || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      zonaId: zonaId || undefined,
      status: "REALIZADO",
    });

    const coletas = await prisma.coleta.findMany({
      where: filtroColeta,
      select: {
        id_coleta: true,
        dia_realizado: true,
        cliente: {
          select: {
            id_cliente: true,
            nome_cliente: true,
            endereco: {
              select: {
                zona: { select: { nome_da_zona: true, cor: true } },
              },
            },
          },
        },
      },
    });

    const agendamentos = await prisma.agendamento.findMany({
      where: filtroAgendamento,
      select: {
        id_agendamento: true,
        dia_realizado: true,
        cliente: {
          select: {
            id_cliente: true,
            nome_cliente: true,
            endereco: {
              select: {
                zona: { select: { nome_da_zona: true, cor: true } },
              },
            },
          },
        },
      },
    });

    const resultado = agruparPorCliente(coletas, agendamentos);
    res.status(200).json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar coletas realizadas" });
  }
});

router.get("/coletas-previstas", async (req, res) => {
  const { nomeCliente, nomeZona, startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Informe o período (startDate e endDate)." });
  }

  const dataInicio = new Date(`${startDate}T03:00:00Z`);
  const dataFim = new Date(`${endDate}T02:59:59Z`);
  const diffEmDias = (dataFim - dataInicio) / (1000 * 60 * 60 * 24);

  if (diffEmDias > 31) {
    return res
      .status(400)
      .json({
        error: "O intervalo entre as datas não pode ultrapassar 31 dias.",
      });
  }

  try {
    let zonaId = null;
    if (nomeZona) {
      const zona = await prisma.zona.findUnique({
        where: { nome_da_zona: nomeZona },
      });
      if (!zona) return res.status(404).json({ error: "Zona não encontrada" });
      zonaId = zona.id;
    }
    const { filtroAgendamento } = montarFiltros({
      nomeCliente,
      startDate,
      endDate,
      zonaId,
      status: "PENDENTE",
    });

    const clientes = await prisma.cliente.findMany({
      where: filtroAgendamento.cliente,
      select: {
        id_cliente: true,
        nome_cliente: true,
        endereco: {
          select: {
            zona: { select: { id: true, nome_da_zona: true, dias: true } },
          },
        },
      },
    });

    if (clientes.length === 0) {
      return res.status(200).json([]);
    }

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        ...filtroAgendamento,
        id_cliente: { in: clientes.map((c) => c.id_cliente) },
      },
      select: {
        id_agendamento: true,
        dia_agendado: true,
        cliente: {
          select: {
            id_cliente: true,
            nome_cliente: true,
            endereco: {
              select: {
                zona: { select: { id: true, nome_da_zona: true, dias: true } },
              },
            },
          },
        },
      },
    });

    const resultadoCompleto = agruparPrevisoesPorCliente(
      clientes,
      agendamentos,
      dataInicio,
      dataFim
    );
    const resultadoFiltrado = resultadoCompleto.filter(
      (c) => c.datas_previstas.length > 0
    );

    res.status(200).json(resultadoFiltrado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar coletas previstas" });
  }
});

module.exports = router;
