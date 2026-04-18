import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
dotenv.config();

async function deepAudit() {
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  const baseUrl = process.env.VITE_SUPABASE_URL;

  console.log('--- [Deep Sync Audit Starting] ---');

  // 1. ローカルのマイグレーションファイル一覧を取得
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const localFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();
  
  console.log(`[Local]: Found ${localFiles.length} migration files.`);

  // 2. リモートのマイグレーション履歴を取得 (Supabase内部テーブル)
  // 注: RESTからはアクセス制限がある場合があるが、認証キーで試行
  const url = `${baseUrl}/rest/v1/migrations?select=version`; 
  
  try {
    const resp = await fetch(url, {
      method: 'GET',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });

    if (!resp.ok) {
      console.log(`[Remote Audit]: Migrations table is not directly accessible via REST API (Expected for security).`);
      console.log(`[Action]: Verification will focus on column existence (Physical Manifest).`);
      return;
    }

    const remoteVersions = await resp.json();
    const remoteSet = new Set(remoteVersions.map(m => m.version));

    localFiles.forEach(file => {
      const version = file.split('_')[0];
      if (remoteSet.has(version)) {
        console.log(`[SYNC OK]: ${file}`);
      } else {
        console.log(`[MISMATCH - PENDING]: ${file}`);
      }
    });

  } catch (e) {
    console.log(`[ERROR]: ${e.message}`);
  }
  
  console.log('--- [Audit Phase 1 Complete] ---');
}

deepAudit();
