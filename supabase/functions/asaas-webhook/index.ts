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

    console.log('✅ ASAAS webhook received');

    // ASAAS pode não enviar token em alguns casos - aceitar sem validação
    // Para produção, configure ASAAS_WEBHOOK_TOKEN para validação
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');
    if (webhookToken && asaasToken && asaasToken !== webhookToken) {
      console.error('❌ Invalid ASAAS webhook token');
      return new Response('Invalid token', { status: 401, headers: corsHeaders });
    }

    if (!rawBody) {
      console.error('❌ Empty webhook body');
      return new Response('Empty body', { status: 400, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    console.log('📋 ASAAS event type:', event.event);

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
  console.log('Processing ASAAS payment received:', payment.id);

  let metadata: any = {};
  try {
    if (payment.externalReference) {
      metadata = JSON.parse(payment.externalReference);
    }
  } catch (e) {
    console.log('Could not parse metadata from externalReference');
  }

  const tenantId = metadata.tenant_id || payment.customer;
  if (!tenantId) {
    console.log('No tenant_id found, skipping');
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
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      subscription_id: metadata.subscription_id || null,
      amount: payment.value,
      currency: 'BRL',
      status: 'completed',
      payment_gateway: 'asaas',
      payment_method: payment.billingType?.toLowerCase() || 'unknown',
      gateway_payment_id: payment.id,
      paid_at: payment.confirmedDate || payment.paymentDate || new Date().toISOString(),
      gateway_response: {
        payment_id: payment.id,
        status: payment.status,
        billing_type: payment.billingType,
      },
    });

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }

  console.log('Payment created successfully');

  // Update checkout session if exists
  if (metadata.checkout_session_id) {
    await supabase
      .from('checkout_sessions')
      .update({ status: 'completed' })
      .eq('id', metadata.checkout_session_id);
    console.log('Checkout session updated');
  }

  // Process invoice if present
  if (metadata.invoice_id) {
    console.log('Processing invoice payment:', metadata.invoice_id);
    const { error: invoiceError } = await supabase.rpc('process_invoice_payment', {
      invoice_id_param: metadata.invoice_id
    });
    if (invoiceError) {
      console.error('Error processing invoice:', invoiceError);
    } else {
      console.log('Invoice processed successfully');
    }
  }

  // Process catalog order if present
  if (metadata.order_id) {
    console.log('Processing catalog order:', metadata.order_id);
    const { error: orderError } = await supabase.rpc('process_catalog_order_payment', {
      order_id_param: metadata.order_id
    });
    if (orderError) {
      console.error('Error processing order:', orderError);
    }
  }
}

async function handlePaymentFailed(supabase: any, payment: any) {
  console.log('Processing ASAAS payment failure:', payment.id);

  // Update payment status if exists
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      gateway_response: {
        payment_id: payment.id,
        status: payment.status,
        billing_type: payment.billingType,
      },
    })
    .eq('gateway_payment_id', payment.id);

  if (error) {
    console.error('Error updating payment:', error);
  } else {
    console.log('Payment marked as failed');
  }

  // Update checkout session if linked
  const { data: checkoutSession } = await supabase
    .from('checkout_sessions')
    .select('id')
    .eq('external_id', payment.id)
    .maybeSingle();

  if (checkoutSession) {
    await supabase
      .from('checkout_sessions')
      .update({ status: 'failed' })
      .eq('id', checkoutSession.id);
    console.log('Checkout session marked as failed');
  }
}
