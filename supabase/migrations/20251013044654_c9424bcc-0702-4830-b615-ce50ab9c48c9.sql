-- Update RLS policy for internal_messages to allow team messages
DROP POLICY IF EXISTS "Users can view messages in their tenant" ON internal_messages;
DROP POLICY IF EXISTS "Users can send messages in their tenant" ON internal_messages;

-- Allow users to view messages they sent, received, or in their team
CREATE POLICY "Users can view messages in their tenant"
ON internal_messages
FOR SELECT
TO authenticated
USING (
  has_tenant_access(auth.uid(), tenant_id) AND (
    sender_id = auth.uid() OR 
    recipient_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    )
  )
);

-- Allow users to send direct messages or team messages
CREATE POLICY "Users can send messages in their tenant"
ON internal_messages
FOR INSERT
TO authenticated
WITH CHECK (
  has_tenant_access(auth.uid(), tenant_id) AND 
  sender_id = auth.uid() AND
  (
    -- Direct message
    (recipient_id IS NOT NULL AND team_id IS NULL) OR
    -- Team message (user must be in the team)
    (team_id IS NOT NULL AND team_id IN (
      SELECT team_id FROM team_members WHERE user_id = auth.uid()
    ))
  )
);