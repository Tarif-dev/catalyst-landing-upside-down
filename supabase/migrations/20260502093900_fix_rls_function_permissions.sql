-- Fix: The previous migration revoked EXECUTE on helper functions from all roles,
-- but RLS policies reference these functions and need authenticated users to be
-- able to invoke them. Re-grant EXECUTE to the authenticated role.

GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_leader(UUID, UUID) TO authenticated;
