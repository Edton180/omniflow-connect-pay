import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const xSignature = req.headers.get('x-signature');
    const rawBody = await req.text();

    console.log('InfinitePay webhook received');

    if (!xSignature) {
      console.error('Missing x-signature header');
      return new Response('Missing signature', { status: 400, headers: corsHeaders });
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('INFINITEPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('INFINITEPAY_WEBHOOK_SECRET not configured');
      return new Response('Webhook not configured', { status: 500, headers: corsHeaders });
    }

    // Verify InfinitePay signature
    const isValid = await verifyInfinitePaySignature(rawBody, xSignature, webhookSecret);
    if (!isValid) {
      console.error('Invalid InfinitePay signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    console.log('InfinitePay event type:', event.event, 'status:', event.data?.status);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle different event types
    switch (event.event) {
      case 'charge.paid':
      case 'charge.approved':
        await handleChargePaid(supabase, event.data);
        break;
      
      case 'charge.failed':
      case 'charge.cancelled':
        await handleChargeFailed(supabase, event.data);
        break;
      
      default:
        console.log('Unhandled InfinitePay event type:', event.event);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('InfinitePay webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyInfinitePaySignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payload)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedSignature === signature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function handleChargePaid(supabase: any, charge: any) {
  console.log('Processing InfinitePay charge paid:', charge.id);

  const metadata = charge.metadata || {};
  const tenantId = metadata.tenant_id || charge.customer_id;

  if (!tenantId) {
    console.log('No tenant_id found, skipping');
    return;
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_payment_id', charge.id)
    .maybeSingle();

  if (existing) {
    console.log('Charge already processed:', charge.id);
    return;
  }

  // Create payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      subscription_id: metadata.subscription_id || null,
      amount: charge.amount / 100,
      currency: charge.currency?.toUpperCase() || 'BRL',
      status: 'completed',
      payment_gateway: 'infinitepay',
      payment_method: charge.payment_method || 'card',
      gateway_payment_id: charge.id,
      paid_at: charge.paid_at || charge.confirmed_at || new Date().toISOString(),
      gateway_response: {
        charge_id: charge.id,
        status: charge.status,
        payment_method: charge.payment_method,
      },
    });

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }

  console.log('Payment created successfully');

  // Update checkout session
  if (metadata.checkout_session_id) {
    await supabase
      .from('checkout_sessions')
      .update({ status: 'completed' })
      .eq('id', metadata.checkout_session_id);
    console.log('Checkout session updated');
  }

  // Process invoice
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

  // Process catalog order
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

async function handleChargeFailed(supabase: any, charge: any) {
  console.log('Processing InfinitePay charge failure:', charge.id);

  // Update payment status if exists
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      gateway_response: {
        charge_id: charge.id,
        status: charge.status,
        failure_reason: charge.failure_reason,
      },
    })
    .eq('gateway_payment_id', charge.id);

  if (error) {
    console.error('Error updating payment:', error);
  } else {
    console.log('Payment marked as failed');
  }

  // Update checkout session
  const { data: checkoutSession } = await supabase
    .from('checkout_sessions')
    .select('id')
    .eq('external_id', charge.id)
    .maybeSingle();

  if (checkoutSession) {
    await supabase
      .from('checkout_sessions')
      .update({ status: 'failed' })
      .eq('id', checkoutSession.id);
    console.log('Checkout session marked as failed');
  }
}
