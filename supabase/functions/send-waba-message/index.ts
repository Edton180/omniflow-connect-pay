import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WABAButton {
  type: "reply";
  reply: {
    id: string;
    title: string;
  };
}

interface WABASection {
  title: string;
  rows: Array<{
    id: string;
    title: string;
    description?: string;
  }>;
}

interface WABATemplate {
  name: string;
  language: { code: string };
  components?: Array<{
    type: string;
    parameters?: Array<{
      type: string;
      text?: string;
      image?: { link: string };
      document?: { link: string; filename?: string };
      video?: { link: string };
    }>;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      message, 
      phoneNumberId, 
      accessToken, 
      mediaUrl, 
      mediaType, 
      messageId,
      // New advanced features
      type = "text", // text, template, interactive, location, reaction, contacts, sticker
      template, // Template object for HSM
      buttons, // Quick reply buttons (max 3)
      listSections, // List sections for interactive list
      listButtonText, // Button text for list
      headerText, // Header for interactive messages
      footerText, // Footer for interactive messages
      location, // { latitude, longitude, name, address }
      reaction, // { message_id, emoji }
      contacts, // Array of contact objects
      contextMessageId, // For replying to specific message
      previewUrl = false, // Enable link preview
    } = await req.json();

    console.log("📤 WABA send request:", { to, type, message, mediaUrl, mediaType, messageId });

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
          .createSignedUrl(path, 3600);
        
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

    // Add context for reply
    if (contextMessageId) {
      payload.context = { message_id: contextMessageId };
    }

    // Handle different message types
    switch (type) {
      case "template":
        // Template message (HSM)
        payload.type = "template";
        payload.template = {
          name: template?.name,
          language: template?.language || { code: "pt_BR" },
          components: template?.components || [],
        };
        console.log("📋 Sending template message:", template?.name);
        break;

      case "interactive":
        // Interactive message with buttons or list
        if (buttons && buttons.length > 0) {
          // Button message (max 3 buttons)
          payload.type = "interactive";
          payload.interactive = {
            type: "button",
            body: { text: message },
            action: {
              buttons: buttons.slice(0, 3).map((btn: any, i: number) => ({
                type: "reply",
                reply: {
                  id: btn.id || `btn_${i}`,
                  title: btn.title.substring(0, 20), // Max 20 chars
                }
              }))
            }
          };
          if (headerText) {
            payload.interactive.header = { type: "text", text: headerText };
          }
          if (footerText) {
            payload.interactive.footer = { text: footerText };
          }
          console.log("🔘 Sending interactive button message");
        } else if (listSections && listSections.length > 0) {
          // List message
          payload.type = "interactive";
          payload.interactive = {
            type: "list",
            body: { text: message },
            action: {
              button: listButtonText || "Ver opções",
              sections: listSections.map((section: WABASection) => ({
                title: section.title,
                rows: section.rows.map(row => ({
                  id: row.id,
                  title: row.title.substring(0, 24),
                  description: row.description?.substring(0, 72),
                }))
              }))
            }
          };
          if (headerText) {
            payload.interactive.header = { type: "text", text: headerText };
          }
          if (footerText) {
            payload.interactive.footer = { text: footerText };
          }
          console.log("📝 Sending interactive list message");
        }
        break;

      case "location":
        // Location message
        payload.type = "location";
        payload.location = {
          latitude: location?.latitude,
          longitude: location?.longitude,
          name: location?.name || "",
          address: location?.address || "",
        };
        console.log("📍 Sending location");
        break;

      case "reaction":
        // Reaction to message
        payload.type = "reaction";
        payload.reaction = {
          message_id: reaction?.message_id,
          emoji: reaction?.emoji || "👍",
        };
        console.log("😀 Sending reaction:", reaction?.emoji);
        break;

      case "contacts":
        // Contact card(s)
        payload.type = "contacts";
        payload.contacts = contacts || [];
        console.log("👤 Sending contacts");
        break;

      case "sticker":
        // Sticker message
        payload.type = "sticker";
        payload.sticker = { link: finalMediaUrl };
        console.log("😊 Sending sticker");
        break;

      case "read":
        // Mark message as read
        payload = {
          messaging_product: "whatsapp",
          status: "read",
          message_id: contextMessageId,
        };
        console.log("✓ Marking message as read");
        break;

      default:
        // Regular text or media message
        if (finalMediaUrl && mediaType) {
          if (mediaType === "image" || mediaType === "img") {
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
        } else {
          // Text message
          payload.type = "text";
          payload.text = { 
            body: message || "Empty message",
            preview_url: previewUrl,
          };
          console.log("💬 Sending text message");
        }
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
          telegram_message_id: data.messages[0].id // Reusing field for WhatsApp message ID
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
