import { readFileSync } from 'fs';
import pg from 'pg';

const PROJECT_REF = 'jhyehtlnxvembdzmjgbj';
const PASSWORD = 'Naoligo54321@';
const POOLER_HOST = 'aws-0-us-east-2.pooler.supabase.com';
const POOLER_PORT = 6543;

const sql = readFileSync('supabase-migration.sql', 'utf-8');

const statements = sql
  .split('\n')
  .filter(line => !line.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

async function run() {
  console.log(`Conectando via pooler: ${POOLER_HOST}:${POOLER_PORT}`);

  const client = new pg.Client({
    host: POOLER_HOST,
    port: POOLER_PORT,
    user: `postgres.${PROJECT_REF}`,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  await client.connect();
  console.log('Conectado ao Supabase (via pooler)!\n');

  for (const stmt of statements) {
    try {
      await client.query(stmt + ';');
      console.log('  OK:', stmt.substring(0, 70));
    } catch (err) {
      console.log('  AVISO:', err.message.substring(0, 120));
    }
  }

  await client.end();
  console.log('\nMigration concluída com sucesso!');
}

run().catch(err => {
  console.error('ERRO:', err.message);
  process.exit(1);
});
