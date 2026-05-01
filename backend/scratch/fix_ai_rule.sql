-- Find OrgId for Hang Pod Si
DO $$
DECLARE
    target_org_id TEXT;
    rule_id TEXT := gen_random_uuid()::text;
BEGIN
    SELECT org_id INTO target_org_id FROM "Claro".zalo_accounts WHERE display_name LIKE '%Hang Pod Si%' LIMIT 1;
    
    IF target_org_id IS NOT NULL THEN
        -- Check if rule already exists
        IF NOT EXISTS (
            SELECT 1 FROM "Claro".automation_rules 
            WHERE org_id = target_org_id 
            AND actions::text LIKE '%ai_reply%'
        ) THEN
            -- Insert the rule
            INSERT INTO "Claro".automation_rules (id, org_id, name, trigger, actions, conditions, enabled, priority, created_at, updated_at)
            VALUES (
                rule_id, 
                target_org_id, 
                'Tự động phản hồi bằng AI', 
                'message_received', 
                '[{"type": "ai_reply"}]'::jsonb, 
                '[]'::jsonb, 
                true, 
                10, 
                NOW(), 
                NOW()
            );
        END IF;
    END IF;
END $$;
