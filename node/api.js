const express = require('express');
const app = express();

app.use(express.json());

let coletas = [];
let nextId = 1;

// Rotas da API
app.get('/coletas', (req, res) => {
  if (coletas.length > 0) {
    res.status(200).json(coletas);
  } else {
    res.status(404).json({ message: "Coletas não encontradas" });
  }
});

app.get('/coletas/:id', (req, res) => {
  const coleta = coletas.find(c => c.id === parseInt(req.params.id));
  if (coleta) {
    res.status(200).json(coleta);
  } else {
    res.status(404).json({ message: "Coleta não encontrada" });
  }
});

app.post('/coletas', (req, res) => {
  const novaColeta = req.body;
  novaColeta.id = nextId++;
  coletas.push(novaColeta);
  res.status(201).json(novaColeta);
});

app.put('/coletas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const coleta = coletas.find(c => c.id === id);
  if (coleta) {
    Object.assign(coleta, req.body);
    res.status(200).json(coleta);
  } else {
    res.status(404).json({ message: "Coleta não encontrada" });
  }
});

app.delete('/coletas/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = coletas.findIndex(c => c.id === id);
  if (index !== -1) {
    const removida = coletas.splice(index, 1)[0];
    res.status(200).json(removida);
  } else {
    res.status(404).json({ message: "Coleta não deletada" });
  }
});

app.listen(8000, () => {
  console.log("API rodando em http://localhost:8000");
});
