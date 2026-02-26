---
description: SupabaseマイグレーションをリモートDBに反映する
---

1. ローカル、またはリモート環境にマイグレーションを適用します。
// turbo
npx supabase migration up
// turbo
npx supabase db push

2. 反映後、AIが最新の型定義を取得して同期を確認します。
npx supabase gen types typescript --linked > current_schema_check.ts
