const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Função para gerar QR code único
function gerarQRCodeUnico() {
  return 'QR' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Criar cliente com endereço e zona associada ao endereço
router.post('/', async (req, res) => {
  const { nome_cliente, telefone_cliente, id_zona, endereco } = req.body;

  if (
    !nome_cliente ||
    !telefone_cliente ||
    !id_zona ||
    !endereco ||
    !endereco.nome_rua ||
    !endereco.bairro ||
    !endereco.numero
  ) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    // Verifica se a zona existe
    const zona = await prisma.zona.findUnique({ where: { id: id_zona } });
    if (!zona) {
      return res.status(400).json({ error: 'Zona não encontrada com o id fornecido' });
    }

    // Verifica duplicidade de telefone
    const clienteExistente = await prisma.cliente.findUnique({
      where: { telefone_cliente },
    });

    if (clienteExistente) {
      return res.status(409).json({ error: 'Telefone já cadastrado' });
    }

    const qr_code = gerarQRCodeUnico();

    // Cria o endereço com zona associada
    const enderecoCriado = await prisma.endereco.create({
      data: {
        nome_rua: endereco.nome_rua,
        numero: endereco.numero,
        bairro: endereco.bairro,
        zona: { connect: { id: id_zona } }
      }
    });

    // Cria o cliente com o endereço criado
    const cliente = await prisma.cliente.create({
      data: {
        nome_cliente,
        telefone_cliente,
        qr_code,
        endereco: { connect: { id_endereco: enderecoCriado.id_endereco } }
      },
      include: {
        endereco: { include: { zona: true } }
      }
    });

    res.status(201).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

// Listar todos os clientes com endereço e zona
router.get('/', async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: {
        endereco: {
          include: { zona: true }
        }
      }
    });
    res.status(200).json(clientes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

// Buscar cliente por telefone
router.get('/:telefone', async (req, res) => {
  const { telefone } = req.params;
  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: {
        endereco: { include: { zona: true } }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    res.status(200).json(cliente);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar cliente' });
  }
});

router.get('/consulta-cliente-telefone/:telefone', async (req, res) => {
  const { telefone } = req.params;
  try {
   const cliente = await prisma.cliente.findUnique({
      where: {
        telefone_cliente: telefone
      },
      include: {
        agendamentos: {
          select: {
            data_agendamento: true,
            turno_agendamento: true
          }
        }
      }
    });

    if(!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado'});
    }

    const temAgendamento = cliente.agendamentos.length > 0;

    res.status(200).json({
      nome_cliente: cliente.nome_cliente,
      tem_agendamento: temAgendamento,
      agendamentos: temAgendamento ? cliente.agendamentos : []
    });
  } catch ( error) {
    res.status(500).json({ error: 'Erro ao buscar o cliente'})
  }
});

// Atualizar cliente e endereço por telefone
router.put('/:telefone', async (req, res) => {
  const { telefone } = req.params;
  const { nome_cliente, telefone_cliente: novoTelefone, endereco, id_zona } = req.body;

  if (
    !nome_cliente ||
    !novoTelefone ||
    !endereco ||
    !endereco.nome_rua ||
    !endereco.bairro ||
    !endereco.numero ||
    !id_zona
  ) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const clienteExistente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: { endereco: true }
    });

    if (!clienteExistente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Verifica duplicidade de telefone, se for alterado
    if (telefone !== novoTelefone) {
      const telefoneDuplicado = await prisma.cliente.findUnique({
        where: { telefone_cliente: novoTelefone },
      });
      if (telefoneDuplicado) {
        return res.status(409).json({ error: 'Novo telefone já está em uso' });
      }
    }

    // Verifica se zona existe
    const zona = await prisma.zona.findUnique({ where: { id: id_zona } });
    if (!zona) {
      return res.status(400).json({ error: 'Zona não encontrada com o id fornecido' });
    }

    // Atualiza endereço e zona
    await prisma.endereco.update({
      where: { id_endereco: clienteExistente.id_endereco },
      data: {
        nome_rua: endereco.nome_rua,
        bairro: endereco.bairro,
        numero: endereco.numero,
        id_zona
      }
    });

    // Atualiza cliente
    const clienteAtualizado = await prisma.cliente.update({
      where: { id_cliente: clienteExistente.id_cliente },
      data: {
        nome_cliente,
        telefone_cliente: novoTelefone
      },
      include: {
        endereco: { include: { zona: true } }
      }
    });

    res.status(200).json(clienteAtualizado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

// Deletar cliente por telefone
router.delete('/:telefone', async (req, res) => {
  const { telefone } = req.params;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { telefone_cliente: telefone },
      include: { endereco: true },
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    // Deleta cliente (endereço com onDelete: Cascade será excluído)
    await prisma.cliente.delete({
      where: { id_cliente: cliente.id_cliente }
    });

    res.status(200).json({ message: 'Cliente e endereço deletados com sucesso' });
  } catch (error) {
    console.error(error);
    if (error.code === 'P2003') {
      return res.status(409).json({ error: 'Registro em uso por outro recurso' });
    }
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

module.exports = router;
