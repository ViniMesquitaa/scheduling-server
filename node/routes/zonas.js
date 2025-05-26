const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const diasValidos = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

function validarDias(dias) {
  if (!Array.isArray(dias)) return false;
  return dias.every(dia => diasValidos.includes(dia));
}

// Criar nova zona (POST)
router.post('/', async (req, res) => {
  const { nome_da_zona, qtd_coletas_esperadas, dias, cor } = req.body;

  // Validação dos campos obrigatórios
  if (!nome_da_zona || qtd_coletas_esperadas === undefined || !dias || !cor) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  // Validação do tipo numérico
  if (typeof qtd_coletas_esperadas !== 'number' || qtd_coletas_esperadas < 0) {
    return res.status(400).json({ error: 'qtd_coletas_esperadas deve ser um número positivo' });
  }

  // Validação dos dias
  if (!validarDias(dias)) {
    return res.status(400).json({ error: `Dias inválidos. Permitidos: ${diasValidos.join(', ')}` });
  }

  try {
    // Verifica se a zona já existe
    const existing = await prisma.zona.findUnique({
      where: { nome_da_zona }
    });

    if (existing) {
      return res.status(409).json({ error: 'Zona já existente' });
    }

    // Cria a nova zona
    const novaZona = await prisma.zona.create({
      data: {
        nome_da_zona,
        qtd_coletas_esperadas,
        dias,
        cor
      }
    });

    res.status(201).json(novaZona);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar zona' });
  }
});

// Listar todas as zonas (GET)
router.get('/', async (req, res) => {
  try {
    const zonas = await prisma.zona.findMany();
    res.status(200).json(zonas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar zonas' });
  }
});

// Buscar zona por ID (GET)
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }

  try {
    const zona = await prisma.zona.findUnique({
      where: { id_zona: id }
    });

    if (!zona) {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }

    res.status(200).json(zona);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar zona' });
  }
});

// Atualizar zona (PUT)
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nome_da_zona, qtd_coletas_esperadas, dias, cor } = req.body;

  if (!nome_da_zona || qtd_coletas_esperadas === undefined || !dias || !cor) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  try {
    const zona = await prisma.zona.update({
      where: { id_zona: id },
      data: {
        nome_da_zona,
        qtd_coletas_esperadas,
        dias,
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

// Deletar zona (DELETE)
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);

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