import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-request-id',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');
    const rawBody = await req.text();

    console.log('MercadoPago webhook received:', xRequestId);

    if (!xSignature || !xRequestId) {
      console.error('Missing MercadoPago headers');
      return new Response('Missing headers', { status: 400, headers: corsHeaders });
    }

    // Get webhook secret from environment
    const webhookSecret = Deno.env.get('MERCADOPAGO_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('MERCADOPAGO_WEBHOOK_SECRET not configured');
      return new Response('Webhook not configured', { status: 500, headers: corsHeaders });
    }

    // Verify MercadoPago signature
    const isValid = await verifyMercadoPagoSignature(
      rawBody,
      xSignature,
      xRequestId,
      webhookSecret
    );

    if (!isValid) {
      console.error('Invalid MercadoPago signature');
      return new Response('Invalid signature', { status: 401, headers: corsHeaders });
    }

    const event = JSON.parse(rawBody);
    console.log('MercadoPago event type:', event.type, 'action:', event.action);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Handle payment notifications
    if (event.type === 'payment') {
      const paymentId = event.data?.id;
      if (!paymentId) {
        console.error('Missing payment ID');
        return new Response('Missing payment ID', { status: 400, headers: corsHeaders });
      }

      // Fetch payment details from MercadoPago API
      const accessToken = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN');
      if (!accessToken) {
        console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
        return new Response('Access token not configured', { status: 500, headers: corsHeaders });
      }

      const paymentResponse = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!paymentResponse.ok) {
        console.error('Failed to fetch payment details');
        return new Response('Failed to fetch payment', { status: 500, headers: corsHeaders });
      }

      const payment = await paymentResponse.json();

      // Process based on payment status
      if (payment.status === 'approved') {
        await handlePaymentApproved(supabase, payment);
      } else if (payment.status === 'rejected') {
        await handlePaymentRejected(supabase, payment);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('MercadoPago webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function verifyMercadoPagoSignature(
  payload: string,
  signature: string,
  requestId: string,
  secret: string
): Promise<boolean> {
  try {
    // MercadoPago signature format: ts=timestamp,v1=hash
    const parts = signature.split(',');
    const ts = parts.find(p => p.startsWith('ts='))?.split('=')[1];
    const v1 = parts.find(p => p.startsWith('v1='))?.split('=')[1];

    if (!ts || !v1) return false;

    // Create manifest: id + ts + payload
    const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
    const dataToSign = manifest + payload;

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
      encoder.encode(dataToSign)
    );

    const expectedHash = Array.from(new Uint8Array(signature_bytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return expectedHash === v1;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

async function handlePaymentApproved(supabase: any, payment: any) {
  console.log('Processing MercadoPago payment approved:', payment.id);

  const metadata = payment.metadata || {};
  const tenantId = metadata.tenant_id || payment.payer?.id;

  if (!tenantId) {
    console.log('No tenant_id found, skipping');
    return;
  }

  // Idempotency check
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('gateway_payment_id', payment.id.toString())
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
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'completed',
      payment_gateway: 'mercadopago',
      payment_method: payment.payment_type_id || payment.payment_method_id,
      gateway_payment_id: payment.id.toString(),
      paid_at: payment.date_approved || new Date().toISOString(),
      gateway_response: {
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
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

async function handlePaymentRejected(supabase: any, payment: any) {
  console.log('Processing MercadoPago payment rejection:', payment.id);

  // Update payment status if exists
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      gateway_response: {
        payment_id: payment.id,
        status: payment.status,
        status_detail: payment.status_detail,
      },
    })
    .eq('gateway_payment_id', payment.id.toString());

  if (error) {
    console.error('Error updating payment:', error);
  } else {
    console.log('Payment marked as failed');
  }

  // Update checkout session
  const { data: checkoutSession } = await supabase
    .from('checkout_sessions')
    .select('id')
    .eq('external_id', payment.id.toString())
    .maybeSingle();

  if (checkoutSession) {
    await supabase
      .from('checkout_sessions')
      .update({ status: 'failed' })
      .eq('id', checkoutSession.id);
    console.log('Checkout session marked as failed');
  }
}
