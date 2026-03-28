-- [SANCTUARY AUDIT] routes テーブルの制約とユーザー ID の実例証跡を確認
SELECT 
    conname AS constraint_name, 
    pg_get_constraintdef(c.oid) AS definition 
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'routes';

-- 現在のユーザー ID (UUID) の実在性を profiles テーブルから確認
-- ※ ここでは UUID はプレースホルダ。実行時に差し替えるか、全量確認。
SELECT id, name, role FROM public.profiles LIMIT 20;
