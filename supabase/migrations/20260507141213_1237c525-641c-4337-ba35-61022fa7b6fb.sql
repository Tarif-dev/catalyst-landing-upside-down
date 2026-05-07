
CREATE OR REPLACE FUNCTION public.delete_team()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_uid UUID := auth.uid(); v_tid UUID;
BEGIN
  SELECT id INTO v_tid FROM public.teams WHERE leader_id = v_uid;
  IF v_tid IS NULL THEN RAISE EXCEPTION 'Only the team leader can delete the team'; END IF;
  DELETE FROM public.teams WHERE id = v_tid;
END $$;
GRANT EXECUTE ON FUNCTION public.delete_team() TO authenticated;
