-- Create storage bucket for tenant logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('tenant-logos', 'tenant-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tenant logos
CREATE POLICY "Tenant admins can upload their logo"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-logos' AND
    (storage.foldername(name))[1] = (
      SELECT tenant_id::text 
      FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin')
      LIMIT 1
    )
  );

CREATE POLICY "Tenant logos are publicly accessible"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'tenant-logos');

CREATE POLICY "Tenant admins can update their logo"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'tenant-logos' AND
    (storage.foldername(name))[1] = (
      SELECT tenant_id::text 
      FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin')
      LIMIT 1
    )
  );

CREATE POLICY "Tenant admins can delete their logo"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tenant-logos' AND
    (storage.foldername(name))[1] = (
      SELECT tenant_id::text 
      FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('super_admin', 'tenant_admin')
      LIMIT 1
    )
  );

-- Add custom_domain field to tenants table
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT;
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS custom_css JSONB DEFAULT '{}'::jsonb;