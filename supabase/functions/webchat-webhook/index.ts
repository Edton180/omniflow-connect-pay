import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Handle GET request - polling for new messages and typing status
    if (req.method === "GET") {
      const url = new URL(req.url);
      const sessionId = url.searchParams.get("sessionId");
      const tenantId = url.searchParams.get("tenantId");
      const action = url.searchParams.get("action");

      if (!sessionId || !tenantId) {
        return new Response(JSON.stringify({ messages: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Handle typing status check
      if (action === "typing") {
        const { data: typingIndicators } = await supabaseAdmin
          .from("typing_indicators")
          .select("user_id, updated_at")
          .eq("tenant_id", tenantId)
          .gte("updated_at", new Date(Date.now() - 5000).toISOString());

        const isTyping = typingIndicators && typingIndicators.length > 0;
        let agentName = "Atendente";

        if (isTyping && typingIndicators[0]?.user_id) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name")
            .eq("id", typingIndicators[0].user_id)
            .maybeSingle();
          agentName = profile?.full_name || "Atendente";
        }

        return new Response(JSON.stringify({ typing: isTyping, agentName }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find contact by session ID
      const { data: contact } = await supabaseAdmin
        .from("contacts")
        .select("id")
        .eq("tenant_id", tenantId)
        .eq("metadata->>webchat_session_id", sessionId)
        .maybeSingle();

      if (!contact) {
        return new Response(JSON.stringify({ messages: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find open ticket
      const { data: ticket } = await supabaseAdmin
        .from("tickets")
        .select("id")
        .eq("contact_id", contact.id)
        .in("status", ["open", "in_progress", "pending"])
        .maybeSingle();

      if (!ticket) {
        return new Response(JSON.stringify({ messages: [] }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get messages
      const { data: messages } = await supabaseAdmin
        .from("messages")
        .select("content, is_from_contact, created_at, sender_id, media_url, media_type, is_private")
        .eq("ticket_id", ticket.id)
        .eq("is_private", false) // Don't show private notes
        .order("created_at", { ascending: true });

      // Get agent names and format messages
      const formattedMessages = await Promise.all(
        (messages || []).map(async (msg) => {
          let agentName = "Atendente";
          if (!msg.is_from_contact && msg.sender_id) {
            const { data: profile } = await supabaseAdmin
              .from("profiles")
              .select("full_name")
              .eq("id", msg.sender_id)
              .maybeSingle();
            agentName = profile?.full_name || "Atendente";
          }
          return {
            content: msg.content,
            isVisitor: msg.is_from_contact,
            agentName: agentName,
            time: msg.created_at,
            mediaUrl: msg.media_url,
            mediaType: msg.media_type,
          };
        })
      );

      return new Response(JSON.stringify({ messages: formattedMessages }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle POST request - new message, contact, typing, or file upload
    const body = await req.json();
    console.log("📨 WebChat webhook received:", JSON.stringify(body, null, 2));

    const { 
      type, 
      tenantId, 
      sessionId, 
      content, 
      visitorName, 
      visitorEmail,
      visitorPhone,
      customFields,
      mediaUrl,
      mediaType,
    } = body;

    if (!tenantId || !sessionId) {
      return new Response(JSON.stringify({ error: "Missing tenantId or sessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find or create webchat channel
    let { data: channel } = await supabaseAdmin
      .from("channels")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("type", "webchat")
      .eq("status", "active")
      .maybeSingle();

    if (!channel) {
      // Create default webchat channel
      const { data: newChannel, error: channelError } = await supabaseAdmin
        .from("channels")
        .insert({
          tenant_id: tenantId,
          name: "Web Chat",
          type: "webchat",
          status: "active",
          config: {
            welcome_message: "Olá! Como podemos ajudar?",
            offline_message: "No momento não temos atendentes disponíveis. Deixe sua mensagem!",
          },
        })
        .select()
        .single();

      if (channelError) {
        console.error("Error creating channel:", channelError);
        throw channelError;
      }
      channel = newChannel;
    }

    // Find or create contact
    let { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("metadata->>webchat_session_id", sessionId)
      .maybeSingle();

    const contactName = visitorName || `Visitante ${sessionId.slice(-6)}`;

    if (!contact) {
      const { data: newContact, error: contactError } = await supabaseAdmin
        .from("contacts")
        .insert({
          tenant_id: tenantId,
          name: contactName,
          email: visitorEmail || null,
          phone: visitorPhone || null,
          metadata: {
            webchat_session_id: sessionId,
            source: "webchat",
            online: true,
            last_seen: new Date().toISOString(),
            custom_fields: customFields || {},
          },
        })
        .select()
        .single();

      if (contactError) {
        console.error("Error creating contact:", contactError);
        throw contactError;
      }
      contact = newContact;
      console.log("✅ New WebChat contact created:", contact.id);
    } else {
      // Update contact info
      const updatedMetadata = {
        ...contact.metadata,
        online: true,
        last_seen: new Date().toISOString(),
      };
      if (customFields) {
        updatedMetadata.custom_fields = { ...updatedMetadata.custom_fields, ...customFields };
      }

      await supabaseAdmin
        .from("contacts")
        .update({
          name: visitorName || contact.name,
          email: visitorEmail || contact.email,
          phone: visitorPhone || contact.phone,
          metadata: updatedMetadata,
        })
        .eq("id", contact.id);
    }

    // Handle typing indicator
    if (type === "typing") {
      // Visitor is typing - could be used for analytics
      console.log(`⌨️ Visitor ${contactName} is typing`);
      return new Response(JSON.stringify({ success: true, typing: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle contact registration only
    if (type === "contact") {
      return new Response(JSON.stringify({ 
        success: true, 
        contactId: contact.id,
        message: "Contact registered successfully",
        channelConfig: {
          welcomeMessage: channel.config?.welcome_message,
          offlineMessage: channel.config?.offline_message,
        },
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle message
    if (type === "message" && (content || mediaUrl)) {
      // Find or create ticket
      let { data: ticket } = await supabaseAdmin
        .from("tickets")
        .select("*, bot_state")
        .eq("contact_id", contact.id)
        .in("status", ["open", "in_progress", "pending"])
        .maybeSingle();

      let isNewTicket = false;

      if (!ticket) {
        isNewTicket = true;
        const { data: newTicket, error: ticketError } = await supabaseAdmin
          .from("tickets")
          .insert({
            tenant_id: tenantId,
            contact_id: contact.id,
            channel: "webchat",
            status: "open",
            priority: "medium",
            last_message: content || "[Mídia]",
            bot_state: { step: "initial", timestamp: new Date().toISOString() },
          })
          .select()
          .single();

        if (ticketError) {
          console.error("Error creating ticket:", ticketError);
          throw ticketError;
        }
        ticket = newTicket;
        console.log("✅ New WebChat ticket created:", ticket.id);
      } else {
        // Update ticket
        await supabaseAdmin
          .from("tickets")
          .update({
            last_message: content || "[Mídia]",
            updated_at: new Date().toISOString(),
          })
          .eq("id", ticket.id);
      }

      // Create message
      const { error: messageError } = await supabaseAdmin
        .from("messages")
        .insert({
          ticket_id: ticket.id,
          contact_id: contact.id,
          content: content || "[Mídia enviada]",
          is_from_contact: true,
          status: "delivered",
          media_url: mediaUrl || null,
          media_type: mediaType || null,
        });

      if (messageError) {
        console.error("Error creating message:", messageError);
        throw messageError;
      }

      console.log(`✅ WebChat message processed for ticket ${ticket.id}`);

      // Check for auto-reply or greeting
      let reply = null;
      let agentName = "Atendente";

      if (isNewTicket) {
        // Send auto greeting for new tickets
        const channelConfig = channel.config as any;
        if (channelConfig?.welcome_message) {
          reply = channelConfig.welcome_message;
          
          // Save auto-reply as message
          await supabaseAdmin
            .from("messages")
            .insert({
              ticket_id: ticket.id,
              content: reply,
              is_from_contact: false,
              status: "delivered",
            });
        }

        // Try to invoke auto-message function
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
          console.log("Auto-message function not available:", autoError);
        }
      }

      return new Response(JSON.stringify({ 
        success: true,
        ticketId: ticket.id,
        reply: reply,
        agentName: agentName,
        isNewTicket: isNewTicket,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle offline status
    if (type === "offline") {
      await supabaseAdmin
        .from("contacts")
        .update({
          metadata: {
            ...contact.metadata,
            online: false,
            last_seen: new Date().toISOString(),
          },
        })
        .eq("id", contact.id);

      return new Response(JSON.stringify({ success: true, status: "offline" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("❌ Error in WebChat webhook:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
