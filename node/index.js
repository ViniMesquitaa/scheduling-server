require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors');

const coletasRoutes = require('./routes/coletas');
const clients = require('./routes/clients');
const usuarios = require('./routes/usuarios');
const agendamento = require('./routes/agendamentos');
const zona = require('./routes/zonas');
const relatoriosRouter = require('./routes/relatorios');
const admin = require('./routes/admin');

const verifyApiToken = require('./auth/verifyApiToken');
const corsOptions = { 
  credentials: true, 
  origin: [
    'http://localhost:5173', 
    'https://scheduling-server-production.up.railway.app'
  ],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API está rodando com sucesso.');
});

app.use((req, res, next) => {
  if (req.method === 'GET') {
    return next();
  }
  if (req.path === '/') {
    return next();
  }
  verifyApiToken(req, res, next);
});

app.use('/coletas', coletasRoutes);
app.use('/clientes', clients);
app.use('/usuarios', usuarios);
app.use('/agendamentos', agendamento);
app.use('/zonas', zona);
app.use('/relatorios', relatoriosRouter);
app.use('/admin', admin);


app.listen(process.env.PORT || 8000, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${process.env.PORT || 8000}`);
});
