const express = require('express');
const app = express();
const coletasRoutes = require('./routes/coletas');

app.use(express.json());

// Rotas
app.use('/coletas', coletasRoutes);

app.listen(8000, () => {
  console.log("API rodando em http://localhost:8000");
});
