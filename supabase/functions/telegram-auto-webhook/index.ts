import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { botToken, customDomain } = await req.json();

    if (!botToken) {
      throw new Error('Bot token is required');
    }

    // Get current domain or use custom domain
    const webhookUrl = customDomain 
      ? `https://${customDomain}/api/telegram-webhook`
      : `${supabaseUrl}/functions/v1/telegram-webhook`;

    console.log('Setting webhook URL:', webhookUrl);

    // Set webhook with Telegram Bot API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: true,
        }),
      }
    );

    const result = await telegramResponse.json();
    console.log('Telegram API response:', result);

    if (!result.ok) {
      throw new Error(`Telegram API error: ${result.description}`);
    }

    // Get webhook info to confirm
    const infoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const webhookInfo = await infoResponse.json();
    console.log('Webhook info:', webhookInfo);

    return new Response(
      JSON.stringify({
        success: true,
        webhookUrl,
        webhookInfo: webhookInfo.result,
        message: 'Webhook configurado com sucesso',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error setting webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});