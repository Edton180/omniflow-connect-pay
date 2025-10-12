import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0'

Deno.serve(async (req) => {
  try {
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

    // List all users
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    // Delete each user
    const deletePromises = users.map(user => 
      supabaseAdmin.auth.admin.deleteUser(user.id)
    )
    
    await Promise.all(deletePromises)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${users.length} usuários deletados com sucesso`,
        count: users.length
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})
