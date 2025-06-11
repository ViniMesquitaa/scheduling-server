require('dotenv').config();
const jwt = require('jsonwebtoken');

function autenticarAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, admin) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });

    req.admin = admin; 
    next();
  });
}

module.exports = autenticarAdmin;
