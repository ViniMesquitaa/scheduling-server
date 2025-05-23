const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const bcrypt = require('bcrypt');

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    res.status(200).json({ message: 'Login bem-sucedido', usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});



// Criar usuário
const SALT_ROUNDS = 10;

router.post('/register', async (req, res) => {
  const {nome, email, senha, tipo_usuario } = req.body;

  try {
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const senhaHash = await bcrypt.hash(senha, SALT_ROUNDS);

    const novoUsuario = await prisma.usuario.create({
      data: {nome, email, senha: senhaHash, tipo_usuario },
    });

    res.status(201).json({ message: 'Usuário criado com sucesso', usuario: novoUsuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});


// Listar todos os usuários
router.get('/', async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.status(200).json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// Buscar usuário por ID
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id_usuario: id }
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.status(200).json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Atualizar usuário por ID
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const { nome, email, senha, tipo_usuario } = req.body;

  try {
    const usuarioAtualizado = await prisma.usuario.update({
      where: { id_usuario: id },
      data: { nome, email, senha, tipo_usuario }
    });
    res.status(200).json(usuarioAtualizado);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário por ID
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    await prisma.usuario.delete({ where: { id_usuario: id } });
    res.status(200).json({ message: 'Usuário deletado com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

module.exports = router;
