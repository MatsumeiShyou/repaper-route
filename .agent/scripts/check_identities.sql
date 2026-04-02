-- MODULE 1: Investigation
-- Check if the created user has an auth.identities record

SELECT * FROM auth.identities WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@tbny.co.jp');
