
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_team_leader(UUID, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_team() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.check_team_member_limit() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
