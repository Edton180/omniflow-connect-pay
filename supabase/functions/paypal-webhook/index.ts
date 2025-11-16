import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-transmission-time, paypal-transmission-sig, paypal-cert-url, paypal-auth-algo',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PayPal webhook received');
    
    const event = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured');
      return new Response(JSON.stringify({ error: 'Webhook not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify PayPal signature
    const isValid = await verifyPayPalSignature(req, event, webhookId);
    if (!isValid) {
      console.error('Invalid PayPal signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('PayPal event type:', event.event_type, 'resource type:', event.resource_type);

    // Process different event types
    switch (event.event_type) {
      case 'PAYMENT.CAPTURE.COMPLETED':
      case 'CHECKOUT.ORDER.APPROVED':
        await handlePaymentSuccess(supabase, event.resource);
        break;
      
      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
      case 'CHECKOUT.ORDER.VOIDED':
        await handlePaymentFailure(supabase, event.resource);
        break;
      
      default:
        console.log('Unhandled PayPal event type:', event.event_type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('PayPal webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyPayPalSignature(req: Request, event: any, webhookId: string): Promise<boolean> {
  try {
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      console.error('Missing PayPal signature headers');
      return false;
    }

    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET');
    const mode = Deno.env.get('PAYPAL_MODE') || 'sandbox';
    const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

    // Get access token
    const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    // Verify webhook signature
    const verifyResponse = await fetch(`${baseUrl}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: webhookId,
        webhook_event: event,
      }),
    });

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('Error verifying PayPal signature:', error);
    return false;
  }
}

async function handlePaymentSuccess(supabase: any, resource: any) {
  console.log('Processing PayPal payment success:', resource.id);

  const metadata = resource.custom_id ? JSON.parse(resource.custom_id) : {};
  const tenantId = metadata.tenant_id;
  const invoiceId = metadata.invoice_id;
  const checkoutSessionId = metadata.checkout_session_id;

  if (!tenantId) {
    console.error('No tenant_id in PayPal metadata');
    return;
  }

  // Check for duplicate payment
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_payment_id', resource.id)
    .maybeSingle();

  if (existingPayment) {
    console.log('Payment already processed:', resource.id);
    return;
  }

  // Get amount from capture or order
  const amount = resource.amount?.value || resource.purchase_units?.[0]?.amount?.value;
  const currency = resource.amount?.currency_code || resource.purchase_units?.[0]?.amount?.currency_code;

  // Insert payment record
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      amount: parseFloat(amount),
      currency: currency,
      payment_gateway: 'paypal',
      gateway_payment_id: resource.id,
      status: 'paid',
      paid_at: new Date().toISOString(),
      gateway_response: resource,
      customer_name: resource.payer?.name?.given_name + ' ' + resource.payer?.name?.surname,
      customer_email: resource.payer?.email_address,
      payment_method: 'paypal',
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Error inserting payment:', paymentError);
    throw paymentError;
  }

  console.log('Payment recorded:', payment.id);

  // Update checkout session if exists
  if (checkoutSessionId) {
    await supabase
      .from('checkout_sessions')
      .update({ 
        status: 'completed',
        metadata: { ...metadata, payment_id: payment.id }
      })
      .eq('id', checkoutSessionId);
  }

  // Process invoice payment if invoice_id exists
  if (invoiceId) {
    const { data: result, error: rpcError } = await supabase.rpc('process_invoice_payment', {
      p_invoice_id: invoiceId,
      p_payment_id: payment.id,
      p_gateway: 'paypal',
      p_gateway_payment_id: resource.id,
    });

    if (rpcError) {
      console.error('Error processing invoice payment:', rpcError);
    } else {
      console.log('Invoice payment processed:', result);
    }
  }
}

async function handlePaymentFailure(supabase: any, resource: any) {
  console.log('Processing PayPal payment failure:', resource.id);

  // Update payment status if exists
  const { error: updateError } = await supabase
    .from('payments')
    .update({ 
      status: 'failed',
      failure_reason: resource.status_details?.reason || 'Payment failed',
    })
    .eq('gateway_payment_id', resource.id);

  if (updateError) {
    console.error('Error updating payment:', updateError);
  }

  // Update checkout session
  const { data: session } = await supabase
    .from('checkout_sessions')
    .select('id')
    .eq('external_id', resource.id)
    .maybeSingle();

  if (session) {
    await supabase
      .from('checkout_sessions')
      .update({ status: 'failed' })
      .eq('id', session.id);
  }
}
