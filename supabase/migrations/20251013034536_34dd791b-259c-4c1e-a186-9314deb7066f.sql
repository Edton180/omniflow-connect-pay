-- Criar bucket para mídias de tickets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('ticket-media', 'ticket-media', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas para ticket-media bucket
CREATE POLICY "Users can upload ticket media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'ticket-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view ticket media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ticket-media');

CREATE POLICY "Users can delete their ticket media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'ticket-media' AND auth.uid() IS NOT NULL);