import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Secret token for extra security (should be stored in secrets)
const DELETION_SECRET = Deno.env.get('USER_DELETION_SECRET') || 'CHANGE_ME_IN_PRODUCTION';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting user deletion process...')
    
    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Autenticação necessária');
    }

    // Create client with user's token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader }
        }
      }
    );

    // Verificar se usuário está autenticado
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Usuário não autenticado');
    }

    // Create admin client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário é super_admin
    const { data: roles, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !roles) {
      console.error('Acesso negado: usuário não é super_admin');
      throw new Error('Acesso negado: apenas super_admin pode executar esta operação');
    }

    // Verificar secret token no body
    const { secret } = await req.json().catch(() => ({ secret: null }));
    if (secret !== DELETION_SECRET) {
      console.error('Secret token inválido');
      throw new Error('Token de confirmação inválido');
    }

    // Registrar auditoria antes de deletar
    const { error: auditError } = await supabaseAdmin.rpc('log_audit', {
      p_action: 'DELETE_ALL_USERS',
      p_entity_type: 'system',
      p_entity_id: user.id,
      p_old_data: { initiated_by: user.email },
      p_new_data: null
    });
    
    if (auditError) {
      console.error('Erro ao registrar auditoria:', auditError);
    }

    // First, clean up all related data in public schema
    console.log('Cleaning up public schema data...')
    
    // Delete in correct order to respect foreign keys
    await supabaseAdmin.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('channels').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('queues').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('payment_gateways').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('plans').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    
    console.log('Public schema cleaned successfully')

    // Now delete all auth users
    console.log('Listing all auth users...')
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('Error listing users:', listError)
      throw listError
    }

    console.log(`Found ${users.length} users to delete`)

    // Delete each user from auth.users
    const deletePromises = users.map(user => {
      console.log(`Deleting user: ${user.email}`)
      return supabaseAdmin.auth.admin.deleteUser(user.id)
    })
    
    await Promise.all(deletePromises)
    
    console.log('All users deleted successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sistema limpo com sucesso! ${users.length} usuários deletados. Você pode agora cadastrar o primeiro usuário que será automaticamente super_admin.`,
        count: users.length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    console.error('Error in delete-all-users function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
