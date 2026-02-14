CREATE TABLE IF NOT EXISTS public.connectivity_test (
    id serial PRIMARY KEY,
    created_at timestamptz DEFAULT now()
);

GRANT ALL ON public.connectivity_test TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
