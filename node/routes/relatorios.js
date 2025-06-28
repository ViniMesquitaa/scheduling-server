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
      data_agendada: a.dia_agendado.toISOString().split("T")[0],
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
  if (!startDate || !endDate)
    return res.status(400).json({ error: "Datas inválidas ou ausentes" });

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end))
    return res.status(400).json({ error: "Datas inválidas" });
  end.setHours(23, 59, 59, 999);

  try {
    // Buscar clientes com seus endereços e zonas
    const clientes = await prisma.cliente.findMany({
      include: {
        endereco: {
          include: {
            zona: true,
          },
        },
      },
    });

    // Buscar agendamentos no período selecionado
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        dia_agendado: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id_cliente: true,
        dia_agendado: true,
        status: true,
      },
    });

    // Agrupar agendamentos por cliente
    const agendamentosPorCliente = new Map();
    for (const ag of agendamentos) {
      if (!agendamentosPorCliente.has(ag.id_cliente)) {
        agendamentosPorCliente.set(ag.id_cliente, []);
      }
      agendamentosPorCliente.get(ag.id_cliente).push(ag);
    }

    const resultado = [];

    for (const cliente of clientes) {
      const zona = cliente.endereco?.zona;
      
      const dias = Array.isArray(zona?.dias) ? zona.dias : [];
      const diasSemana = dias.map((dia) => dia.toLowerCase().replace(".", ""));

      let datasPrevistas = [];

      let dataAtual = new Date(start);
      while (dataAtual <= end) {
        const diaSemana = dataAtual
          .toLocaleDateString("pt-BR", { weekday: "short" })
          .toLowerCase()
          .replace(".", "");
        
        if (diasSemana.includes(diaSemana)) {
          datasPrevistas.push(dataAtual.toISOString().slice(0, 10));
        }

        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      const ags = agendamentosPorCliente.get(cliente.id_cliente) || [];

      const realizadas = new Set(
        ags
          .filter((a) => a.status.toUpperCase() === "REALIZADO")
          .map((a) => a.dia_agendado.toISOString().slice(0, 10))
      );
      const canceladas = new Set(
        ags
          .filter((a) => a.status.toUpperCase() === "CANCELADO")
          .map((a) => a.dia_agendado.toISOString().slice(0, 10))
      );

      let previstas = 0;
      let realizadasCount = 0;
      let canceladasCount = 0;

      for (const d of datasPrevistas) {
        if (realizadas.has(d)) {
          realizadasCount++;
        } else if (canceladas.has(d)) {
          canceladasCount++;
        } else {
          previstas++;
        }
      }

      resultado.push({
        nome_cliente: cliente.nome_cliente,
        zona: zona?.nome_da_zona || "Indefinida",
        cor: zona?.cor || "cinza",
        coletasPrevistas: previstas,
        coletasRealizadas: realizadasCount,
        coletasCanceladas: canceladasCount,
      });
    }

    res.json(resultado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar coletas por cliente" });
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
    return res.status(400).json({ error: "Informe o período (startDate e endDate)." });
  }

  const dataInicio = new Date(`${startDate}T03:00:00Z`);
  const dataFim = new Date(`${endDate}T02:59:59Z`);
  const diffEmDias = (dataFim - dataInicio) / (1000 * 60 * 60 * 24);

  if (diffEmDias > 31) {
    return res.status(400).json({
      error: "O intervalo entre as datas não pode ultrapassar 31 dias.",
    });
  }

  try {
    let zonaId = null;
    if (nomeZona) {
      const zona = await prisma.zona.findFirst({
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
       status: { in: ["PENDENTE", "REALIZADO", "CANCELADO"] },
    });

    const clientes = await prisma.cliente.findMany({
      where: filtroAgendamento.cliente || {},
      select: {
        id_cliente: true,
        nome_cliente: true,
        endereco: {
          select: {
            zona: {
              select: {
                id: true,
                nome_da_zona: true,
                cor: true,
                dias: true,
              },
            },
          },
        },
      },
    });

    const agendamentos = await prisma.agendamento.findMany({
      where: {
        ...filtroAgendamento,
        id_cliente: {
          in: clientes.map((c) => c.id_cliente),
        },
      },
      select: {
        id_agendamento: true,
        id_cliente: true,
        dia_agendado: true,
        dia_realizado: true,
        status: true,
        cliente: {
          select: {
            id_cliente: true,
          },
        },
      },
    });

    const resultado = agruparPrevisoesPorCliente(clientes, agendamentos, dataInicio, dataFim);
    res.status(200).json(resultado);
  } catch (error) {
    console.error("Erro interno /coletas-previstas:", error);
    res.status(500).json({ error: "Erro ao buscar coletas previstas" });
  }
});

module.exports = router;

module.exports = router;
