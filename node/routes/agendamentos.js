const express = require('express');
const router = express.Router();
const pool = require('../db');

// Criar agendamento
router.post('/', async (req, res) => {
  const { dia_agendado, turno_agendado, id_cliente, id_usuario, dia_realizado, horario_realizado } = req.body;

  if (!dia_agendado || !turno_agendado || !id_cliente || !id_usuario) {
    return res.status(400).json({ error: 'Todos os campos obrigatórios não foram preenchidos' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO agendamentos 
      (dia_agendado, turno_agendado, id_cliente, id_usuario, dia_realizado, horario_realizado) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [dia_agendado, turno_agendado, id_cliente, id_usuario, dia_realizado || null, horario_realizado || null]
    );

    const [agendamento] = await pool.query(
      'SELECT * FROM agendamentos WHERE id_agendamento = ?',
      [result.insertId]
    );

    res.status(201).json(agendamento[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar agendamento' });
  }
});

// Listar todos os agendamentos
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.*, c.nome_cliente, u.nome AS nome_usuario
       FROM agendamentos a
       LEFT JOIN clientes c ON a.id_cliente = c.id_cliente
       LEFT JOIN usuarios u ON a.id_usuario = u.id_usuario`
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar agendamentos' });
  }
});

// Atualizar agendamento
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { dia_agendado, turno_agendado, dia_realizado, horario_realizado } = req.body;

  try {
    const [result] = await pool.query(
      `UPDATE agendamentos 
       SET dia_agendado = ?, turno_agendado = ?, dia_realizado = ?, horario_realizado = ? 
       WHERE id_agendamento = ?`,
      [dia_agendado, turno_agendado, dia_realizado || null, horario_realizado || null, id]
    );

    if (result.affectedRows > 0) {
      const [rows] = await pool.query('SELECT * FROM agendamentos WHERE id_agendamento = ?', [id]);
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: 'Agendamento não encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar agendamento' });
  }
});

// Deletar agendamento
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM agendamentos WHERE id_agendamento = ?', [id]);

    if (result.affectedRows > 0) {
      res.status(200).json({ message: 'Agendamento deletado com sucesso' });
    } else {
      res.status(404).json({ message: 'Agendamento não encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar agendamento' });
  }
});

module.exports = router;
