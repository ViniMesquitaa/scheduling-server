const express = require('express');
const router = express.Router();
const pool = require('../db');

// Criar nova zona
router.post('/', async (req, res) => {
  const { nome_zona } = req.body;

  if (!nome_zona) {
    return res.status(400).json({ error: 'O nome da zona é obrigatório' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT * FROM zonas WHERE nome_zona = ?',
      [nome_zona]
    );

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Zona já existente' });
    }

    const [result] = await pool.query(
      'INSERT INTO zonas (nome_zona) VALUES (?)',
      [nome_zona]
    );

    const [novaZona] = await pool.query(
      'SELECT * FROM zonas WHERE id_zona = ?',
      [result.insertId]
    );

    res.status(201).json(novaZona[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar zona' });
  }
});

// Listar todas as zonas
router.get('/', async (req, res) => {
  try {
    const [zonas] = await pool.query('SELECT * FROM zonas');
    res.status(200).json(zonas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar zonas' });
  }
});

// Buscar zona por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [zona] = await pool.query(
      'SELECT * FROM zonas WHERE id_zona = ?',
      [id]
    );

    if (zona.length === 0) {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }

    res.status(200).json(zona[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar zona' });
  }
});

// Atualizar zona
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome_zona } = req.body;

  if (!nome_zona) {
    return res.status(400).json({ error: 'Nome da zona é obrigatório' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE zonas SET nome_zona = ? WHERE id_zona = ?',
      [nome_zona, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }

    const [zonaAtualizada] = await pool.query(
      'SELECT * FROM zonas WHERE id_zona = ?',
      [id]
    );

    res.status(200).json(zonaAtualizada[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar zona' });
  }
});

// Deletar zona
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query(
      'DELETE FROM zonas WHERE id_zona = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Zona não encontrada' });
    }

    res.status(200).json({ message: 'Zona deletada com sucesso' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao deletar zona' });
  }
});

module.exports = router;
