-- ==============================================================================
-- WERASH CLOUD MESSAGING INFRASTRUCTURE: CLEAN REBUILD & MIGRATION SCRIPT
-- ==============================================================================
-- Instructions: Run this script in your Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/xlhoroxghgwfzuhnbbbc/sql
-- ==============================================================================

-- 1. DROP LEGACY TABLES & POLICIES (Clean Slate Data Wipe)
DROP TABLE IF EXISTS public.direct_messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;

-- 2. CREATE CONVERSATIONS TABLE
-- Enforces canonical sorting: participant_1 is ALWAYS < participant_2.
-- Guarantees exactly ONE unique row per user pair.
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_1_name TEXT,
    participant_1_handle TEXT,
    participant_1_avatar TEXT,
    participant_2_name TEXT,
    participant_2_handle TEXT,
    participant_2_avatar TEXT,
    last_message_text TEXT DEFAULT '',
    last_message_at TIMESTAMPTZ DEFAULT now(),
    last_sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT check_participant_order CHECK (participant_1 < participant_2),
    CONSTRAINT unique_conversation_participants UNIQUE (participant_1, participant_2)
);

-- 3. CREATE DIRECT_MESSAGES TABLE
-- Strongly typed, cascaded to conversation, supports text/image/audio/specialist
CREATE TABLE public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT DEFAULT '',
    media_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'images', 'audio', 'specialist'
    media_url TEXT,
    metadata JSONB,
    voice_duration TEXT,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CREATE HIGH-PERFORMANCE INDEXES
CREATE INDEX idx_conversations_participants 
    ON public.conversations(participant_1, participant_2);

CREATE INDEX idx_conversations_last_msg_at 
    ON public.conversations(last_message_at DESC);

CREATE INDEX idx_dm_conversation_created 
    ON public.direct_messages(conversation_id, created_at ASC);

CREATE INDEX idx_dm_receiver_unread 
    ON public.direct_messages(receiver_id, is_read) 
    WHERE is_read = false;

CREATE INDEX idx_dm_participants 
    ON public.direct_messages(sender_id, receiver_id);

-- 5. AUTOMATIC CONVERSATION SYNC TRIGGER
-- Automatically updates conversation snippet, time, and last_sender_id on message insertion
CREATE OR REPLACE FUNCTION public.sync_conversation_on_message()
RETURNS TRIGGER AS $$
DECLARE
    snippet TEXT;
BEGIN
    IF NEW.media_type = 'audio' THEN
        snippet := '🎙️ Voice message';
    ELSIF NEW.media_type = 'images' THEN
        snippet := '📷 Photo';
    ELSIF NEW.media_type = 'specialist' THEN
        snippet := 'Shared a specialist';
    ELSE
        snippet := COALESCE(NULLIF(NEW.text, ''), 'New message');
    END IF;

    UPDATE public.conversations
    SET
        last_message_text = snippet,
        last_message_at = NEW.created_at,
        last_sender_id = NEW.sender_id,
        updated_at = now()
    WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_conversation ON public.direct_messages;
CREATE TRIGGER trg_sync_conversation
    AFTER INSERT ON public.direct_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_conversation_on_message();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS: Users can only view, create, or update conversations they belong to
CREATE POLICY "Users can view their conversations"
    ON public.conversations FOR SELECT
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can insert conversations they belong to"
    ON public.conversations FOR INSERT
    WITH CHECK (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can update their conversations"
    ON public.conversations FOR UPDATE
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

CREATE POLICY "Users can delete their conversations"
    ON public.conversations FOR DELETE
    USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Direct Messages RLS: Users can view, insert, update (mark read), or delete their own messages
CREATE POLICY "Users can view messages they sent or received"
    ON public.direct_messages FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can insert messages they send"
    ON public.direct_messages FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received (e.g. mark read)"
    ON public.direct_messages FOR UPDATE
    USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete messages they sent"
    ON public.direct_messages FOR DELETE
    USING (auth.uid() = sender_id);

-- 7. REALTIME REPLICATION PUBLICATION
-- Enable realtime events for direct_messages and conversations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'direct_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
    END IF;
END $$;
