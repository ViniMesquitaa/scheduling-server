require('dotenv').config()
const express = require('express');
const app = express();
const cors = require ( 'cors' ); 
const coletasRoutes = require('./routes/coletas');
const clients = require('./routes/clients')
const usuarios = require('./routes/usuarios')
const agendamento = require('./routes/agendamentos')
const zona = require('./routes/zonas')
const relatoriosRouter = require("./routes/relatorios");
const admin = require('./routes/admin');

const verifyApiToken = require('./auth/verifyApiToken');
app.use(verifyApiToken);

const corsOptions = { 
    credentials : true , 
    origin : [ 'http://localhost:5173' , 'https://scheduling-server-production.up.railway.app/' ]
 }; 

app. use ( cors (corsOptions)); 

app.use(express.json());

app.use('/coletas', coletasRoutes);
app.use('/clientes', clients)
app.use('/usuarios', usuarios)
app.use('/agendamentos', agendamento)
app.use('/zonas', zona)
app.use("/relatorios", relatoriosRouter);
app.use('/admin', admin);

app.get('/', (req, res) => {
  res.send('API está rodando com sucesso.');
});

app.listen({
  host: '0.0.0.0', 
  port: process.env.PORT ? Number(process.env.PORT) : 8000,
});