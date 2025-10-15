-- Create super admin bypass policies for all key tables
-- This allows super admins to bypass all RLS restrictions

-- Payment Gateways - Super admin bypass
DROP POLICY IF EXISTS "Super admin bypass all" ON payment_gateways;
CREATE POLICY "Super admin bypass all" ON payment_gateways
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Catalog Orders - Super admin bypass
DROP POLICY IF EXISTS "Super admin can view all orders" ON catalog_orders;
CREATE POLICY "Super admin can view all orders" ON catalog_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Catalog Products - Super admin bypass
DROP POLICY IF EXISTS "Super admin can manage all products" ON catalog_products;
CREATE POLICY "Super admin can manage all products" ON catalog_products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Catalog Categories - Super admin bypass
DROP POLICY IF EXISTS "Super admin can manage all categories" ON catalog_categories;
CREATE POLICY "Super admin can manage all categories" ON catalog_categories
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Catalog Settings - Super admin bypass
DROP POLICY IF EXISTS "Super admin can manage all catalog settings" ON catalog_settings;
CREATE POLICY "Super admin can manage all catalog settings" ON catalog_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- CRM Columns - Super admin bypass
DROP POLICY IF EXISTS "Super admin can manage all CRM columns" ON crm_columns;
CREATE POLICY "Super admin can manage all CRM columns" ON crm_columns
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- CRM Leads - Super admin bypass
DROP POLICY IF EXISTS "Super admin can manage all CRM leads" ON crm_leads;
CREATE POLICY "Super admin can manage all CRM leads" ON crm_leads
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);