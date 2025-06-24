require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
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
