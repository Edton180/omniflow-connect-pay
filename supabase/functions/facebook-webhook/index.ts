import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GRAPH_API_VERSION = "v18.0";

// Helper function to download media from Facebook/Instagram
async function downloadFacebookMedia(url: string, accessToken: string): Promise<{ buffer: ArrayBuffer; mimeType: string } | null> {
  try {
    console.log(`📥 Downloading media from: ${url}`);
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to download media:", await response.text());
      return null;
    }

    const buffer = await response.arrayBuffer();
    const mimeType = response.headers.get("content-type") || "application/octet-stream";

    console.log(`✅ Media downloaded. Size: ${buffer.byteLength} bytes, Type: ${mimeType}`);
    return { buffer, mimeType };
  } catch (error) {
    console.error("Error downloading media:", error);
    return null;
  }
}

// Get file extension from mime type
function getExtensionFromMimeType(mimeType: string): string {
  const mimeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "audio/mpeg": "mp3",
    "audio/aac": "aac",
  };
  return mimeMap[mimeType] || "bin";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // GET request - Webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      console.log("🔐 Facebook webhook verification:", { mode, token });

      // Get verify token from channel_configs
      const { data: configs } = await supabaseAdmin
        .from("channel_configs")
        .select("config")
        .in("config_type", ["facebook", "instagram"])
        .eq("is_active", true)
        .limit(1);

      if (!configs || configs.length === 0) {
        console.error("❌ No active Facebook/Instagram config found");
        return new Response("No active config", { status: 403 });
      }

      const verifyToken = configs[0].config?.verify_token;

      if (mode === "subscribe" && token === verifyToken) {
        console.log("✅ Facebook webhook verified successfully");
        return new Response(challenge, { status: 200 });
      }

      return new Response("Forbidden", { status: 403 });
    }

    // POST request - Process webhook
    const body = await req.json();
    console.log("📨 Facebook webhook received:", JSON.stringify(body));

    if (body.entry) {
      for (const entry of body.entry) {
        // Process Messenger messages
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message) {
              await processMessengerMessage(supabaseAdmin, event, "facebook");
            }
            // Handle message delivery and read receipts
            if (event.delivery) {
              console.log("📬 Message delivered:", event.delivery.mids);
            }
            if (event.read) {
              console.log("👁️ Message read at:", event.read.watermark);
            }
          }
        }

        // Process Instagram messages (Graph API v18.0 format)
        if (entry.changes) {
          for (const change of entry.changes) {
            if (change.field === "messages" && change.value) {
              await processInstagramMessage(supabaseAdmin, change.value);
            }
            // Handle other Instagram events
            if (change.field === "comments") {
              console.log("💬 Instagram comment received:", change.value);
            }
            if (change.field === "mentions") {
              console.log("📢 Instagram mention received:", change.value);
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("❌ Error processing Facebook webhook:", error);
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

async function processMessengerMessage(supabaseAdmin: any, event: any, channelType: string) {
  const senderId = event.sender.id;
  const messageText = event.message.text || "";
  const attachments = event.message.attachments || [];

  console.log(`📱 Processing Messenger message from ${senderId}`);

  // Get active channel
  const { data: channels } = await supabaseAdmin
    .from("channels")
    .select("*, config")
    .eq("type", channelType)
    .eq("status", "active")
    .limit(1);

  if (!channels || channels.length === 0) {
    console.log(`⚠️ No active ${channelType} channel found`);
    return;
  }

  const channel = channels[0];
  const tenantId = channel.tenant_id;
  const accessToken = channel.config?.page_access_token;

  // Fetch user profile from Facebook Graph API
  let userName = `Messenger User ${senderId}`;
  let profilePicture: string | undefined;
  
  if (accessToken) {
    try {
      const profileResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${senderId}?fields=name,profile_pic&access_token=${accessToken}`
      );
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        userName = profileData.name || userName;
        profilePicture = profileData.profile_pic;
        console.log(`👤 User profile fetched: ${userName}`);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  }

  // Find or create contact
  let contact;
  const { data: existingContacts } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("metadata->>messenger_id", senderId)
    .maybeSingle();

  if (existingContacts) {
    contact = existingContacts;
    // Update contact info if profile picture changed
    if (profilePicture && contact.avatar_url !== profilePicture) {
      await supabaseAdmin
        .from("contacts")
        .update({
          name: userName,
          avatar_url: profilePicture,
          metadata: {
            ...contact.metadata,
            last_seen: new Date().toISOString(),
          },
        })
        .eq("id", contact.id);
    }
  } else {
    const { data: newContact } = await supabaseAdmin
      .from("contacts")
      .insert({
        tenant_id: tenantId,
        name: userName,
        avatar_url: profilePicture,
        metadata: {
          messenger_id: senderId,
          source: "messenger",
          created_via: "facebook_webhook",
        },
      })
      .select()
      .single();
    contact = newContact;
    console.log(`✅ New contact created: ${contact?.id}`);
  }

  if (!contact) return;

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
      .update({ last_message: messageText || "[attachment]", updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
  } else {
    const { data: newTicket } = await supabaseAdmin
      .from("tickets")
      .insert({
        tenant_id: tenantId,
        contact_id: contact.id,
        channel: channelType,
        status: "open",
        priority: "medium",
        last_message: messageText || "[attachment]",
      })
      .select()
      .single();
    ticket = newTicket;
    console.log(`✅ New ticket created: ${ticket?.id}`);
  }

  if (!ticket) return;

  // Process text message
  if (messageText) {
    await supabaseAdmin.from("messages").insert({
      ticket_id: ticket.id,
      contact_id: contact.id,
      content: messageText,
      is_from_contact: true,
    });
  }

  // Process attachments
  for (const attachment of attachments) {
    const messageData: any = {
      ticket_id: ticket.id,
      contact_id: contact.id,
      content: attachment.type === "fallback" ? attachment.title || "[attachment]" : `[${attachment.type}]`,
      is_from_contact: true,
    };

    if (attachment.type === "image" && attachment.payload?.url) {
      messageData.media_type = "image";
      
      // Download and upload image
      if (accessToken) {
        const mediaResult = await downloadFacebookMedia(attachment.payload.url, accessToken);
        if (mediaResult) {
          const extension = getExtensionFromMimeType(mediaResult.mimeType);
          const fileName = `${tenantId}/${ticket.id}/${Date.now()}.${extension}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from("ticket-media")
            .upload(fileName, mediaResult.buffer, {
              contentType: mediaResult.mimeType,
            });

          if (!uploadError) {
            const { data: publicUrlData } = supabaseAdmin.storage
              .from("ticket-media")
              .getPublicUrl(fileName);
            messageData.media_url = publicUrlData.publicUrl;
          } else {
            messageData.media_url = attachment.payload.url;
          }
        } else {
          messageData.media_url = attachment.payload.url;
        }
      } else {
        messageData.media_url = attachment.payload.url;
      }
    } else if (attachment.type === "video" && attachment.payload?.url) {
      messageData.media_type = "video";
      messageData.media_url = attachment.payload.url;
    } else if (attachment.type === "audio" && attachment.payload?.url) {
      messageData.media_type = "audio";
      messageData.media_url = attachment.payload.url;
    } else if (attachment.type === "file" && attachment.payload?.url) {
      messageData.media_type = "document";
      messageData.media_url = attachment.payload.url;
    } else if (attachment.type === "location" && attachment.payload?.coordinates) {
      messageData.content = `📍 Location: ${attachment.payload.coordinates.lat}, ${attachment.payload.coordinates.long}`;
    }

    await supabaseAdmin.from("messages").insert(messageData);
    console.log(`✅ Attachment saved: ${attachment.type}`);
  }

  console.log(`✅ ${channelType} message processed for ticket ${ticket.id}`);

  // Send auto message for new tickets
  if (!existingTickets) {
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

async function processInstagramMessage(supabaseAdmin: any, value: any) {
  // Instagram messaging webhook format (Graph API v18.0)
  const senderId = value.sender?.id || value.from?.id;
  const messageText = value.message?.text || "";
  const attachments = value.message?.attachments || [];

  if (!senderId) {
    console.log("⚠️ No sender ID in Instagram message");
    return;
  }

  console.log(`📸 Processing Instagram message from ${senderId}`);

  // Get active Instagram channel
  const { data: channels } = await supabaseAdmin
    .from("channels")
    .select("*, config")
    .eq("type", "instagram")
    .eq("status", "active")
    .limit(1);

  if (!channels || channels.length === 0) {
    console.log("⚠️ No active Instagram channel found");
    return;
  }

  const channel = channels[0];
  const tenantId = channel.tenant_id;
  const accessToken = channel.config?.access_token;

  // Fetch Instagram user info
  let userName = value.from?.username || `Instagram User ${senderId}`;
  let profilePicture: string | undefined;

  if (accessToken) {
    try {
      const userResponse = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${senderId}?fields=name,username,profile_pic&access_token=${accessToken}`
      );
      if (userResponse.ok) {
        const userData = await userResponse.json();
        userName = userData.name || userData.username || userName;
        profilePicture = userData.profile_pic;
        console.log(`👤 Instagram user info: ${userName}`);
      }
    } catch (error) {
      console.error("Failed to fetch Instagram user info:", error);
    }
  }

  // Find or create contact
  let contact;
  const { data: existingContacts } = await supabaseAdmin
    .from("contacts")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("metadata->>instagram_id", senderId)
    .maybeSingle();

  if (existingContacts) {
    contact = existingContacts;
  } else {
    const { data: newContact } = await supabaseAdmin
      .from("contacts")
      .insert({
        tenant_id: tenantId,
        name: userName,
        avatar_url: profilePicture,
        metadata: {
          instagram_id: senderId,
          instagram_username: value.from?.username,
          source: "instagram",
          created_via: "instagram_webhook",
        },
      })
      .select()
      .single();
    contact = newContact;
    console.log(`✅ New Instagram contact created: ${contact?.id}`);
  }

  if (!contact) return;

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
      .update({ last_message: messageText || "[attachment]", updated_at: new Date().toISOString() })
      .eq("id", ticket.id);
  } else {
    const { data: newTicket } = await supabaseAdmin
      .from("tickets")
      .insert({
        tenant_id: tenantId,
        contact_id: contact.id,
        channel: "instagram",
        status: "open",
        priority: "medium",
        last_message: messageText || "[attachment]",
      })
      .select()
      .single();
    ticket = newTicket;
    console.log(`✅ New Instagram ticket created: ${ticket?.id}`);
  }

  if (!ticket) return;

  // Create text message
  if (messageText) {
    await supabaseAdmin.from("messages").insert({
      ticket_id: ticket.id,
      contact_id: contact.id,
      content: messageText,
      is_from_contact: true,
    });
  }

  // Process Instagram attachments (stories, reels, posts, images)
  for (const attachment of attachments) {
    const messageData: any = {
      ticket_id: ticket.id,
      contact_id: contact.id,
      content: `[${attachment.type}]`,
      is_from_contact: true,
    };

    if (attachment.type === "image" || attachment.type === "story_mention") {
      messageData.media_type = "image";
      messageData.media_url = attachment.payload?.url;
    } else if (attachment.type === "video" || attachment.type === "reel") {
      messageData.media_type = "video";
      messageData.media_url = attachment.payload?.url;
    } else if (attachment.type === "share") {
      // Shared post
      messageData.content = `📤 Shared: ${attachment.payload?.url || "post"}`;
    } else if (attachment.type === "ig_reel") {
      messageData.media_type = "video";
      messageData.content = "🎬 Instagram Reel";
      messageData.media_url = attachment.payload?.url;
    }

    await supabaseAdmin.from("messages").insert(messageData);
    console.log(`✅ Instagram attachment saved: ${attachment.type}`);
  }

  console.log(`✅ Instagram message processed for ticket ${ticket.id}`);

  // Send auto message for new tickets
  if (!existingTickets) {
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
