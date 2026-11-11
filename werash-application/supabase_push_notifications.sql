-- =========================================================================
-- Werash Push Notifications Schema
-- =========================================================================

-- 1. Create table for storing Expo Push Tokens per user
CREATE TABLE IF NOT EXISTS public.user_push_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expo_push_token TEXT NOT NULL,
    platform TEXT DEFAULT 'ios',
    device_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_token UNIQUE(user_id, expo_push_token)
);

-- Index for quick recipient lookup
CREATE INDEX IF NOT EXISTS idx_user_push_tokens_user_id ON public.user_push_tokens(user_id);

-- Enable RLS
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage (insert, update, delete) their own tokens
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.user_push_tokens;
CREATE POLICY "Users can manage own tokens"
ON public.user_push_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to view recipient tokens so sender client can dispatch push notification
DROP POLICY IF EXISTS "Users can view tokens to send push" ON public.user_push_tokens;
CREATE POLICY "Users can view tokens to send push"
ON public.user_push_tokens
FOR SELECT
TO authenticated
USING (true);

-- 2. Add expo_push_token column to profiles table as convenience column
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
