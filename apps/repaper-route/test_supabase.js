import { createClient } from '@supabase/supabase-js';

const url = 'https://mjaoolcjjlxwstlpdgrg.supabase.co';
const key = 'sb_publishable_ZF6sehN7lh-X8YYsdVb85w_cuSbBJgC';

const supabase = createClient(url, key);

async function test() {
  console.log('Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('staffs').select('id').limit(1);
    if (error) {
      console.error('ERROR:', error);
    } else {
      console.log('SUCCESS, got data:', data);
    }
  } catch (e) {
    console.error('EXCEPTION:', e);
  }
}

test();
