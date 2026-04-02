import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase.from('staffs').select('name, role');
  if (error) console.error(error);
  else {
    console.log('--- DEMO ACCOUNTS ---');
    data.forEach(d => console.log(`Name: ${d.name} | Role: ${d.role}`));
  }
}
run();
