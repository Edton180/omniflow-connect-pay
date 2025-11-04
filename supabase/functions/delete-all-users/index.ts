import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('Starting user deletion process...')
    
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
