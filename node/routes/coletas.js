const express = require('express');
const router = express.Router();

let coletas = []; 
let nextId = 1;

// GET /coletas - Listar todas as coletas
router.get('/', (req, res) => {
  if (coletas.length > 0) {
    res.status(200).json(coletas);
  } else {
    res.status(404).json({ message: "Coletas não encontradas" });
  }
});

// GET /coletas/{id} - Obter uma coleta pelo ID
router.get('/:id', (req, res) => {
  const coleta = coletas.find(c => c.id === parseInt(req.params.id));
  if (coleta) {
    res.status(200).json(coleta);
  } else {
    res.status(404).json({ message: "Coleta não encontrada" });
  }
});

// POST /coletas - Criar uma nova coleta
router.post('/', (req, res) => {
  const novaColeta = req.body;
  novaColeta.id = nextId++;
  coletas.push(novaColeta);
  res.status(201).json(novaColeta);
});

// PUT /coletas/{id} - Atualizar uma coleta
router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const coleta = coletas.find(c => c.id === id);
  if (coleta) {
    Object.assign(coleta, req.body);
    res.status(200).json(coleta);
  } else {
    res.status(404).json({ message: "Coleta não encontrada" });
  }
});

// DELETE /coletas/{id} - Deletar uma coleta
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = coletas.findIndex(c => c.id === id);
  if (index !== -1) {
    const removida = coletas.splice(index, 1)[0];
    res.status(200).json(removida);
  } else {
    res.status(404).json({ message: "Coleta não deletada" });
  }
});

module.exports = router;
