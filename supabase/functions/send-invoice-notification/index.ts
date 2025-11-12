import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getSystemSecret } from "../_shared/get-secret.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailNotificationRequest {
  invoiceId: string;
  type: "created" | "overdue" | "due_soon";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Buscar API key do Resend do banco ou env vars
    const resendApiKey = await getSystemSecret(
      "RESEND_API_KEY",
      supabaseUrl,
      supabaseServiceKey
    );

    if (!resendApiKey) {
      console.error("RESEND_API_KEY não configurado");
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY não configurado. Configure em System Secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { invoiceId, type }: EmailNotificationRequest = await req.json();

    // Buscar fatura com informações do tenant e subscription
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select(`
        *,
        tenant:tenants(
          id,
          name,
          slug
        ),
        subscription:subscriptions(
          id,
          plan:plans(
            name,
            billing_period
          )
        )
      `)
      .eq("id", invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error("Fatura não encontrada");
    }

    // Buscar email do admin do tenant
    const { data: adminRoles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("tenant_id", invoice.tenant_id)
      .eq("role", "tenant_admin")
      .limit(1);

    if (rolesError || !adminRoles || adminRoles.length === 0) {
      throw new Error("Admin do tenant não encontrado");
    }

    // Buscar email do usuário via auth.users (usando service_role)
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
      adminRoles[0].user_id
    );

    if (userError || !userData?.user?.email) {
      throw new Error("Email do admin não encontrado");
    }

    const email = userData.user.email;

    // Determinar assunto e conteúdo do email
    let subject = "";
    let message = "";
    const dueDate = new Date(invoice.due_date).toLocaleDateString("pt-BR");
    const amount = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: invoice.currency || "BRL",
    }).format(Number(invoice.amount));

    switch (type) {
      case "created":
        subject = `Nova Fatura - ${invoice.tenant.name}`;
        message = `
          <h2>Nova Fatura Gerada</h2>
          <p>Uma nova fatura foi gerada para ${invoice.tenant.name}.</p>
          <p><strong>Valor:</strong> ${amount}</p>
          <p><strong>Vencimento:</strong> ${dueDate}</p>
          <p><strong>Descrição:</strong> ${invoice.description || "Fatura de assinatura"}</p>
          <p>Acesse o painel para mais detalhes.</p>
        `;
        break;

      case "overdue":
        subject = `⚠️ Fatura Vencida - ${invoice.tenant.name}`;
        message = `
          <h2>Fatura Vencida</h2>
          <p>A fatura de ${invoice.tenant.name} está vencida.</p>
          <p><strong>Valor:</strong> ${amount}</p>
          <p><strong>Vencimento:</strong> ${dueDate}</p>
          <p><strong>Descrição:</strong> ${invoice.description || "Fatura de assinatura"}</p>
          <p style="color: red;"><strong>Esta fatura está vencida. Regularize o pagamento para evitar a suspensão dos serviços.</strong></p>
        `;
        break;

      case "due_soon":
        subject = `Fatura Próxima do Vencimento - ${invoice.tenant.name}`;
        message = `
          <h2>Fatura Próxima do Vencimento</h2>
          <p>A fatura de ${invoice.tenant.name} vence em breve.</p>
          <p><strong>Valor:</strong> ${amount}</p>
          <p><strong>Vencimento:</strong> ${dueDate}</p>
          <p><strong>Descrição:</strong> ${invoice.description || "Fatura de assinatura"}</p>
          <p>Não esqueça de realizar o pagamento antes da data de vencimento.</p>
        `;
        break;
    }

    // Enviar email via Resend API diretamente
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "OmniFlow <onboarding@resend.dev>",
        to: [email],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              h2 { color: #8B5CF6; }
              p { margin: 10px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              ${message}
              <div class="footer">
                <p>Este é um email automático do sistema OmniFlow.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.text();
      console.error("Erro ao enviar email via Resend:", errorData);
      throw new Error(`Falha ao enviar email: ${errorData}`);
    }

    const emailData = await emailResponse.json();
    console.log("Email enviado com sucesso:", emailData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notificação enviada com sucesso",
        emailId: emailData.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
