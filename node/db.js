require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  ssl: {
    rejectUnauthorized: false, // necessário para conexões com o Render
  }
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("Banco de dados PostgreSQL conectado com sucesso");
    client.release();
  } catch (error) {
    console.error("Erro ao conectar no banco de dados:", error);
  }
})();

module.exports = pool;
