import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TelegramButton {
  text: string;
  callback_data?: string;
  url?: string;
}

interface TelegramLocation {
  latitude: number;
  longitude: number;
}

interface TelegramContact {
  phone_number: string;
  first_name: string;
  last_name?: string;
}

interface TelegramPoll {
  question: string;
  options: string[];
  is_anonymous?: boolean;
  type?: "regular" | "quiz";
  allows_multiple_answers?: boolean;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      chatId, 
      message, 
      botToken, 
      mediaUrl, 
      mediaType,
      messageId,
      // New advanced features
      type = "text", // text, location, contact, poll, forward, action
      buttons, // Inline keyboard buttons
      replyKeyboard, // Reply keyboard
      location, // { latitude, longitude }
      contact, // { phone_number, first_name, last_name }
      poll, // { question, options, is_anonymous, type }
      forwardFromChatId, // For forwarding messages
      forwardMessageId,
      action, // typing, upload_photo, upload_video, etc.
      replyToMessageId, // Reply to specific message
      parseMode = "HTML",
    } = await req.json();

    console.log("📤 Telegram request:", { chatId, type, message, mediaUrl, mediaType });

    if (!chatId) {
      return new Response(
        JSON.stringify({ error: "Missing required field: chatId" }),
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

    // Get bot token from channel_configs if not provided
    let telegramBotToken = botToken;

    if (!telegramBotToken) {
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("api_key_encrypted, config")
        .eq("config_type", "telegram")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        // Try from channels table
        const { data: channels } = await supabaseAdmin
          .from("channels")
          .select("config")
          .eq("type", "telegram")
          .eq("status", "active")
          .limit(1);

        if (channels && channels.length > 0) {
          telegramBotToken = channels[0].config?.bot_token;
        }
      } else {
        telegramBotToken = configs[0].config?.bot_token || configs[0].api_key_encrypted;
      }
    }

    if (!telegramBotToken) {
      if (messageId) {
        await supabaseAdmin.from("messages").update({ status: "failed" }).eq("id", messageId);
      }
      return new Response(
        JSON.stringify({ error: "Telegram not configured - bot token not found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auto-assignment logic
    const authHeader = req.headers.get("authorization");
    let sendingUserId = null;
    
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        sendingUserId = userData?.user?.id;
        console.log("👤 Message sent by user:", sendingUserId);
      } catch (err) {
        console.log("⚠️ Could not identify user:", err);
      }
    }

    // Auto-assign unassigned tickets
    if (sendingUserId) {
      try {
        const { data: contacts } = await supabaseAdmin
          .from("contacts")
          .select("id, tenant_id")
          .or(`phone.eq.${chatId},metadata->>telegram_chat_id.eq.${chatId}`);

        const contactData = contacts?.[0];

        if (contactData) {
          const { data: unassignedTickets } = await supabaseAdmin
            .from("tickets")
            .select("id, assigned_to")
            .eq("contact_id", contactData.id)
            .eq("tenant_id", contactData.tenant_id)
            .in("status", ["open", "pending"])
            .is("assigned_to", null);

          if (unassignedTickets && unassignedTickets.length > 0) {
            for (const ticket of unassignedTickets) {
              await supabaseAdmin
                .from("tickets")
                .update({ 
                  assigned_to: sendingUserId,
                  status: "open"
                })
                .eq("id", ticket.id);
              
              console.log(`✅ Ticket ${ticket.id} auto-assigned to agent ${sendingUserId}`);
            }
          }
        }
      } catch (err) {
        console.error("⚠️ Error in auto-assignment:", err);
      }
    }

    // Create signed URL for Supabase Storage media
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
        console.error("⚠️ Error creating signed URL:", signErr);
      }
    }

    let endpoint = "";
    let body: any = { chat_id: chatId };

    // Add reply_to_message_id if provided
    if (replyToMessageId) {
      body.reply_to_message_id = replyToMessageId;
    }

    // Build inline keyboard if buttons provided
    if (buttons && Array.isArray(buttons) && buttons.length > 0) {
      body.reply_markup = JSON.stringify({
        inline_keyboard: buttons.map((row: TelegramButton[] | TelegramButton) => {
          if (Array.isArray(row)) {
            return row.map(btn => ({
              text: btn.text,
              callback_data: btn.url ? undefined : (btn.callback_data || btn.text),
              url: btn.url,
            }));
          }
          return [{
            text: row.text,
            callback_data: row.url ? undefined : (row.callback_data || row.text),
            url: row.url,
          }];
        })
      });
    }

    // Build reply keyboard if provided
    if (replyKeyboard && Array.isArray(replyKeyboard)) {
      body.reply_markup = JSON.stringify({
        keyboard: replyKeyboard,
        resize_keyboard: true,
        one_time_keyboard: true,
      });
    }

    // Handle different message types
    switch (type) {
      case "action":
        // Send chat action (typing, upload_photo, etc.)
        endpoint = "sendChatAction";
        body.action = action || "typing";
        console.log("⌨️ Sending chat action:", body.action);
        break;

      case "location":
        // Send location
        endpoint = "sendLocation";
        body.latitude = location?.latitude;
        body.longitude = location?.longitude;
        console.log("📍 Sending location");
        break;

      case "contact":
        // Send contact
        endpoint = "sendContact";
        body.phone_number = contact?.phone_number;
        body.first_name = contact?.first_name;
        if (contact?.last_name) body.last_name = contact.last_name;
        console.log("👤 Sending contact");
        break;

      case "poll":
        // Send poll
        endpoint = "sendPoll";
        body.question = poll?.question;
        body.options = JSON.stringify(poll?.options || []);
        if (poll?.is_anonymous !== undefined) body.is_anonymous = poll.is_anonymous;
        if (poll?.type) body.type = poll.type;
        if (poll?.allows_multiple_answers) body.allows_multiple_answers = poll.allows_multiple_answers;
        console.log("📊 Sending poll");
        break;

      case "forward":
        // Forward message
        endpoint = "forwardMessage";
        body.from_chat_id = forwardFromChatId;
        body.message_id = forwardMessageId;
        console.log("↗️ Forwarding message");
        break;

      case "voice":
        // Send voice message
        endpoint = "sendVoice";
        body.voice = finalMediaUrl;
        if (message) body.caption = message;
        console.log("🎤 Sending voice message");
        break;

      case "video_note":
        // Send video note (round video)
        endpoint = "sendVideoNote";
        body.video_note = finalMediaUrl;
        console.log("🔵 Sending video note");
        break;

      default:
        // Handle media or text
        if (finalMediaUrl && mediaType) {
          if (mediaType === "image" || mediaType === "img" || mediaType === "photo") {
            endpoint = "sendPhoto";
            body.photo = finalMediaUrl;
            if (message) body.caption = message;
            console.log("🖼️ Sending photo");
          } else if (mediaType === "video") {
            endpoint = "sendVideo";
            body.video = finalMediaUrl;
            if (message) body.caption = message;
            console.log("🎥 Sending video");
          } else if (mediaType === "audio") {
            endpoint = "sendAudio";
            body.audio = finalMediaUrl;
            if (message) body.caption = message;
            console.log("🎵 Sending audio");
          } else if (mediaType === "voice") {
            endpoint = "sendVoice";
            body.voice = finalMediaUrl;
            if (message) body.caption = message;
            console.log("🎤 Sending voice");
          } else if (mediaType === "sticker") {
            endpoint = "sendSticker";
            body.sticker = finalMediaUrl;
            console.log("😊 Sending sticker");
          } else if (mediaType === "animation" || mediaType === "gif") {
            endpoint = "sendAnimation";
            body.animation = finalMediaUrl;
            if (message) body.caption = message;
            console.log("🎬 Sending animation");
          } else {
            endpoint = "sendDocument";
            body.document = finalMediaUrl;
            if (message) body.caption = message;
            console.log("📄 Sending document");
          }
        } else {
          // Text message
          endpoint = "sendMessage";
          body.text = message || "Empty message";
          body.parse_mode = parseMode;
          console.log("💬 Sending text message");
        }
    }

    console.log(`🚀 Sending to Telegram via ${endpoint}:`, JSON.stringify(body, null, 2));

    const response = await fetch(
      `https://api.telegram.org/bot${telegramBotToken}/${endpoint}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Telegram API error:", data);
      if (messageId) {
        await supabaseAdmin.from("messages").update({ status: "failed" }).eq("id", messageId);
      }
      return new Response(
        JSON.stringify({ error: data.description || "Failed to send message", details: data, success: false }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("✅ Telegram message sent successfully:", data);

    // Update message status to sent
    if (messageId && data.result?.message_id) {
      await supabaseAdmin
        .from("messages")
        .update({ 
          status: "sent",
          telegram_message_id: data.result.message_id
        })
        .eq("id", messageId);
    }

    return new Response(JSON.stringify({ 
      ...data, 
      success: true,
      telegram_message_id: data.result?.message_id 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error sending Telegram message:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
