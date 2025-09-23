-- Grant execute permissions on challenge and quota functions to authenticated users
GRANT EXECUTE ON FUNCTION public.user_is_challenge_participant() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_ai_quota() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;