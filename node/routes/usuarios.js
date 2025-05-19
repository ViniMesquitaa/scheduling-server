const express = require('express');
const router = express.Router();
const pool = require('../db');

// Criar usuário
router.post('/', async (req, res) => {
  const { nome, email, senha, tipo_usuario } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO usuarios (nome, email, senha, tipo_usuario) VALUES (?, ?, ?, ?)',
      [nome, email, senha, tipo_usuario]
    );

    const [usuario] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [result.insertId]);
    res.status(201).json(usuario[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const [usuarios] = await pool.query('SELECT * FROM usuarios');
    res.status(200).json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [usuario] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
    if (usuario.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.status(200).json(usuario[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar usuário por ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, tipo_usuario } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE usuarios SET nome = ?, email = ?, senha = ?, tipo_usuario = ? WHERE id_usuario = ?',
      [nome, email, senha, tipo_usuario, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const [usuario] = await pool.query('SELECT * FROM usuarios WHERE id_usuario = ?', [id]);
    res.status(200).json(usuario[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário por ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM usuarios WHERE id_usuario = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
