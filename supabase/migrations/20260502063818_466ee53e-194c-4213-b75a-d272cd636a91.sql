UPDATE auth.users
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

DELETE FROM public.profiles WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.user_roles WHERE user_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.team_members WHERE user_id NOT IN (SELECT id FROM auth.users);