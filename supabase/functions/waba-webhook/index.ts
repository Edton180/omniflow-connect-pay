import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to download media from WhatsApp Cloud API
async function downloadWhatsAppMedia(mediaId: string, accessToken: string): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  try {
    // Step 1: Get media URL
    console.log(`📥 Fetching media URL for ID: ${mediaId}`);
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!mediaResponse.ok) {
      console.error("Failed to get media URL:", await mediaResponse.text());
      return null;
    }

    const mediaInfo = await mediaResponse.json();
    console.log("📍 Media URL obtained:", mediaInfo.url);

    // Step 2: Download media content
    const downloadResponse = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!downloadResponse.ok) {
      console.error("Failed to download media:", await downloadResponse.text());
      return null;
    }

    const buffer = await downloadResponse.arrayBuffer();
    const mimeType = downloadResponse.headers.get("content-type") || "application/octet-stream";

    console.log(`✅ Media downloaded successfully. Size: ${buffer.byteLength} bytes, Type: ${mimeType}`);
    return { buffer, mimeType };
  } catch (error) {
    console.error("Error downloading media:", error);
    return null;
  }
}

// Helper function to get file extension from mime type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/3gpp": "3gp",
    "audio/aac": "aac",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/amr": "amr",
    "audio/ogg": "ogg",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  };
  return mimeMap[mimeType] || "bin";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // GET request - Webhook verification from Meta
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("🔐 WABA webhook verification:", { mode, token });

      // Get verify token from channel_configs
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("config")
        .eq("config_type", "waba")
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        console.error("❌ No active WABA config found");
        return new Response("No active WABA config", { status: 403 });
      }

      const verifyToken = configs[0].config?.verify_token;

      if (mode === "subscribe" && token === verifyToken) {
        console.log("✅ WABA webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // POST request - Process incoming webhook
    const body = await req.json();
    console.log("📨 WABA webhook received:", JSON.stringify(body));

    // Process WhatsApp message
    if (body.entry && body.entry[0]?.changes) {
      for (const change of body.entry[0].changes) {
        if (change.value?.messages) {
          for (const message of change.value.messages) {
            const phoneNumber = message.from;
            const messageText = message.text?.body || message.caption || "";
            const messageType = message.type;
            const phoneNumberId = change.value.metadata?.phone_number_id;

            console.log(`📱 Processing message from ${phoneNumber}, type: ${messageType}`);

            // Get tenant from active WABA channel
            const { data: channels } = await supabaseAdmin
              .from("channels")
              .select("*, config")
              .eq("type", "whatsapp")
              .eq("status", "active")
              .limit(1);

            if (!channels || channels.length === 0) {
              console.log("⚠️ No active WhatsApp channel found");
              continue;
            }

            const channel = channels[0];
            const tenantId = channel.tenant_id;
            const accessToken = channel.config?.access_token;

            // Find or create contact
            let contact;
            const { data: existingContacts } = await supabaseAdmin
              .from("contacts")
              .select("*")
              .eq("tenant_id", tenantId)
              .eq("phone", phoneNumber)
              .maybeSingle();

            if (existingContacts) {
              contact = existingContacts;
              // Update contact metadata with latest profile info
              if (change.value.contacts?.[0]?.profile) {
                await supabaseAdmin
                  .from("contacts")
                  .update({
                    name: change.value.contacts[0].profile.name || contact.name,
                    metadata: {
                      ...contact.metadata,
                      waba_profile: change.value.contacts[0].profile,
                      last_seen: new Date().toISOString(),
                    },
                  })
                  .eq("id", contact.id);
              }
            } else {
              const { data: newContact, error: contactError } = await supabaseAdmin
                .from("contacts")
                .insert({
                  tenant_id: tenantId,
                  name: change.value.contacts?.[0]?.profile?.name || phoneNumber,
                  phone: phoneNumber,
                  metadata: {
                    waba_profile: change.value.contacts?.[0]?.profile,
                    source: "whatsapp",
                    created_via: "waba_webhook",
                  },
                })
                .select()
                .single();

              if (contactError) {
                console.error("❌ Error creating contact:", contactError);
                continue;
              }
              contact = newContact;
              console.log(`✅ New contact created: ${contact.id}`);
            }

            // Find or create ticket
            let ticket;
            const { data: existingTickets } = await supabaseAdmin
              .from("tickets")
              .select("*")
              .eq("contact_id", contact.id)
              .in("status", ["open", "in_progress", "pending"])
              .maybeSingle();

            if (existingTickets) {
              ticket = existingTickets;
              await supabaseAdmin
                .from("tickets")
                .update({ 
                  last_message: messageText || `[${messageType}]`, 
                  updated_at: new Date().toISOString() 
                })
                .eq("id", ticket.id);
            } else {
              const { data: newTicket, error: ticketError } = await supabaseAdmin
                .from("tickets")
                .insert({
                  tenant_id: tenantId,
                  contact_id: contact.id,
                  channel: "whatsapp",
                  status: "open",
                  priority: "medium",
                  last_message: messageText || `[${messageType}]`,
                })
                .select()
                .single();

              if (ticketError) {
                console.error("❌ Error creating ticket:", ticketError);
                continue;
              }
              ticket = newTicket;
              console.log(`✅ New ticket created: ${ticket.id}`);
            }

            // Create message
            const messageData: any = {
              ticket_id: ticket.id,
              contact_id: contact.id,
              content: messageText || `[${messageType}]`,
              is_from_contact: true,
            };

            // Handle media - Download and upload to Supabase Storage
            let mediaId: string | null = null;
            let mediaTypeToProcess: string | null = null;

            if (message.type === "image" && message.image) {
              mediaId = message.image.id;
              mediaTypeToProcess = "image";
              messageData.media_type = "image";
            } else if (message.type === "video" && message.video) {
              mediaId = message.video.id;
              mediaTypeToProcess = "video";
              messageData.media_type = "video";
            } else if (message.type === "audio" && message.audio) {
              mediaId = message.audio.id;
              mediaTypeToProcess = "audio";
              messageData.media_type = "audio";
            } else if (message.type === "document" && message.document) {
              mediaId = message.document.id;
              mediaTypeToProcess = "document";
              messageData.media_type = "document";
              if (message.document.filename) {
                messageData.content = message.document.filename;
              }
            } else if (message.type === "sticker" && message.sticker) {
              mediaId = message.sticker.id;
              mediaTypeToProcess = "sticker";
              messageData.media_type = "image";
            }

            // Download and upload media if present
            if (mediaId && accessToken) {
              console.log(`🔄 Processing ${mediaTypeToProcess} media: ${mediaId}`);
              const mediaResult = await downloadWhatsAppMedia(mediaId, accessToken);

              if (mediaResult) {
                const extension = getExtensionFromMimeType(mediaResult.mimeType);
                const fileName = `${tenantId}/${ticket.id}/${Date.now()}.${extension}`;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                  .from("ticket-media")
                  .upload(fileName, mediaResult.buffer, {
                    contentType: mediaResult.mimeType,
                    cacheControl: "3600",
                  });

                if (uploadError) {
                  console.error("❌ Error uploading media to storage:", uploadError);
                  messageData.media_url = mediaId; // Fallback to media ID
                } else {
                  // Get public URL
                  const { data: publicUrlData } = supabaseAdmin.storage
                    .from("ticket-media")
                    .getPublicUrl(fileName);

                  messageData.media_url = publicUrlData.publicUrl;
                  console.log(`✅ Media uploaded successfully: ${messageData.media_url}`);
                }
              } else {
                // Fallback: store media ID for later retrieval
                messageData.media_url = mediaId;
                console.log("⚠️ Could not download media, storing media ID");
              }
            }

            await supabaseAdmin.from("messages").insert(messageData);
            console.log(`✅ Message saved for ticket ${ticket.id}`);

            // Send auto message if new ticket
            if (!existingTickets) {
              console.log("🤖 New ticket detected, sending welcome message");
              try {
                await supabaseAdmin.functions.invoke("send-auto-message", {
                  body: {
                    channelId: channel.id,
                    contactId: contact.id,
                    ticketId: ticket.id,
                    messageType: "greeting",
                  },
                });
              } catch (autoError) {
                console.error("⚠️ Error sending auto message:", autoError);
              }
            }
          }
        }

        // Handle status updates
        if (change.value?.statuses) {
          for (const status of change.value.statuses) {
            console.log(`📊 Message status update: ${status.id} -> ${status.status}`);
            // Could update message status in database here if needed
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error processing WABA webhook:", error);
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
