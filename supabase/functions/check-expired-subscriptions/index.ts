import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Buscar assinaturas que expiraram
    const now = new Date().toISOString()
    const { data: expiredSubscriptions, error: subError } = await supabaseClient
      .from('subscriptions')
      .select(`
        *,
        plan:plans(*),
        tenant:tenants(*)
      `)
      .eq('status', 'active')
      .lt('expires_at', now)

    if (subError) throw subError

    console.log(`Found ${expiredSubscriptions?.length || 0} expired subscriptions`)

    const results = []

    for (const subscription of expiredSubscriptions || []) {
      try {
        // Calcular próxima data de vencimento (30 dias)
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)

        // Gerar fatura
        const { data: invoice, error: invoiceError } = await supabaseClient
          .from('invoices')
          .insert({
            tenant_id: subscription.tenant_id,
            subscription_id: subscription.id,
            amount: subscription.plan.price,
            currency: subscription.plan.currency || 'BRL',
            due_date: dueDate.toISOString(),
            status: 'pending',
            description: `Renovação - ${subscription.plan.name}`
          })
          .select()
          .single()

        if (invoiceError) {
          console.error(`Error creating invoice for subscription ${subscription.id}:`, invoiceError)
          results.push({
            subscription_id: subscription.id,
            success: false,
            error: invoiceError.message
          })
          continue
        }

        // Atualizar status da assinatura para "expired"
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({ 
            status: 'expired'
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
        }

        // Atualizar tenant para indicar vencimento
        const { error: tenantError } = await supabaseClient
          .from('tenants')
          .update({
            subscription_status: 'expired',
            expiry_date: now
          })
          .eq('id', subscription.tenant_id)

        if (tenantError) {
          console.error(`Error updating tenant ${subscription.tenant_id}:`, tenantError)
        }

        results.push({
          subscription_id: subscription.id,
          tenant_id: subscription.tenant_id,
          invoice_id: invoice.id,
          success: true
        })

        console.log(`Created invoice for subscription ${subscription.id}`)
      } catch (error: any) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        results.push({
          subscription_id: subscription.id,
          success: false,
          error: error.message
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} expired subscriptions`,
        results
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: any) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
