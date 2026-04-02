import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Attempting login...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@tbny.co.jp',
    password: 'tbny-demo123'
  });
  
  if (error) {
    console.error("Login Error:", error.message, error.status);
  } else {
    console.log("Login Success:", data.user?.id);
  }
}
run();
