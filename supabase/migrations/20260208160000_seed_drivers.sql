-- Seed drivers data
-- Using INSERT ... SELECT ... WHERE NOT EXISTS to avoid duplicates based on name
INSERT INTO public.drivers (id, driver_name)
SELECT gen_random_uuid()::text, name
FROM (VALUES
  ('岩佐'),
  ('菊池'),
  ('関口'),
  ('松明'),
  ('畑澤'),
  ('麻美'),
  ('片山'),
  ('山田'),
  ('万里'),
  ('藤川'),
  ('鈴木')
) AS t(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.drivers WHERE driver_name = t.name
);
