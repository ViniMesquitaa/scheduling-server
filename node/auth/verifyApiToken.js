require('dotenv').config();
module.exports = function (req, res, next) {
  const token = req.headers['x-api-key'];
  const expectedToken = process.env.API_TOKEN;

  if (!expectedToken) {
    console.error('API_TOKEN não configurado no .env');
    return res.status(500).json({ error: 'Configuração do servidor inválida.' });
  }

  if (!token || token !== expectedToken) {
    return res.status(403).json({ error: 'Acesso não autorizado.' });
  }

  next();
};
