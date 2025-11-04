import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, phoneNumberId, accessToken, mediaUrl, mediaType, messageId } = await req.json();

    console.log("📤 WABA send request:", { to, message, mediaUrl, mediaType, messageId });

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Missing required field: to" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Update message status to sending
    if (messageId) {
      await supabaseAdmin
        .from("messages")
        .update({ status: "sending" })
        .eq("id", messageId);
    }

    // Get credentials from channel_configs if not provided
    let wabaPhoneId = phoneNumberId;
    let wabaAccessToken = accessToken;

    if (!wabaPhoneId || !wabaAccessToken) {
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_key_encrypted, config")
        .eq("config_type", "waba")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        if (messageId) {
          await supabaseAdmin.from("messages").update({ status: "failed" }).eq("id", messageId);
        }
        return new Response(
          JSON.stringify({ error: "WABA not configured" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      wabaAccessToken = configs[0].api_key_encrypted;
      wabaPhoneId = configs[0].config?.phone_number_id;
    }

    // Create signed URL if from Supabase Storage
    let finalMediaUrl = mediaUrl;
    if (mediaUrl && mediaUrl.includes('supabase.co/storage')) {
      try {
        const urlParts = mediaUrl.split('/');
        const bucketIndex = urlParts.findIndex((part: string) => part === 'object') + 2;
        const bucket = urlParts[bucketIndex];
        const path = urlParts.slice(bucketIndex + 1).join('/');
        
        const { data: signedData, error: signError } = await supabaseAdmin.storage
          .from(bucket)
          .createSignedUrl(path, 3600); // 1 hour
        
        if (!signError && signedData?.signedUrl) {
          finalMediaUrl = signedData.signedUrl;
          console.log("✅ Signed URL created for media");
        }
      } catch (signErr) {
        console.error("⚠️ Error creating signed URL, using original:", signErr);
      }
    }

    // Build payload
    let payload: any = {
      messaging_product: "whatsapp",
      to: to,
    };

    // Determine message type
    if (!finalMediaUrl || !mediaType) {
      payload.type = "text";
      payload.text = { body: message || "Mensagem sem conteúdo" };
      console.log("💬 Sending text message");
    } else if (mediaType === "image" || mediaType === "img") {
      payload.type = "image";
      payload.image = { link: finalMediaUrl };
      if (message) payload.image.caption = message;
      console.log("🖼️ Sending image");
    } else if (mediaType === "audio" || mediaType === "voice") {
      payload.type = "audio";
      payload.audio = { link: finalMediaUrl };
      console.log("🎵 Sending audio");
    } else if (mediaType === "video") {
      payload.type = "video";
      payload.video = { link: finalMediaUrl };
      if (message) payload.video.caption = message;
      console.log("🎥 Sending video");
    } else {
      payload.type = "document";
      payload.document = { link: finalMediaUrl };
      if (message) payload.document.caption = message;
      console.log("📄 Sending document");
    }

    console.log("🚀 Sending to WABA:", JSON.stringify(payload, null, 2));

    // Send message via WABA
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${wabaPhoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${wabaAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ WABA API error:", data);
      if (messageId) {
        await supabaseAdmin.from("messages").update({ status: "failed" }).eq("id", messageId);
      }
      return new Response(
        JSON.stringify({ error: data.error?.message || "Failed to send message", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ WABA message sent successfully:", data);

    // Update message status to sent
    if (messageId && data.messages?.[0]?.id) {
      await supabaseAdmin
        .from("messages")
        .update({ 
          status: "sent",
          telegram_message_id: data.messages[0].id // Store WhatsApp message ID
        })
        .eq("id", messageId);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error sending WABA message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
