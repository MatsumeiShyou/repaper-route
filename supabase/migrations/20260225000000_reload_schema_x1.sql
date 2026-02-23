-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
-- Just in case, grant permissions again
GRANT ALL ON public.view_master_points TO anon, authenticated;
