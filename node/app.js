const express = require('express');
const app = express();
const coletasRoutes = require('./routes/coletas');
const clients = require('./routes/clients')
const usuarios = require('./routes/usuarios')
const agendamento = require('./routes/agendamentos')
const zona = require('./routes/zonas')

app.use(express.json());

app.use('/coletas', coletasRoutes);
app.use('/clientes', clients)
app.use('/usuarios', usuarios)
app.use('/agendamentos', agendamento)
app.use('/zonas', zona)

app.listen(8000, () => {
  console.log("API rodando em http://localhost:8000");
});
