-- ============================================
-- FIX: SECURITY WARNINGS - SEARCH PATH
-- ============================================

-- Recriar função update_overdue_invoices com search_path seguro
CREATE OR REPLACE FUNCTION update_overdue_invoices()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE invoices 
  SET status = 'overdue' 
  WHERE due_date < NOW() 
    AND status = 'pending';
  
  RAISE NOTICE 'Updated % invoices to overdue', (SELECT COUNT(*) FROM invoices WHERE status = 'overdue');
END;
$$;

-- Recriar função trigger_check_overdue com search_path seguro
CREATE OR REPLACE FUNCTION trigger_check_overdue()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.due_date < NOW() AND NEW.status = 'pending' THEN
    NEW.status := 'overdue';
  END IF;
  RETURN NEW;
END;
$$;