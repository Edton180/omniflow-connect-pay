import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuickReply {
  content_type: "text" | "user_phone_number" | "user_email";
  title?: string;
  payload?: string;
  image_url?: string;
}

interface TemplateButton {
  type: "web_url" | "postback" | "phone_number";
  title: string;
  url?: string;
  payload?: string;
}

interface GenericElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: {
    type: string;
    url: string;
    webview_height_ratio?: string;
  };
  buttons?: TemplateButton[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      recipientId, 
      message, 
      platform = "facebook", // facebook or instagram
      pageAccessToken,
      messageId,
      // New advanced features
      type = "text", // text, template, media, action
      quickReplies, // Array of quick reply options
      templateType, // button, generic, receipt, airline
      buttons, // For button template
      elements, // For generic template (carousel)
      mediaUrl,
      mediaType, // image, video, audio, file
      action, // mark_seen, typing_on, typing_off
      tag, // Message tag for sending outside 24h window
      notificationType = "REGULAR", // REGULAR, SILENT_PUSH, NO_PUSH
    } = await req.json();

    console.log("📤 Facebook/Instagram message request:", { recipientId, platform, type, message });

    if (!recipientId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: recipientId" }),
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
    let accessToken = pageAccessToken;

    if (!accessToken) {
      const configType = platform === "instagram" ? "instagram" : "facebook";
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_key_encrypted")
        .eq("config_type", configType)
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        if (messageId) {
          await supabaseAdmin.from("messages").update({ status: "failed" }).eq("id", messageId);
        }
        return new Response(
          JSON.stringify({ error: `${platform} not configured` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      accessToken = configs[0].api_key_encrypted;
    }

    // Build message payload
    let messagePayload: any = {
      recipient: { id: recipientId },
      notification_type: notificationType,
    };

    // Add message tag if provided
    if (tag) {
      messagePayload.messaging_type = "MESSAGE_TAG";
      messagePayload.tag = tag;
    } else {
      messagePayload.messaging_type = "RESPONSE";
    }

    // Handle different message types
    switch (type) {
      case "action":
        // Sender action (typing indicator, mark as read)
        messagePayload = {
          recipient: { id: recipientId },
          sender_action: action || "typing_on",
        };
        console.log("⌨️ Sending sender action:", action);
        break;

      case "template":
        if (templateType === "button") {
          // Button template
          messagePayload.message = {
            attachment: {
              type: "template",
              payload: {
                template_type: "button",
                text: message,
                buttons: (buttons || []).slice(0, 3).map((btn: TemplateButton) => ({
                  type: btn.type || "postback",
                  title: btn.title,
                  url: btn.url,
                  payload: btn.payload || btn.title,
                })),
              },
            },
          };
          console.log("🔘 Sending button template");
        } else if (templateType === "generic") {
          // Generic template (carousel)
          messagePayload.message = {
            attachment: {
              type: "template",
              payload: {
                template_type: "generic",
                elements: (elements || []).slice(0, 10).map((el: GenericElement) => ({
                  title: el.title,
                  subtitle: el.subtitle,
                  image_url: el.image_url,
                  default_action: el.default_action,
                  buttons: el.buttons?.slice(0, 3),
                })),
              },
            },
          };
          console.log("🎠 Sending generic template (carousel)");
        }
        break;

      case "media":
        // Media message
        let attachmentType = mediaType === "file" ? "file" : mediaType;
        if (!["image", "video", "audio", "file"].includes(attachmentType)) {
          attachmentType = "file";
        }
        
        messagePayload.message = {
          attachment: {
            type: attachmentType,
            payload: {
              url: mediaUrl,
              is_reusable: true,
            },
          },
        };
        console.log(`📎 Sending ${attachmentType} media`);
        break;

      default:
        // Text message with optional quick replies
        messagePayload.message = {
          text: message,
        };

        // Add quick replies if provided
        if (quickReplies && quickReplies.length > 0) {
          messagePayload.message.quick_replies = quickReplies.slice(0, 13).map((qr: QuickReply) => ({
            content_type: qr.content_type || "text",
            title: qr.title?.substring(0, 20),
            payload: qr.payload || qr.title,
            image_url: qr.image_url,
          }));
          console.log("💬 Sending text with quick replies");
        } else {
          console.log("💬 Sending text message");
        }
    }

    // Determine endpoint based on platform
    const endpoint = `https://graph.facebook.com/v18.0/me/messages`;

    console.log("🚀 Sending to Facebook/Instagram:", JSON.stringify(messagePayload, null, 2));

    const response = await fetch(`${endpoint}?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messagePayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ ${platform} API error:`, data);
      if (messageId) {
        await supabaseAdmin.from("messages").update({ status: "failed" }).eq("id", messageId);
      }
      return new Response(
        JSON.stringify({ error: data.error?.message || "Failed to send message", details: data }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`✅ ${platform} message sent successfully:`, data);

    // Update message status to sent
    if (messageId && data.message_id) {
      await supabaseAdmin
        .from("messages")
        .update({ 
          status: "sent",
          telegram_message_id: parseInt(data.message_id) // Reusing field
        })
        .eq("id", messageId);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error sending message:", error);
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
