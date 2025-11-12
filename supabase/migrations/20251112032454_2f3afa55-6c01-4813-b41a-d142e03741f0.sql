-- Add force_agent_signature column to tenants table
ALTER TABLE tenants 
ADD COLUMN force_agent_signature boolean DEFAULT false;

COMMENT ON COLUMN tenants.force_agent_signature IS 'When true, agents cannot disable their signature - it will always be active';