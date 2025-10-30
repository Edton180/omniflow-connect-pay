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
    console.log('Create user function called');
    
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

    // Verify caller is admin
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

    // Check if user is admin
    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role, tenant_id')
      .eq('user_id', user.id)
      .in('role', ['super_admin', 'tenant_admin']);

    console.log('User roles:', roles);

    if (!roles || roles.length === 0) {
      throw new Error('Only admins can create users');
    }

    const body = await req.json();
    console.log('Request body received');
    
    const { 
      email,
      password,
      full_name,
      phone,
      tenant_id,
      role,
      queue_ids,
      queue_role,
      can_takeover_ai
    } = body;

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      throw new Error('Missing required fields: email, password, full_name, role');
    }

    // Check if tenant_admin is trying to create user in their tenant
    const isSuperAdmin = roles.some(r => r.role === 'super_admin');
    if (!isSuperAdmin) {
      const userTenantId = roles[0]?.tenant_id;
      if (tenant_id !== userTenantId) {
        throw new Error('Tenant admins can only create users in their own tenant');
      }
    }

    console.log('Creating user:', email);

    // Create new user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      throw new Error(`Failed to create user: ${authError.message}`);
    }
    if (!authData.user) throw new Error('Failed to create user');

    const userId = authData.user.id;
    console.log('User created:', userId);

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        full_name: full_name,
        phone: phone || null,
        tenant_id: tenant_id || null,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      throw profileError;
    }

    console.log('Profile created');

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userId,
        tenant_id: tenant_id || null,
        role: role,
      });

    if (roleError) {
      console.error('Role error:', roleError);
      throw roleError;
    }

    console.log('Role assigned');

    // Assign queues if provided
    if (queue_ids && queue_ids.length > 0) {
      const queueAssignments = queue_ids.map((queue_id: string) => ({
        user_id: userId,
        queue_id: queue_id,
        role: queue_role || 'agent',
        can_takeover_ai: can_takeover_ai || false,
        is_active: true,
      }));

      const { error: queueError } = await supabaseAdmin
        .from('user_queues')
        .insert(queueAssignments);

      if (queueError) {
        console.error('Queue assignment error:', queueError);
        // Don't throw, just log the error
      } else {
        console.log('Queues assigned');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        user_id: userId 
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
