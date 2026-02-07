const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();

    const { sub, email, given_name, family_name } = event.request.userAttributes;
    const favoriteNotes = event.request.userAttributes['custom:favorite_notes'] || '';
    const isAdmin = email.endsWith('@omrefragrances.com');

    await client.query(
      `INSERT INTO users (cognito_sub, email, first_name, last_name, favorite_notes, is_admin) 
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (cognito_sub) DO NOTHING`,
      [sub, email, given_name || '', family_name || '', favoriteNotes, isAdmin]
    );

    console.log(`User ${email} synced to RDS. Admin: ${isAdmin}`);
    return event;
  } catch (error) {
    console.error('Error syncing user to RDS:', error);
    throw error;
  } finally {
    await client.end();
  }
};
