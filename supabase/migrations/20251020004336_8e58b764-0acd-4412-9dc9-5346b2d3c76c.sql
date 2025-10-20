-- Drop all catalog-related tables and dependencies
DROP TABLE IF EXISTS catalog_order_items CASCADE;
DROP TABLE IF EXISTS catalog_orders CASCADE;
DROP TABLE IF EXISTS catalog_product_optionals CASCADE;
DROP TABLE IF EXISTS catalog_product_variations CASCADE;
DROP TABLE IF EXISTS catalog_products CASCADE;
DROP TABLE IF EXISTS catalog_categories CASCADE;
DROP TABLE IF EXISTS catalog_settings CASCADE;
DROP TABLE IF EXISTS catalog_landing_settings CASCADE;
DROP TABLE IF EXISTS catalog_shipping_settings CASCADE;
DROP TABLE IF EXISTS catalog_order_settings CASCADE;
DROP TABLE IF EXISTS global_catalog_settings CASCADE;
DROP TABLE IF EXISTS tenant_balances CASCADE;
DROP TABLE IF EXISTS withdrawal_requests CASCADE;

-- Drop catalog-related functions
DROP FUNCTION IF EXISTS process_catalog_order_payment(uuid);
DROP FUNCTION IF EXISTS update_catalog_updated_at();
DROP FUNCTION IF EXISTS update_catalog_category_updated_at();
DROP FUNCTION IF EXISTS generate_order_number();
DROP FUNCTION IF EXISTS set_order_number();