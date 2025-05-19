const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',       // seu host MySQL
  user: 'root',     // seu usuário MySQL
  password: 'v712091311',   // sua senha MySQL
  database: 'sistema_coletas',   // nome do banco de dados
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
