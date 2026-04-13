const { Client } = require('pg');
require('dotenv').config();

async function audit() {
  const client = new Client({
    connectionString: `postgresql://postgres:${process.env.VITE_SUPABASE_DATABASE_PW}@db.${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- 1. Auth Users ---');
    const resUsers = await client.query("SELECT id, email, confirmed_at FROM auth.users WHERE email = 'admin@tbny.co.jp'");
    console.table(resUsers.rows);

    console.log('\n--- 2. Public Staffs ---');
    const resStaffs = await client.query("SELECT * FROM public.staffs WHERE id = '34f6c0d4-34c0-48df-a52a-5bdb8901e43b'");
    console.table(resStaffs.rows);

    console.log('\n--- 3. RLS Policies on Staffs ---');
    const resPolicies = await client.query("SELECT policyname, roles, cmd, qual FROM pg_policies WHERE tablename = 'staffs'");
    console.table(resPolicies.rows);

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await client.end();
  }
}

audit();
