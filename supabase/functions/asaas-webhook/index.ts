import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const asaasToken = req.headers.get('asaas-access-token');
    const rawBody = await req.text();

    console.log('ASAAS webhook received');

    if (!asaasToken) {
      console.error('Missing asaas-access-token header');
      return new Response('Missing token', { status: 400, headers: corsHeaders });
    }

    // Get configured webhook token from environment
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    if (!webhookToken) {
      console.error('ASAAS_WEBHOOK_TOKEN not configured');
      return new Response('Webhook not configured', { status: 500, headers: corsHeaders });
    }

    // Verify ASAAS token
    if (asaasToken !== webhookToken) {
      console.error('Invalid ASAAS webhook token');
      return new Response('Invalid token', { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    console.log('ASAAS event type:', event.event);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle different event types
    switch (event.event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
        await handlePaymentReceived(supabase, event.payment);
        break;
      
      case 'PAYMENT_OVERDUE':
      case 'PAYMENT_DELETED':
        await handlePaymentFailed(supabase, event.payment);
        break;
      
      default:
        console.log('Unhandled ASAAS event type:', event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('ASAAS webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handlePaymentReceived(supabase: any, payment: any) {
  console.log('Processing received payment:', payment.id);

  let metadata: any = {};
  try {
    if (payment.externalReference) {
      metadata = JSON.parse(payment.externalReference);
    }
  } catch (e) {
    console.log('Could not parse metadata from externalReference');
  }

  if (!metadata?.tenant_id) {
    console.log('No tenant_id in metadata, skipping');
    return;
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_payment_id', payment.id)
    .maybeSingle();

  if (existing) {
    console.log('Payment already processed:', payment.id);
    return;
  }

  // Create payment record
  const { error } = await supabase
    .from('payments')
    .insert({
      tenant_id: metadata.tenant_id,
      subscription_id: metadata.subscription_id || null,
      amount: payment.value,
      currency: 'BRL',
      status: 'completed',
      payment_gateway: 'asaas',
      payment_method: payment.billingType,
      gateway_payment_id: payment.id,
      paid_at: payment.paymentDate || new Date().toISOString(),
      gateway_response: payment,
    });

  if (error) {
    console.error('Error creating payment:', error);
    throw error;
  }

  if (metadata.invoice_id) {
    await supabase.rpc('process_invoice_payment', {
      invoice_id_param: metadata.invoice_id
    });
  }

  if (metadata.order_id) {
    await supabase.rpc('process_catalog_order_payment', {
      order_id_param: metadata.order_id
    });
  }
}

async function handlePaymentFailed(supabase: any, payment: any) {
  console.log('Processing failed payment:', payment.id);

  // Update payment status if exists
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      gateway_response: payment,
    })
    .eq('gateway_payment_id', payment.id);

  if (error) console.error('Error updating payment:', error);
}
