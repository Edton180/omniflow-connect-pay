-- Fix foreign key relationships for tickets table

-- First, ensure the foreign key exists for assigned_to -> profiles
DO $$ 
BEGIN
    -- Drop the foreign key if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_assigned_to_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_assigned_to_fkey;
    END IF;

    -- Add the foreign key with proper naming
    ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_assigned_to_fkey
    FOREIGN KEY (assigned_to) 
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
END $$;

-- Ensure contact_id foreign key exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_contact_id_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_contact_id_fkey;
    END IF;

    ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_contact_id_fkey
    FOREIGN KEY (contact_id) 
    REFERENCES public.contacts(id)
    ON DELETE CASCADE;
END $$;

-- Ensure queue_id foreign key exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_queue_id_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_queue_id_fkey;
    END IF;

    ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_queue_id_fkey
    FOREIGN KEY (queue_id) 
    REFERENCES public.queues(id)
    ON DELETE SET NULL;
END $$;

-- Ensure tenant_id foreign key exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'tickets_tenant_id_fkey' 
        AND table_name = 'tickets'
    ) THEN
        ALTER TABLE public.tickets DROP CONSTRAINT tickets_tenant_id_fkey;
    END IF;

    ALTER TABLE public.tickets
    ADD CONSTRAINT tickets_tenant_id_fkey
    FOREIGN KEY (tenant_id) 
    REFERENCES public.tenants(id)
    ON DELETE CASCADE;
END $$;