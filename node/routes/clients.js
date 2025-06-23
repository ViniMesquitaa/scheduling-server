const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");

function gerarQRCodeUnico() {
  return "QR" + crypto.randomBytes(4).toString("hex").toUpperCase();
}

function validarDadosCliente(dados) {
  return (
    dados.nome_cliente &&
    dados.tipo &&
    dados.telefone_cliente &&
    dados.id_zona &&
    dados.endereco &&
    dados.endereco.nome_rua &&
    dados.endereco.bairro &&
    dados.endereco.numero
  );
}

async function verificarZonaExistente(id_zona, res) {
  const zona = await prisma.zona.findUnique({ where: { id: id_zona } });
  if (!zona) {
    res.status(400).json({ error: "Zona não encontrada com o id fornecido" });
    return false;
  }
  return true;
}

router.post("/", async (req, res) => {
  let { nome_cliente, tipo, telefone_cliente, id_zona, endereco, qr_code } =
    req.body;

  if (!qr_code) {
    qr_code = gerarQRCodeUnico();
  }

  if (!validarDadosCliente(req.body)) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    if (!(await verificarZonaExistente(id_zona, res))) return;

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
    console.error("Erro ao criar cliente:", error);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

router.get("/", async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        endereco: {
          include: { zona: true },
        },
      },
      orderBy: {
        id_cliente: "asc",
      },
    });
    res.status(200).json(clientes);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

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
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

router.get("/consulta-cliente-telefone/:telefone", async (req, res) => {
  const { telefone } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: {
        telefone_cliente: telefone,
      },
      include: {
        agendamentos: {
          where: {
            status: "PENDENTE",
          },
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
      id_cliente: cliente.id_cliente,
      tem_agendamento: temAgendamento,
      agendamentos: cliente.agendamentos,
    });
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
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

  if (!validarDadosCliente(req.body)) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  const qrCodeFinal = qr_code?.trim() ? qr_code : gerarQRCodeUnico();

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

    if (!(await verificarZonaExistente(id_zona, res))) return;

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
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

router.delete("/:telefone", async (req, res) => {
  const { telefone } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: {
        endereco: {
          include: {
            clientes: true,
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ error: "Cliente não encontrado" });
    }

    await prisma.cliente.delete({
      where: { id_cliente: cliente.id_cliente },
    });

    if (cliente.endereco.clientes.length === 1) {
      await prisma.endereco.delete({
        where: { id_endereco: cliente.endereco.id_endereco },
      });
    }

    res.status(200).json({ message: "Cliente deletado com sucesso" });
  } catch (error) {
    console.error("Erro ao deletar cliente:", error);
    if (error.code === "P2003") {
      return res.status(409).json({
        error: "Não é possível deletar - cliente possui registros associados",
      });
    }
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

module.exports = router;
