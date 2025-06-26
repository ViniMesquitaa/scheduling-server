const express = require("express");
const router = express.Router();
const { PrismaClient, StatusAgendamento } = require("@prisma/client");
const prisma = new PrismaClient();




function parseData(dataString) {
  if (!dataString) return undefined;

  if (dataString.includes("/")) {
    const [data, hora] = dataString.split(" ");
    const [dia, mes, ano] = data.split("/");

    if (!dia || !mes || !ano) return undefined;
    // Monta no formato ISO
    const isoString = hora ? `${ano}-${mes}-${dia}` : `${ano}-${mes}-${dia}`;

    const dataFinal = new Date(isoString);
    return isNaN(dataFinal.getTime()) ? undefined : dataFinal;
  }

  const d = new Date(dataString);
  console.log("Data recebida:", dataString, "-> Data convertida:", d);
  return isNaN(d.getTime()) ? undefined : d;
}

router.post("/", async (req, res) => {
  const { dia_agendado, turno_agendado, observacoes, id_cliente, id_usuario } =
    req.body;

  if (!dia_agendado || !turno_agendado || !id_cliente || !id_usuario) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios não preenchidos" });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: Number(id_cliente) },
      include: {
        endereco: {
          include: { zona: true }, // já incluir zona para conferir direto aqui
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    if (!cliente.endereco || !cliente.endereco.id_zona) {
      return res.status(400).json({ error: "Zona do cliente não encontrada" });
    }

    // Debug para garantir id_zona está vindo
    console.log("Zona do cliente:", cliente.endereco.zona);

    const agendamento = await prisma.agendamento.create({
      data: {
        dia_agendado: new Date(dia_agendado),
        turno_agendado,
        observacoes: observacoes || null,
        id_cliente: Number(id_cliente),
        id_usuario: Number(id_usuario),
        id_zona: cliente.endereco.id_zona, // usar id_zona do cliente,
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true },
            },
          },
        },
        zona: true, // incluir zona direto no agendamento para facilitar acesso
      },
    });

    res.status(201).json(formatAgendamento(agendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  }
});

//Criação de agendamento através do telefone do cliente(Chatbot)
router.post("/telefone", async (req, res) => {
  const {
    telefone_cliente,
    dia_agendado,
    turno_agendado,
    id_usuario,
    observacoes,
  } = req.body;

  if (!dia_agendado || !turno_agendado || !telefone_cliente || !id_usuario) {
    return res
      .status(400)
      .json({ error: "Campos obrigatórios não preenchidos" });
  }

  let dataConvertida;

  try {
    if (dia_agendado.includes("/")) {
      const partes = dia_agendado.split("/");
      if (partes.length !== 3) {
        return res.status(400).json({ error: "Formato de data inválido" });
      }
      const [dia, mes, ano] = partes;
      // monta string ISO yyyy-mm-ddT00:00:00
      dataConvertida = new Date(`${ano}-${mes}-${dia}T00:00:00`);
    } else {
      dataConvertida = new Date(
        dia_agendado.includes("T") ? dia_agendado : `${dia_agendado}T00:00:00`
      );
    }

    if (isNaN(dataConvertida.getTime())) {
      return res.status(400).json({ error: "Data inválida" });
    }

    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    if (dataConvertida < hoje) {
      return res
        .status(400)
        .json({ error: "A data agendada não pode ser no passado." });
    }

    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente },
      include: {
        endereco: {
          include: { zona: true },
        },
      },
    });

    if (!cliente) {
      return res
        .status(404)
        .json({ error: "Cliente não encontrado com esse telefone." });
    }

    if (!cliente.endereco || !cliente.endereco.id_zona) {
      return res.status(400).json({ error: "Zona do cliente não encontrada" });
    }

    const agendamento = await prisma.agendamento.create({
      data: {
        dia_agendado: dataConvertida,
        turno_agendado,
        observacoes: observacoes || null,
        id_cliente: cliente.id_cliente,
        id_usuario: Number(id_usuario),
        id_zona: cliente.endereco.id_zona,
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true },
            },
          },
        },
        zona: true,
      },
    });

    res.status(201).json(formatAgendamento(agendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno ao criar o agendamento." });
  }
});

router.get("/", async (req, res) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      orderBy: {
        id_agendamento: 'asc',
      },
      include: {
        cliente: {
          select: {
            nome_cliente: true,
            qr_code: true,
            telefone_cliente: true, 
            endereco: {
              include: {
                zona: true,
              },
            },
          },
        },
        usuario: {
          select: {
            nome: true,
          },
        },
      },
    });

    const resultadoFormatado = agendamentos.map((a) => ({
      id_agendamento: a.id_agendamento,
      nome_cliente: a.cliente.nome_cliente,
      qr_code: a.cliente?.qr_code || "QR Code não informado",
      telefone_cliente: a.cliente.telefone_cliente,
      zona: a.cliente.endereco?.zona?.nome_da_zona || "Zona não informada",
      data_agendada: a.dia_agendado,
      turno: a.turno_agendado,
      responsavel: a.usuario?.nome || "Responsável não informado",
      observacoes: a.observacoes || "",
      status: a.status || "PENDENTE",
    }));

    res.json(resultadoFormatado);
  } catch (error) {
    console.error("Erro ao buscar agendamentos:", error);
    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
});


