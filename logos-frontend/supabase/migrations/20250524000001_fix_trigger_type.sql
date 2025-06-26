-- Fix agent_triggers.trigger_type field to be TEXT instead of JSONB
ALTER TABLE agent_triggers 
ALTER COLUMN trigger_type TYPE TEXT 
USING (trigger_type #>> '{}');

-- Add constraint to ensure only valid trigger types
ALTER TABLE agent_triggers 
ADD CONSTRAINT valid_trigger_type 
CHECK (trigger_type IN ('webhook', 'scheduled', 'manual'));

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_agent_triggers_type_active 
ON agent_triggers (trigger_type, is_active) 
WHERE is_active = true;