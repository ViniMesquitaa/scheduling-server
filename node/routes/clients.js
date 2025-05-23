const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Gera QR code único (8 caracteres hex)
function gerarQRCodeUnico() {
  return 'QR' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Criar cliente com endereço embutido, gera QR code automaticamente
router.post('/', async (req, res) => {
  const { nome_cliente, telefone_cliente, email, endereco } = req.body;

  if (
    !nome_cliente ||
    !telefone_cliente ||
    !email ||
    !endereco ||
    !endereco.nome_rua ||
    !endereco.bairro ||
    !endereco.numero
  ) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    // Verificar se já existe cliente com mesmo telefone para evitar duplicação
    const clienteExistente = await prisma.cliente.findFirst({
      where: { telefone_cliente },
    });
    if (clienteExistente) {
      return res.status(409).json({ error: 'Telefone já cadastrado' });
    }

    const qr_code = gerarQRCodeUnico();

    const novoCliente = await prisma.cliente.create({
      data: {
        nome_cliente,
        telefone_cliente,
        email,
        qr_code,
        qtd_coletas_realizadas: 0,
        endereco: {
          create: {
            nome_rua: endereco.nome_rua,
            bairro: endereco.bairro,
            numero: endereco.numero,
          },
        },
      },
      include: { endereco: true },
    });

    res.status(201).json(novoCliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// Listar todos os clientes com endereço
router.get('/', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: { endereco: true },
    });
    res.status(200).json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// Buscar cliente por telefone com endereço
router.get('/:telefone', async (req, res) => {
  const { telefone } = req.params;
  try {
    const cliente = await prisma.cliente.findFirst({
      where: { telefone_cliente: telefone },
      include: { endereco: true },
    });
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

// Atualizar cliente e endereço por telefone
router.put('/:telefone', async (req, res) => {
  const { telefone } = req.params;
  const { nome_cliente, telefone_cliente: novoTelefone, email, endereco } = req.body;

  if (
    !nome_cliente ||
    !novoTelefone ||
    !email ||
    !endereco ||
    !endereco.nome_rua ||
    !endereco.bairro ||
    !endereco.numero
  ) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const clienteExistente = await prisma.cliente.findFirst({
      where: { telefone_cliente: telefone },
      include: { endereco: true },
    });

    if (!clienteExistente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Se o telefone foi alterado, verificar se o novo telefone já existe para outro cliente
    if (novoTelefone !== telefone) {
      const telefoneDuplicado = await prisma.cliente.findFirst({
        where: { telefone_cliente: novoTelefone },
      });
      if (telefoneDuplicado) {
        return res.status(409).json({ error: 'Novo telefone já cadastrado para outro cliente' });
      }
    }

    // Atualiza endereço relacionado
    await prisma.endereco.update({
      where: { id_endereco: clienteExistente.endereco.id_endereco },
      data: {
        nome_rua: endereco.nome_rua,
        bairro: endereco.bairro,
        numero: endereco.numero,
      },
    });

    // Atualiza cliente
    const clienteAtualizado = await prisma.cliente.update({
      where: { id_cliente: clienteExistente.id_cliente },
      data: {
        nome_cliente,
        telefone_cliente: novoTelefone,
        email,
      },
      include: { endereco: true },
    });

    res.status(200).json(clienteAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// Deletar cliente e endereço por telefone
// Deletar cliente e endereço por telefone
router.delete('/:telefone', async (req, res) => {
  const { telefone } = req.params;

  try {
    const cliente = await prisma.cliente.findFirst({
      where: { telefone_cliente: telefone },
      include: { endereco: true },
    });

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Deleta cliente primeiro (ele tem FK para o endereço)
    await prisma.cliente.delete({
      where: { id_cliente: cliente.id_cliente },
    });

    // Depois tenta deletar o endereço, se não estiver mais sendo usado
    await prisma.endereco.delete({
      where: { id_endereco: cliente.endereco.id_endereco },
    });

    res.status(200).json({ message: 'Cliente e endereço deletados com sucesso' });
  } catch (error) {
    console.error(error);

    // Caso o endereço ainda esteja sendo usado por outro cliente
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'Endereço ainda está em uso por outro registro' });
    }

    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});


module.exports = router;
