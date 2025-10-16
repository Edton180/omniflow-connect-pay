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
  console.log('Processing approved payment:', payment.id);

  const { metadata } = payment;
  if (!metadata?.tenant_id) {
    console.log('No tenant_id in metadata, skipping');
    return;
  }

  // Idempotency check: verify payment hasn't been processed
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
  const { error } = await supabase
    .from('payments')
    .insert({
      tenant_id: metadata.tenant_id,
      subscription_id: metadata.subscription_id || null,
      amount: payment.transaction_amount,
      currency: payment.currency_id,
      status: 'completed',
      payment_gateway: 'mercadopago',
      payment_method: payment.payment_type_id,
      gateway_payment_id: payment.id.toString(),
      paid_at: payment.date_approved || new Date().toISOString(),
      gateway_response: payment,
    });

  if (error) {
    console.error('Error creating payment:', error);
    throw error;
  }

  // If there's an invoice, mark it as paid
  if (metadata.invoice_id) {
    await supabase.rpc('process_invoice_payment', {
      invoice_id_param: metadata.invoice_id
    });
  }

  // If there's a catalog order, mark it as paid
  if (metadata.order_id) {
    await supabase.rpc('process_catalog_order_payment', {
      order_id_param: metadata.order_id
    });
  }
}

async function handlePaymentRejected(supabase: any, payment: any) {
  console.log('Processing rejected payment:', payment.id);

  const { metadata } = payment;
  if (!metadata?.tenant_id) return;

  // Update payment status
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      gateway_response: payment,
    })
    .eq('gateway_payment_id', payment.id.toString());

  if (error) console.error('Error updating payment:', error);
}
