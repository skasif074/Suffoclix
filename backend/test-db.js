const mysql = require('mysql2/promise');

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: '127.0.0.1',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'ott_platform'
    });
    console.log('✅ Connected!');
    await conn.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Error code:', err.code);
  }
}

test();