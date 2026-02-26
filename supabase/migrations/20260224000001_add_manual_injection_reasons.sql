-- 案件手動追加時の追加理由をチーム全体で資産として共有するためのテーブル
CREATE TABLE IF NOT EXISTS manual_injection_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reason_text TEXT NOT NULL UNIQUE,
    usage_count INTEGER DEFAULT 1,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS設定（認証済みユーザーは全て可能）
ALTER TABLE manual_injection_reasons ENABLE ROW LEVEL SECURITY;

-- 既存のポリシーをクリーンアップ（冪等性）
DROP POLICY IF EXISTS "Allow all for authenticated" ON manual_injection_reasons;
DROP POLICY IF EXISTS "Allow all for anon" ON manual_injection_reasons;

CREATE POLICY "Allow all for authenticated" ON manual_injection_reasons
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for anon" ON manual_injection_reasons
    FOR ALL TO anon USING (true) WITH CHECK (true);

-- API経由でのテーブルアクセス権を付与
GRANT SELECT, INSERT, UPDATE, DELETE ON manual_injection_reasons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON manual_injection_reasons TO authenticated;

-- インデックスの追加（検索・ソート用）
CREATE INDEX IF NOT EXISTS idx_reasons_usage_count ON manual_injection_reasons (usage_count DESC, last_used_at DESC);
