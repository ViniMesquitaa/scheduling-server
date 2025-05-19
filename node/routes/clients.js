const express = require("express");
const router = express.Router();
const pool = require("../db");

// Criar cliente com endereço e zona (criar zona se não existir)
router.post("/", async (req, res) => {
  const {
    nome_cliente,
    telefone_cliente,
    qr_code,
    nome_rua,
    numero,
    nome_zona,
  } = req.body;

  if (
    !nome_cliente ||
    !telefone_cliente ||
    !qr_code ||
    !nome_rua ||
    !numero ||
    !nome_zona
  ) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios" });
  }

  try {
    //Verificar se a zona já existe
    const [zonas] = await pool.query(
      "SELECT id_zona FROM zonas WHERE nome_zona = ?",
      [nome_zona]
    );

    let id_zona;
    if (zonas.length > 0) {
      id_zona = zonas[0].id_zona;
    } else {
      //Criar nova zona
      const [zonaResult] = await pool.query(
        "INSERT INTO zonas (nome_zona) VALUES (?)",
        [nome_zona]
      );
      id_zona = zonaResult.insertId;
    }

    //Inserir endereço com id_zona
    const [enderecoResult] = await pool.query(
      "INSERT INTO enderecos (nome_rua, numero, id_zona) VALUES (?, ?, ?)",
      [nome_rua, numero, id_zona]
    );

    const id_endereco = enderecoResult.insertId;

    //Inserir cliente com id_endereco
    const [clienteResult] = await pool.query(
      "INSERT INTO clientes (qr_code, nome_cliente, telefone_cliente, qtd_coletas_realizadas, id_endereco) VALUES (?, ?, ?, 0, ?)",
      [qr_code, nome_cliente, telefone_cliente, id_endereco]
    );

    //Buscar cliente criado
    const [rows] = await pool.query(
      `SELECT c.*, e.nome_rua, e.numero, z.nome_zona
       FROM clientes c
       LEFT JOIN enderecos e ON c.id_endereco = e.id_endereco
       LEFT JOIN zonas z ON e.id_zona = z.id_zona
       WHERE c.id_cliente = ?`,
      [clienteResult.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Erro ao criar cliente" });
  }
});

//Listar todos os clientes
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, e.nome_rua, e.numero, e.id_zona
       FROM clientes c
       LEFT JOIN enderecos e ON c.id_endereco = e.id_endereco`
    );
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

//Buscar cliente por telefone
router.get("/:telefone", async (req, res) => {
  const telefone = req.params.telefone;
  try {
    const [rows] = await pool.query(
      `SELECT c.*, e.nome_rua, e.numero, e.id_zona
       FROM clientes c
       LEFT JOIN enderecos e ON c.id_endereco = e.id_endereco
       WHERE c.telefone_cliente = ?`,
      [telefone]
    );
    if (rows.length > 0) {
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: "Cliente não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar cliente" });
  }
});

//Atualizar cliente (nome, qr_code) pelo telefone
router.put("/:telefone", async (req, res) => {
  const telefone = req.params.telefone;
  const { nome_cliente, qr_code } = req.body;

  try {
    const [result] = await pool.query(
      "UPDATE clientes SET nome_cliente = ?, qr_code = ? WHERE telefone_cliente = ?",
      [nome_cliente, qr_code, telefone]
    );

    if (result.affectedRows > 0) {
      const [rows] = await pool.query(
        `SELECT c.*, e.nome_rua, e.numero, e.id_zona
         FROM clientes c
         LEFT JOIN enderecos e ON c.id_endereco = e.id_endereco
         WHERE c.telefone_cliente = ?`,
        [telefone]
      );
      res.status(200).json(rows[0]);
    } else {
      res.status(404).json({ message: "Cliente não encontrado" });
    }
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

//Deletar cliente e endereço relacionado pelo telefone
router.delete("/:telefone", async (req, res) => {
  const telefone = req.params.telefone;

  try {
    //Primeiro, buscar o cliente para pegar o id_endereco
    const [clienteRows] = await pool.query(
      "SELECT id_endereco FROM clientes WHERE telefone_cliente = ?",
      [telefone]
    );

    if (clienteRows.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado" });
    }

    const id_endereco = clienteRows[0].id_endereco;

    //Deletar cliente
    await pool.query("DELETE FROM clientes WHERE telefone_cliente = ?", [
      telefone,
    ]);

    //Deletar endereço associado, se existir
    if (id_endereco) {
      await pool.query("DELETE FROM enderecos WHERE id_endereco = ?", [
        id_endereco,
      ]);
    }

    res.status(200).json({ message: "Cliente e endereço foram deletados" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar cliente" });
  }
});

module.exports = router;
