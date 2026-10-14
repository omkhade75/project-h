-- Fix Supabase Database Linter Warnings (0028 & 0029):
-- Prevents public/anonymous and authenticated roles from executing the internal rls_auto_enable function via PostgREST RPC.

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
