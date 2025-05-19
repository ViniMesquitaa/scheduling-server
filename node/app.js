const express = require('express');
const app = express();
const coletasRoutes = require('./routes/coletas');
const clients = require('./routes/clients')

app.use(express.json());

app.use('/coletas', coletasRoutes);
app.use('/clientes', clients)

app.listen(8000, () => {
  console.log("API rodando em http://localhost:8000");
});
