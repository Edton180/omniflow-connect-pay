-- Ensure REPLICA IDENTITY FULL for messages table to enable full row data in realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Ensure REPLICA IDENTITY FULL for tickets table
ALTER TABLE public.tickets REPLICA IDENTITY FULL;

-- Ensure REPLICA IDENTITY FULL for contacts table
ALTER TABLE public.contacts REPLICA IDENTITY FULL;