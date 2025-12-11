import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-n8n-signature, x-n8n-api-key",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { event, data, tenant_id } = await req.json();
    console.log(`N8N Webhook: ${event}`, { tenant_id, data });

    if (!tenant_id) {
      throw new Error("tenant_id é obrigatório");
    }

    // Verificar API Key se configurado
    const { data: n8nConfig } = await supabase
      .from("n8n_configs")
      .select("api_key, is_active")
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    if (n8nConfig?.api_key) {
      const providedKey = req.headers.get("x-n8n-api-key");
      if (providedKey !== n8nConfig.api_key) {
        console.warn("N8N Webhook: API Key inválida");
        return new Response(JSON.stringify({ error: "API Key inválida" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    switch (event) {
      // ============ TICKETS ============
      case "create_ticket": {
        const { contact_id, channel, message, priority } = data;
        if (!contact_id || !channel) throw new Error("contact_id e channel obrigatórios");

        const { data: ticket, error } = await supabase
          .from("tickets")
          .insert({ 
            tenant_id, 
            contact_id, 
            channel, 
            status: "open", 
            priority: priority || "medium", 
            last_message: message 
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Se tiver mensagem, criar a mensagem inicial
        if (message && ticket) {
          await supabase.from("messages").insert({
            ticket_id: ticket.id,
            content: message,
            is_from_contact: false,
          });
        }
        
        return new Response(JSON.stringify({ success: true, ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_ticket": {
        const { ticket_id, status, priority, assigned_to } = data;
        if (!ticket_id) throw new Error("ticket_id obrigatório");

        const updates: any = {};
        if (status) updates.status = status;
        if (priority) updates.priority = priority;
        if (assigned_to) updates.assigned_to = assigned_to;

        const { data: ticket, error } = await supabase
          .from("tickets")
          .update(updates)
          .eq("id", ticket_id)
          .eq("tenant_id", tenant_id)
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "close_ticket": {
        const { ticket_id } = data;
        if (!ticket_id) throw new Error("ticket_id obrigatório");

        const { data: ticket, error } = await supabase
          .from("tickets")
          .update({ status: "closed", closed_at: new Date().toISOString() })
          .eq("id", ticket_id)
          .eq("tenant_id", tenant_id)
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "assign_ticket": {
        const { ticket_id, agent_id } = data;
        if (!ticket_id || !agent_id) throw new Error("ticket_id e agent_id obrigatórios");

        const { data: ticket, error } = await supabase
          .from("tickets")
          .update({ assigned_to: agent_id })
          .eq("id", ticket_id)
          .eq("tenant_id", tenant_id)
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_ticket": {
        const { ticket_id } = data;
        if (!ticket_id) throw new Error("ticket_id obrigatório");

        const { data: ticket, error } = await supabase
          .from("tickets")
          .select("*, contact:contacts(*), messages(*)")
          .eq("id", ticket_id)
          .eq("tenant_id", tenant_id)
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, ticket }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_tickets": {
        const { status, limit = 50, offset = 0 } = data || {};
        
        let query = supabase
          .from("tickets")
          .select("*, contact:contacts(id, name, phone, email)")
          .eq("tenant_id", tenant_id)
          .order("created_at", { ascending: false })
          .range(offset, offset + limit - 1);

        if (status) {
          query = query.eq("status", status);
        }

        const { data: tickets, error, count } = await query;
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, tickets, count }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ============ MESSAGES ============
      case "send_message": {
        const { ticket_id, content, sender_id, media_url, media_type } = data;
        if (!ticket_id || !content) throw new Error("ticket_id e content obrigatórios");

        const { data: message, error } = await supabase
          .from("messages")
          .insert({ 
            ticket_id, 
            content, 
            sender_id, 
            is_from_contact: false,
            media_url,
            media_type,
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // Atualizar last_message do ticket
        await supabase
          .from("tickets")
          .update({ last_message: content })
          .eq("id", ticket_id);
        
        return new Response(JSON.stringify({ success: true, message }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ============ CONTACTS ============
      case "create_contact": {
        const { name, phone, email, tags, metadata } = data;
        if (!name) throw new Error("name obrigatório");

        const { data: contact, error } = await supabase
          .from("contacts")
          .insert({ 
            tenant_id, 
            name, 
            phone, 
            email, 
            tags: tags || [],
            metadata: metadata || {},
          })
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, contact }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "update_contact": {
        const { contact_id, name, phone, email, tags, metadata } = data;
        if (!contact_id) throw new Error("contact_id obrigatório");

        const updates: any = {};
        if (name !== undefined) updates.name = name;
        if (phone !== undefined) updates.phone = phone;
        if (email !== undefined) updates.email = email;
        if (tags !== undefined) updates.tags = tags;
        if (metadata !== undefined) updates.metadata = metadata;

        const { data: contact, error } = await supabase
          .from("contacts")
          .update(updates)
          .eq("id", contact_id)
          .eq("tenant_id", tenant_id)
          .select()
          .single();
          
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, contact }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contact": {
        const { contact_id, phone, email } = data;
        
        let query = supabase
          .from("contacts")
          .select("*")
          .eq("tenant_id", tenant_id);

        if (contact_id) {
          query = query.eq("id", contact_id);
        } else if (phone) {
          query = query.eq("phone", phone);
        } else if (email) {
          query = query.eq("email", email);
        } else {
          throw new Error("contact_id, phone ou email obrigatório");
        }

        const { data: contact, error } = await query.maybeSingle();
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, contact }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "get_contacts": {
        const { limit = 100, offset = 0, search } = data || {};
        
        let query = supabase
          .from("contacts")
          .select("*", { count: "exact" })
          .eq("tenant_id", tenant_id)
          .order("name")
          .range(offset, offset + limit - 1);

        if (search) {
          query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
        }

        const { data: contacts, error, count } = await query;
        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, contacts, count }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ============ AGENTS ============
      case "get_agents": {
        const { data: profiles, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, current_ticket_count, max_concurrent_tickets")
          .eq("tenant_id", tenant_id);

        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, agents: profiles }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ============ QUEUES ============
      case "get_queues": {
        const { data: queues, error } = await supabase
          .from("queues")
          .select("*")
          .eq("tenant_id", tenant_id);

        if (error) throw error;
        
        return new Response(JSON.stringify({ success: true, queues }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ============ TEST ============
      case "webhook_test":
        return new Response(JSON.stringify({ 
          success: true, 
          message: "N8N conectado com sucesso!",
          timestamp: new Date().toISOString(),
          tenant_id,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

      default:
        throw new Error(`Evento desconhecido: ${event}. Eventos suportados: create_ticket, update_ticket, close_ticket, assign_ticket, get_ticket, get_tickets, send_message, create_contact, update_contact, get_contact, get_contacts, get_agents, get_queues, webhook_test`);
    }
  } catch (error) {
    console.error("Erro N8N:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400, 
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