router.get("/pendentes", async (req, res) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        OR: [{ dia_realizado: null }, { horario_realizado: null }],
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true },
            },
          },
        },
        zona: true,
        usuario: true,
      },
    });

    res.status(200).json(agendamentos.map(formatAgendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos pendentes" });
  }
});
router.put("/registro", async (req, res) => {
  const { qr_code, dia_realizado, hora_realizado, id_usuario } = req.body;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { qr_code },
      include: {
        agendamentos: {
          where: { status: StatusAgendamento.PENDENTE },
          orderBy: { dia_agendado: "asc" },
          take: 1,
        },
      },
    });

    if (!cliente) {
      return res
        .status(404)
        .json({ error: "Cliente não encontrado com esse QR Code." });
    }

    if (!cliente.agendamentos || cliente.agendamentos.length === 0) {
      return res.status(404).json({
        error: "Nenhum agendamento pendente encontrado para este cliente.",
      });
    }

    const agendamentoParaAtualizar = cliente.agendamentos[0];

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id_agendamento: agendamentoParaAtualizar.id_agendamento },
      data: {
        dia_realizado: parseData(dia_realizado),
        horario_realizado: hora_realizado || undefined,
        status: StatusAgendamento.REALIZADO,
        id_usuario: id_usuario, 
      },
      include: {
        cliente: {
          select: { nome_cliente: true },
        },
        zona: true,
        usuario: { select: { nome: true } }, // incluir usuário responsável no retorno
      },
    });

    res.status(200).json(formatAgendamento(agendamentoAtualizado));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar o agendamento." });
  }
});

//Atualização de agendamento através do telefone do cliente(Chatbot)
router.put("/telefone/:telefone_cliente", async (req, res) => {
  const { telefone_cliente } = req.params;
  data = req.body;
  data.dia_agendado = parseData(data.dia_agendado);
  const {
    dia_agendado,
    turno_agendado,
    observacoes,
    dia_realizado,
    horario_realizado,
  } = data;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente },
      include: {
        endereco: {
          include: { zona: true },
        },
        agendamentos: true,
      },
    });

    if (!cliente) {
      return res
        .status(404)
        .json({ error: "Cliente não encontrado com esse telefone." });
    }

    const agendamento = cliente.agendamentos[0];
    if (!agendamento) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agendamentoExistente = await prisma.agendamento.findUnique({
      where: { id_agendamento: agendamento.id_agendamento },
    });

    if (!agendamentoExistente) {
      return res.status(404).json({ error: "Agendamento não encontrado." });
    }

    const agendamentoAtualizado = await prisma.agendamento.update({
      where: { id_agendamento: agendamentoExistente.id_agendamento },
      data: {
        dia_agendado: dia_agendado ? new Date(dia_agendado) : undefined,
        turno_agendado,
        observacoes,
        id_zona: cliente.endereco.zona.id,
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true },
            },
          },
        },
        zona: true,
      },
    });

    res.status(200).json(formatAgendamento(agendamentoAtualizado));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar o agendamento." });
  }
});

// Cancelar agendamento
router.delete("/telefone/:telefone_cliente", async (req, res) => {
  const { telefone_cliente } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente },
      include: {
        agendamentos: {
          orderBy: {
            id_agendamento: "asc",
          },
        },
      },
    });

    if (!cliente) {
      return res
        .status(404)
        .json({ error: "Cliente não encontrado com esse telefone." });
    }

    const agendamento = cliente.agendamentos.find(
      (a) => a.status === "PENDENTE"
    );

    if (!agendamento) {
      return res.status(404).json({ error: "Nenhum agendamento PENDENTE encontrado para esse cliente." });
    }

    await prisma.agendamento.update({
      where: { id_agendamento: agendamento.id_agendamento },
      data: {
        status: "CANCELADO",
      },
    });

    res.status(200).json({ message: "Agendamento cancelado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao cancelar agendamento" });
  }
});

const formatAgendamento = (a) => ({
  id_agendamento: a.id_agendamento,
  nome_cliente: a.cliente?.nome_cliente || "Cliente não informado",
  zona:
    a.cliente?.endereco?.zona?.nome_da_zona ||
    a.zona?.nome_da_zona ||
    "Zona não definida",
  data_agendada: a.dia_agendado,
  turno: a.turno_agendado,
  responsavel: a.usuario?.nome || "Responsável não informado",
  observacoes: a.observacoes || "",
  status: a.status || "PENDENTE",
});

module.exports = router;
