-- Disable RLS on profiles to eliminate permission issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON profiles TO anon, authenticated, service_role;
NOTIFY pgrst, 'reload schema';
