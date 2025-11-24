import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ManualPaymentConfigProps {
  gatewayId: string;
  onClose: () => void;
}

export function ManualPaymentConfig({ gatewayId, onClose }: ManualPaymentConfigProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    pix_key: '',
    pix_name: '',
    payment_link: '',
    notification_email: '',
    instructions: 'Após realizar o pagamento, envie o comprovante através do sistema.'
  });

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!config.notification_email) {
        toast.error('Email de notificação é obrigatório');
        return;
      }

      if (!config.pix_key && !config.payment_link) {
        toast.error('Configure pelo menos uma chave PIX ou link de pagamento');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Get tenant_id from user_roles
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('tenant_id')
        .eq('user_id', user.id)
        .single();

      if (!userRole?.tenant_id) {
        throw new Error('Tenant não encontrado');
      }

      // Check if gateway already exists
      const { data: existing } = await supabase
        .from('payment_gateways')
        .select('id')
        .eq('gateway_name', 'manual')
        .is('tenant_id', null)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('payment_gateways')
          .update({
            config: config,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new (global gateway)
        const { error } = await supabase
          .from('payment_gateways')
          .insert({
            gateway_name: 'manual',
            tenant_id: null, // Global gateway
            config: config,
            is_active: true
          });

        if (error) throw error;
      }

      toast.success('Configuração de pagamento manual salva com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Error saving manual payment config:', error);
      toast.error('Erro ao salvar configuração: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-orange-50 border-orange-200">
        <p className="text-sm text-orange-800">
          Configure suas informações de pagamento manual. Os clientes poderão pagar via PIX ou link e enviar o comprovante pelo sistema.
        </p>
      </Card>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notification_email">Email para Notificações *</Label>
          <Input
            id="notification_email"
            type="email"
            placeholder="pagamentos@suaempresa.com"
            value={config.notification_email}
            onChange={(e) => setConfig({ ...config, notification_email: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Você receberá notificações quando um comprovante for enviado
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pix_key">Chave PIX</Label>
            <Input
              id="pix_key"
              placeholder="exemplo@email.com ou CPF/CNPJ"
              value={config.pix_key}
              onChange={(e) => setConfig({ ...config, pix_key: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pix_name">Nome do Titular PIX</Label>
            <Input
              id="pix_name"
              placeholder="Nome completo ou razão social"
              value={config.pix_name}
              onChange={(e) => setConfig({ ...config, pix_name: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_link">Link de Pagamento (Opcional)</Label>
          <Input
            id="payment_link"
            type="url"
            placeholder="https://seu-link-de-pagamento.com"
            value={config.payment_link}
            onChange={(e) => setConfig({ ...config, payment_link: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Link para página de pagamento externa (ex: PagSeguro, PicPay, etc)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instruções de Pagamento</Label>
          <Textarea
            id="instructions"
            rows={4}
            placeholder="Instruções que serão mostradas ao cliente..."
            value={config.instructions}
            onChange={(e) => setConfig({ ...config, instructions: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Configuração'}
        </Button>
      </div>
    </div>
  );
}
