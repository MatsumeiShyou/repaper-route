import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: 'postgresql://postgres.mjaoolcjjlxwstlpdgrg:' + process.env.VITE_SUPABASE_DATABASE_PW + '@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    select au.email, s.name, s.role 
    from auth.users au 
    join staffs s on au.id = s.id 
    limit 5;
  `);
  console.log('--- DEMO ACCOUNTS ---');
  res.rows.forEach(r => console.log(`Email: ${r.email} | Name: ${r.name} | Role: ${r.role}`));
  await client.end();
}
run().catch(console.error);
