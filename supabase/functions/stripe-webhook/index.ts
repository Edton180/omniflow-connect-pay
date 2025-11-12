import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('stripe-signature');
    const rawBody = await req.text();

    if (!signature) {
      console.error('Missing Stripe signature');
      return new Response('Missing signature', { status: 400, headers: corsHeaders });
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return new Response('Webhook not configured', { status: 500, headers: corsHeaders });
    }

    // Verify Stripe signature
    const isValid = await verifyStripeSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid Stripe signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    console.log('Stripe webhook event:', event.type);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(supabase, event.data.object);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(supabase, event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(supabase, event.data.object);
        break;
      
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionUpdate(supabase, event.data.object);
        break;
      
      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    // Parse signature header
    const elements = signature.split(',');
    const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
    const signatures = elements.filter(e => e.startsWith('v1='));

    if (!timestamp || signatures.length === 0) {
      console.error('Invalid signature format');
      return false;
    }

    // Create signed payload
    const signedPayload = `${timestamp}.${payload}`;
    
    // Compute expected signature
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature_bytes = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(signedPayload)
    );
    
    const expectedSig = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Compare signatures
    const providedSig = signatures[0].split('=')[1];
    return providedSig === expectedSig;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

async function handleCheckoutCompleted(supabase: any, session: any) {
  console.log('Processing Stripe checkout completion:', session.id);

  const { metadata } = session;
  if (!metadata?.tenant_id) {
    console.log('No tenant_id in metadata, skipping');
    return;
  }

  // Idempotency check
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_payment_id', session.payment_intent || session.id)
    .maybeSingle();

  if (existingPayment) {
    console.log('Payment already processed, skipping');
    return;
  }

  // Create payment record
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: metadata.tenant_id,
      subscription_id: metadata.subscription_id || null,
      amount: session.amount_total / 100,
      currency: session.currency.toUpperCase(),
      status: 'completed',
      payment_gateway: 'stripe',
      gateway_payment_id: session.payment_intent || session.id,
      paid_at: new Date().toISOString(),
      payment_method: session.payment_method_types?.[0] || 'card',
      gateway_response: { 
        session_id: session.id,
        customer: session.customer,
        payment_status: session.payment_status 
      },
    });

  if (paymentError) {
    console.error('Error creating payment:', paymentError);
    throw paymentError;
  }

  console.log('Payment created successfully');

  // Update checkout session status
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

async function handleInvoicePaid(supabase: any, invoice: any) {
  console.log('Processing invoice payment:', invoice.id);

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  // Update subscription in database
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      gateway_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('gateway_subscription_id', subscriptionId);

  if (error) console.error('Error updating subscription:', error);
}

async function handlePaymentFailed(supabase: any, invoice: any) {
  console.log('Processing payment failure:', invoice.id);

  const subscriptionId = invoice.subscription;
  if (!subscriptionId) return;

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('gateway_subscription_id', subscriptionId);

  if (error) console.error('Error updating subscription:', error);
}

async function handleSubscriptionUpdate(supabase: any, subscription: any) {
  console.log('Processing subscription update:', subscription.id);

  let status = 'active';
  if (subscription.status === 'canceled') status = 'expired';
  else if (subscription.status === 'past_due') status = 'past_due';

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('gateway_subscription_id', subscription.id);

  if (error) console.error('Error updating subscription:', error);
}
