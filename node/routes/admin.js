const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


router.post('/login', async (req, res) => {
  const { email, senha } = req.body;

  try {
    const admin = await prisma.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    const senhaValida = await bcrypt.compare(senha, admin.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Email ou senha inválidos' });
    }

    if (admin.precisa_redefinir) {
      return res.status(200).json({
        message: 'Primeiro login detectado. Redefinição de senha e email necessária.',
        redefinir: true,
        id_admin: admin.id_admin
      });
    }

    const token = jwt.sign(
      { id: admin.id_admin, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({ message: 'Login bem-sucedido', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

router.post('/redefinir', async (req, res) => {
  const { id_admin, nome, email, senha } = req.body;

  if (!id_admin ||!nome || !email || !senha) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const admin = await prisma.admin.findUnique({
      where: { id_admin: Number(id_admin) },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    await prisma.admin.update({
      where: { id_admin: Number(id_admin) },
      data: {
        nome,
        email,
        senha: senhaHash,
        precisa_redefinir: false,
      },
    });

    res.status(200).json({ message: 'Redefinição feita com sucesso.' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno ao redefinir credenciais.' });
  }
});

router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await prisma.admin.findUnique({
      where: { id_admin: decoded.id },
      select: {
        id_admin: true,
        nome: true,
        email: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }

    res.status(200).json(admin);
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
});

router.put('/:id', async (req, res) => {
  const { nome, email } = req.body;
  const id_admin = parseInt(req.params.id);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.id !== id_admin) {
      return res.status(403).json({ error: 'Você não tem permissão para editar este usuário.' });
    }

    const admin = await prisma.admin.findUnique({ where: { id_admin } });

    if (!admin) {
      return res.status(404).json({ error: 'Administrador não encontrado.' });
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id_admin },
      data: { nome, email },
    });

    res.status(200).json({ message: 'Administrador atualizado com sucesso.', admin: updatedAdmin });
  } catch (error) {
    console.error(error);
    res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
});



module.exports = router;
