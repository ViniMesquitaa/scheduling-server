const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

// Função para gerar QR code único
function gerarQRCodeUnico() {
  return "QR" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

router.post("/", async (req, res) => {
  let { nome_cliente, tipo, telefone_cliente, id_zona, endereco, qr_code } =
    req.body;

  // Gera QR code se não foi enviado
  if (!qr_code) {
    qr_code = gerarQRCodeUnico();
  }

  // Validação
  if (
    !nome_cliente ||
    !tipo ||
    !telefone_cliente ||
    !id_zona ||
    !endereco ||
    !endereco.nome_rua ||
    !endereco.bairro ||
    !endereco.numero
  ) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    const zona = await prisma.zona.findUnique({ where: { id: id_zona } });
    if (!zona) {
      return res
        .status(400)
        .json({ error: "Zona não encontrada com o id fornecido" });
    }

    const clienteExistente = await prisma.cliente.findUnique({
      where: { telefone_cliente },
    });

    if (clienteExistente) {
      return res.status(409).json({ error: "Telefone já cadastrado" });
    }

    const clienteExistenteComQR = await prisma.cliente.findUnique({
      where: { qr_code },
    });
    if (clienteExistenteComQR) {
      return res.status(409).json({ error: "QR Code já cadastrado" });
    }

    const enderecoCriado = await prisma.endereco.create({
      data: {
        nome_rua: endereco.nome_rua,
        numero: endereco.numero,
        bairro: endereco.bairro,
        zona: { connect: { id: id_zona } },
      },
    });

    const cliente = await prisma.cliente.create({
      data: {
        nome_cliente,
        tipo,
        telefone_cliente,
        qr_code,
        endereco: { connect: { id_endereco: enderecoCriado.id_endereco } },
      },
      include: {
        endereco: { include: { zona: true } },
      },
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

// Listar todos os clientes com endereço e zona
router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        endereco: {
          include: { zona: true },
        },
      },
    });
    res.status(200).json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Buscar cliente por telefone
router.get("/:telefone", async (req, res) => {
  const { telefone } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: {
        endereco: { include: { zona: true } },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

//Consultar cliente através do telefone
router.get("/consulta-cliente-telefone/:telefone", async (req, res) => {
  const { telefone } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        telefone_cliente: telefone,
      },
      include: {
        agendamentos: {
          select: {
            dia_agendado: true,
            turno_agendado: true,
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    const temAgendamento = cliente.agendamentos.length > 0;

    res.status(200).json({
      nome_cliente: cliente.nome_cliente,
      tem_agendamento: temAgendamento,
      agendamentos: temAgendamento ? cliente.agendamentos : [],
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar o cliente" });
  }
});

router.put("/:telefone", async (req, res) => {
  const { telefone } = req.params;
  const {
    nome_cliente,
    tipo,
    telefone_cliente: novoTelefone,
    endereco,
    id_zona,
    qr_code,
  } = req.body;

  if (
    !nome_cliente ||
    !tipo ||
    !novoTelefone ||
    !endereco ||
    !endereco.nome_rua ||
    !endereco.bairro ||
    !endereco.numero ||
    !id_zona
  ) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const generateQRCodeIfEmpty = (qr) => {
   if (!qr || qr.trim() === "") {
    return gerarQRCodeUnico();
  }
  return qr;
  };

  const qrCodeFinal = generateQRCodeIfEmpty(qr_code);

  try {
    const clienteExistente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: { endereco: true },
    });

    if (!clienteExistente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    if (telefone !== novoTelefone) {
      const telefoneDuplicado = await prisma.cliente.findUnique({
        where: { telefone_cliente: novoTelefone },
      });
      if (telefoneDuplicado) {
        return res.status(409).json({ error: "Novo telefone já está em uso" });
      }
    }

    const zona = await prisma.zona.findUnique({ where: { id: id_zona } });
    if (!zona) {
      return res
        .status(400)
        .json({ error: "Zona não encontrada com o id fornecido" });
    }

    await prisma.endereco.update({
      where: { id_endereco: clienteExistente.endereco.id_endereco },
      data: {
        nome_rua: endereco.nome_rua,
        bairro: endereco.bairro,
        numero: endereco.numero,
        id_zona,
      },
    });

    const clienteAtualizado = await prisma.cliente.update({
      where: { id_cliente: clienteExistente.id_cliente },
      data: {
        nome_cliente,
        tipo,
        telefone_cliente: novoTelefone,
        qr_code: qrCodeFinal,
      },
      include: {
        endereco: { include: { zona: true } },
      },
    });

    res.status(200).json(clienteAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

// Deletar cliente por telefone
router.delete("/:telefone", async (req, res) => {
  const { telefone } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: { endereco: true },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    await prisma.cliente.delete({
      where: { id_cliente: cliente.id_cliente },
    });

    res
      .status(200)
      .json({ message: "Cliente e endereço deletados com sucesso" });
  } catch (error) {
    console.error(error);
    if (error.code === "P2003") {
      return res
        .status(409)
        .json({ error: "Registro em uso por outro recurso" });
    }
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

module.exports = router;
