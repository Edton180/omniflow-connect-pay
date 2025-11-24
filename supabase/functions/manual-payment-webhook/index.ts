import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoice_id, proof_file_url, tenant_id } = await req.json();

    console.log('📥 Manual payment proof received:', {
      invoice_id,
      tenant_id,
      has_proof: !!proof_file_url
    });

    if (!invoice_id || !tenant_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Update invoice status to pending_verification
    const { error: invoiceError } = await supabase
      .from('invoices')
      .update({
        status: 'pending_verification',
        metadata: {
          proof_url: proof_file_url,
          submitted_at: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', invoice_id)
      .eq('tenant_id', tenant_id);

    if (invoiceError) {
      console.error('❌ Error updating invoice:', invoiceError);
      throw invoiceError;
    }

    console.log('✅ Invoice updated to pending verification');

    // Get tenant info for notification
    const { data: tenant } = await supabase
      .from('tenants')
      .select('name, id')
      .eq('id', tenant_id)
      .single();

    // Create notification record
    await supabase
      .from('invoice_notifications')
      .insert({
        invoice_id,
        tenant_id,
        notification_type: 'proof_submitted',
        delivery_method: 'email',
        status: 'pending'
      });

    console.log('✅ Notification record created');

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Comprovante enviado com sucesso. Aguarde a aprovação.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('❌ Manual payment webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
