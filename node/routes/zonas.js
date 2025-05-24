const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Criar nova zona
router.post('/', async (req, res) => {
  const { nome_zona, qtd_coletas_esperadas, dias_coleta, cor } = req.body;

  if (!nome_zona || !qtd_coletas_esperadas || !dias_coleta || !cor) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const existing = await prisma.zona.findUnique({
      where: { nome_zona }
    });

    if (existing) {
      return res.status(409).json({ error: 'Zona já existente' });
    }

    const novaZona = await prisma.zona.create({
      data: {
        nome_zona,
        qtd_coletas_esperadas,
        dias_coleta,
        cor
      }
    });

    res.status(201).json(novaZona);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar zona' });
  }
});

// Listar todas as zonas
router.get('/', async (req, res) => {
  try {
    const zonas = await prisma.zona.findMany();
    res.status(200).json(zonas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar zonas' });
  }
});

// Buscar zona por ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const zona = await prisma.zona.findUnique({
      where: { id_zona: id }
    });

    if (!zona) {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }

    res.status(200).json(zona);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar zona' });
  }
});

// Atualizar zona
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome_zona, qtd_coletas_esperadas, dias_coleta, cor } = req.body;

  if (!nome_zona || !qtd_coletas_esperadas || !dias_coleta || !cor) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const zona = await prisma.zona.update({
      where: { id_zona: id },
      data: {
        nome_zona,
        qtd_coletas_esperadas,
        dias_coleta,
        cor
      }
    });

    res.status(200).json(zona);
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao atualizar zona' });
  }
});

// Deletar zona
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.zona.delete({
      where: { id_zona: id }
    });

    res.status(200).json({ message: 'Zona deletada com sucesso' });
  } catch (err) {
    console.error(err);
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }
    res.status(500).json({ error: 'Erro ao deletar zona' });
  }
});

module.exports = router;
