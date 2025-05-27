const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar agendamento
router.post('/', async (req, res) => {
  const { dia_agendado, turno_agendado, observacoes, id_cliente, id_usuario } = req.body;

  if (!dia_agendado || !turno_agendado || !id_cliente || !id_usuario) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id_cliente: Number(id_cliente) },
      include: {
        endereco: {
          include: { zona: true } // já incluir zona para conferir direto aqui
        }
      }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente não encontrado' });
    }

    if (!cliente.endereco || !cliente.endereco.id_zona) {
      return res.status(400).json({ error: 'Zona do cliente não encontrada' });
    }

    // Debug para garantir id_zona está vindo
    console.log('Zona do cliente:', cliente.endereco.zona);

    const agendamento = await prisma.agendamento.create({
      data: {
        dia_agendado: new Date(dia_agendado),
        turno_agendado,
        observacoes: observacoes || null,
        id_cliente: Number(id_cliente),
        id_usuario: Number(id_usuario),
        id_zona: cliente.endereco.id_zona // usar id_zona do cliente,
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true }
            }
          }
        },
        zona: true // incluir zona direto no agendamento para facilitar acesso
      },
    });

    res.status(201).json(formatAgendamento(agendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// Listar todos os agendamentos
router.get('/', async (req, res) => {
  try {
   const agendamentos = await prisma.agendamento.findMany({
  include: {
    zona: true, // traz a zona relacionada pelo id_zona
    cliente: {
      include: {
        endereco: {
          include: { zona: true } // essa zona é do endereço do cliente
        }
      }
    }
  }
});


    res.status(200).json(agendamentos.map(formatAgendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// Buscar agendamentos pendentes
router.get('/pendentes', async (req, res) => {
  try {
    const agendamentos = await prisma.agendamento.findMany({
      where: {
        OR: [
          { dia_realizado: null },
          { horario_realizado: null }
        ]
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true }
            }
          }
        },
        zona: true
      }
    });

    res.status(200).json(agendamentos.map(formatAgendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar agendamentos pendentes' });
  }
});



// Atualizar agendamento
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { dia_agendado, turno_agendado, observacoes, dia_realizado, horario_realizado } = req.body;

  try {
    const agendamento = await prisma.agendamento.update({
      where: { id_agendamento: parseInt(id) },
      data: {
        dia_agendado: dia_agendado ? new Date(dia_agendado) : undefined,
        turno_agendado,
        observacoes,
        dia_realizado: dia_realizado ? new Date(dia_realizado) : undefined,
        horario_realizado: horario_realizado ? new Date(horario_realizado) : undefined
      },
      include: {
        cliente: {
          include: {
            endereco: {
              include: { zona: true }
            }
          }
        },
        zona: true
      }
    });

    res.status(200).json(formatAgendamento(agendamento));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// Deletar agendamento
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.agendamento.delete({
      where: { id_agendamento: parseInt(id) }
    });

    res.status(200).json({ message: 'Agendamento deletado com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

// Formatar resposta
function formatAgendamento(a) {
  return {
    id_agendamento: a.id_agendamento,
    nome_cliente: a.cliente?.nome_cliente || null,
    zona: a.zona?.nome_da_zona || null, // zona pega direto da relação agendamento -> zona
    data_coleta: a.dia_agendado,
    turno: a.turno_agendado,
    observacoes: a.observacoes,
  };
}

module.exports = router;
