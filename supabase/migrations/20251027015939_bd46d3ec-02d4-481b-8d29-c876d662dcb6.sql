-- Enable realtime for tickets table
ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;

-- Enable realtime for messages table (if not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;

-- Enable realtime for contacts table for online status
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- Create function to update contact last_seen on new message
CREATE OR REPLACE FUNCTION public.update_contact_last_seen()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_from_contact = true AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{last_seen}',
      to_jsonb(NOW()::text)
    )
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update contact last_seen on new message
DROP TRIGGER IF EXISTS update_contact_last_seen_trigger ON public.messages;
CREATE TRIGGER update_contact_last_seen_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_last_seen();