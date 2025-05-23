const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar agendamento
// Criar agendamento com zona
router.post('/', async (req, res) => {
  const {
    dia_agendado,
    turno_agendado,
    observacoes,
    id_cliente,
    id_usuario,
    id_zona
  } = req.body;

  if (!dia_agendado || !turno_agendado || !id_cliente || !id_usuario || !id_zona) {
    return res.status(400).json({ error: 'Campos obrigatórios não preenchidos' });
  }

  try {
    const agendamento = await prisma.agendamento.create({
      data: {
        dia_agendado: new Date(dia_agendado),
        turno_agendado,
        observacoes,
        id_cliente,
        id_usuario,
        id_zona
      },
      include: {
        cliente: true,
        zona: true
      }
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
        cliente: {
          include: {
            endereco: {
              include: { zona: true }
            }
          }
        }
      }
    });

    res.status(200).json(agendamentos.map(formatAgendamento));
  } catch (err) {
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
        }
      }
    });

    res.status(200).json(agendamentos.map(formatAgendamento));
  } catch (err) {
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
        }
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
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

// 🔁 Função para formatar a resposta
function formatAgendamento(a) {
  return {
    id_agendamento: a.id_agendamento,
    nome_cliente: a.cliente.nome_cliente,
    zona: a.zona?.nome_zona,
    data_coleta: a.dia_agendado,
    turno: a.turno_agendado,
    observacoes: a.observacoes
  };
}


module.exports = router;
