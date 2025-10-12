import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Create tenant function called');
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Verify caller is super_admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    console.log('User from token:', user?.id);
    
    if (userError || !user) {
      console.error('User error:', userError);
      throw new Error('Unauthorized - Invalid token');
    }

    // Check if user is super_admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .maybeSingle();

    console.log('User roles:', roles, 'Error:', rolesError);

    if (!roles) {
      throw new Error('Only super admins can create tenants');
    }

    const body = await req.json();
    console.log('Request body received');
    
    const { 
      name, 
      slug, 
      logo_url, 
      primary_color, 
      secondary_color, 
      max_users, 
      max_tickets,
      subscription_status,
      is_active,
      admin_name,
      admin_email,
      admin_password
    } = body;

    console.log('Creating admin user:', admin_email);

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: admin_email,
      password: admin_password,
      email_confirm: true,
      user_metadata: {
        full_name: admin_name,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw authError;
    }
    if (!authData.user) throw new Error('Failed to create user');

    console.log('Admin user created:', authData.user.id);

    // Create tenant
    const { data: tenantData, error: tenantError } = await supabaseAdmin
      .from('tenants')
      .insert({
        name,
        slug,
        logo_url,
        primary_color,
        secondary_color,
        max_users,
        max_tickets,
        subscription_status,
        is_active,
      })
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant error:', tenantError);
      throw tenantError;
    }

    console.log('Tenant created:', tenantData.id);

    // Create profile for admin user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: admin_name,
        tenant_id: tenantData.id,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    console.log('Profile created');

    // Assign tenant_admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenantData.id,
        role: 'tenant_admin',
      });

    if (roleError) {
      console.error('Role error:', roleError);
      throw roleError;
    }

    console.log('Role assigned');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Tenant created successfully',
        tenant: tenantData 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
