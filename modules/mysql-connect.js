require('dotenv').config();
const mysql2 = require('mysql2');

const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 8,
    queueLimit: 0,
})

module.exports = pool.promise();