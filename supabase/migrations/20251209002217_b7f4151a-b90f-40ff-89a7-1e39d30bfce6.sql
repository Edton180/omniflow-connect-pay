-- Add new columns for social media and support links in landing page settings
ALTER TABLE landing_page_settings 
ADD COLUMN IF NOT EXISTS social_twitter_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS social_github_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS social_linkedin_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS support_help_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS support_docs_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS support_status_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS support_contact_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS legal_terms_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS legal_privacy_url TEXT DEFAULT '#',
ADD COLUMN IF NOT EXISTS legal_cookies_url TEXT DEFAULT '#';