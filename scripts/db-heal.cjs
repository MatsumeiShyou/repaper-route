const { Client } = require('pg');
require('dotenv').config();

async function heal() {
  const client = new Client({
    connectionString: `postgresql://postgres:${process.env.VITE_SUPABASE_DATABASE_PW}@db.${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co:5432/postgres`,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Phase 1: Identity Discovery ---');
    // EmailからUIDを特定
    const resAuth = await client.query("SELECT id FROM auth.users WHERE email = 'admin@tbny.co.jp'");
    if (resAuth.rows.length === 0) {
      console.error('Error: admin@tbny.co.jp not found in auth.users');
      return;
    }
    const realUid = resAuth.rows[0].id;
    console.log(`Discovered Real UID: ${realUid}`);

    console.log('\n--- Phase 2: Physical Synchronization ---');
    // 名簿テーブルへ同期
    const syncSql = `
      INSERT INTO public.staffs (id, name, role, allowed_apps)
      VALUES ($1, '管理者', 'admin', ARRAY['repaper-route'])
      ON CONFLICT (id) DO UPDATE SET name = '管理者', role = 'admin', allowed_apps = ARRAY['repaper-route'];
    `;
    await client.query(syncSql, [realUid]);
    console.log('Staffs table synchronized (Healing Complete).');

    console.log('\n--- Phase 3: RLS Wall Demolition ---');
    // RLSポリシーの開放
    const rlsSql = `
      DROP POLICY IF EXISTS "Enable select for authenticated users" ON public.staffs;
      CREATE POLICY "Enable select for authenticated users" ON public.staffs
          FOR SELECT TO authenticated USING (true);
      ALTER TABLE public.staffs ENABLE ROW LEVEL SECURITY;
    `;
    await client.query(rlsSql);
    console.log('RLS Barriers removed for authenticated users.');

    console.log('\n--- Phase 4: Verification ---');
    const finalCheck = await client.query("SELECT * FROM public.staffs WHERE id = $1", [realUid]);
    console.table(finalCheck.rows);

  } catch (err) {
    console.error('Healing failed:', err);
  } finally {
    await client.end();
  }
}

heal();
