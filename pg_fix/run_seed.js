const { Client } = require('pg');

const client = new Client({
    connectionString: 'postgres://postgres:tDwqo3iozPe12W4Q@db.mjaoolcjjlxwstlpdgrg.supabase.co:6543/postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const sql = `
      DO $$
      BEGIN
        -- 1. Create Admin Profile
        INSERT INTO public.profiles (id, name, role, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000001', 'システム管理者', 'admin', now())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, updated_at = now();

        -- 2. Create Driver Profile
        INSERT INTO public.profiles (id, name, role, vehicle_info, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000002', 'デモドライバー', 'driver', 'R-01', now())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role, vehicle_info = EXCLUDED.vehicle_info, updated_at = now();

        -- Link to drivers table if exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
          INSERT INTO public.drivers (id, driver_name, user_id, updated_at)
          VALUES ('D001', 'デモドライバー', '00000000-0000-0000-0000-000000000002', now())
          ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id;
        END IF;
      END $$;
    `;

        await client.query(sql);
        console.log('Seed SQL executed successfully');

        // Verify count
        const res = await client.query('SELECT count(*) FROM profiles');
        console.log('Total profiles now:', res.rows[0].count);

    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await client.end();
    }
}

run();
