import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, LogOut, Wallet, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Withdrawals() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    bank_name: "",
    account_type: "",
    account_number: "",
    agency: "",
    pix_key: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (!user?.id) {
        toast({
          title: "Erro",
          description: "Usuário não autenticado",
          variant: "destructive",
        });
        return;
      }

      const { data: userRole, error: roleError } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      if (!userRole?.tenant_id) {
        toast({
          title: "Erro",
          description: "Você precisa estar associado a uma empresa",
          variant: "destructive",
        });
        return;
      }

      setTenantId(userRole.tenant_id);
      await Promise.all([
        loadBalance(userRole.tenant_id),
        loadWithdrawals(userRole.tenant_id)
      ]);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadBalance = async (tid?: string) => {
    const targetTenantId = tid || tenantId;
    if (!targetTenantId) return;

    const { data, error } = await supabase
      .from("tenant_balances")
      .select("*")
      .eq("tenant_id", targetTenantId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    setBalance(data);
  };

  const loadWithdrawals = async (tid?: string) => {
    const targetTenantId = tid || tenantId;
    if (!targetTenantId) return;

    const { data, error } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("tenant_id", targetTenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setWithdrawals(data || []);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSubmit = async () => {
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erro",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    if (!balance || parseFloat(formData.amount) > balance.available_balance) {
      toast({
        title: "Erro",
        description: "Saldo insuficiente",
        variant: "destructive",
      });
      return;
    }

    if (!tenantId) {
      toast({
        title: "Erro",
        description: "Tenant não encontrado",
        variant: "destructive",
      });
      return;
    }

    try {
      const bankInfo = {
        bank_name: formData.bank_name,
        account_type: formData.account_type,
        account_number: formData.account_number,
        agency: formData.agency,
        pix_key: formData.pix_key,
      };

      const { error } = await supabase
        .from("withdrawal_requests")
        .insert({
          tenant_id: tenantId,
          amount: parseFloat(formData.amount),
          bank_info: bankInfo,
          notes: formData.notes || null,
          requested_by: user?.id,
          status: 'pending',
        });

      if (error) throw error;

      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de saque foi enviada para análise",
      });

      setFormData({
        amount: "",
        bank_name: "",
        account_type: "",
        account_number: "",
        agency: "",
        pix_key: "",
        notes: "",
      });
      setDialogOpen(false);
      await loadWithdrawals();
    } catch (error: any) {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'processed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'approved': return 'Aprovado';
      case 'processed': return 'Processado';
      case 'rejected': return 'Rejeitado';
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white shadow-glow">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Saques</h1>
              <p className="text-xs text-foreground/60">Gerencie seus saques</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Solicitar Saque
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {!tenantId ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Acesso Restrito</CardTitle>
              <CardDescription>
                Você precisa estar associado a uma empresa para gerenciar saques.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Entre em contato com o administrador do sistema para associar sua conta a uma empresa.
              </p>
              <Button 
                onClick={() => navigate("/dashboard")} 
                className="mt-4"
              >
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Disponível</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {balance?.available_balance?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Pendente</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {balance?.pending_balance?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ganho</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {balance?.total_earned?.toFixed(2) || '0.00'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Saques</CardTitle>
            <CardDescription>Acompanhe suas solicitações de saque</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        R$ {parseFloat(withdrawal.amount).toFixed(2)}
                      </span>
                      <Badge className={getStatusColor(withdrawal.status)}>
                        {getStatusLabel(withdrawal.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground/60">
                      {formatDistanceToNow(new Date(withdrawal.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                    {withdrawal.rejection_reason && (
                      <p className="text-sm text-red-500">
                        Motivo: {withdrawal.rejection_reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {withdrawals.length === 0 && (
                <p className="text-center text-foreground/60 py-8">
                  Nenhuma solicitação de saque ainda
                </p>
              )}
              </div>
            </CardContent>
          </Card>
        </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Solicitar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-foreground/60 mt-1">
                Saldo disponível: R$ {balance?.available_balance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Banco *</Label>
                <Input
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="Nome do banco"
                />
              </div>
              <div>
                <Label>Tipo de Conta *</Label>
                <Input
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: e.target.value })}
                  placeholder="Corrente/Poupança"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Agência *</Label>
                <Input
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  placeholder="0000"
                />
              </div>
              <div>
                <Label>Número da Conta *</Label>
                <Input
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="00000-0"
                />
              </div>
            </div>
            <div>
              <Label>Chave PIX (opcional)</Label>
              <Input
                value={formData.pix_key}
                onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                placeholder="CPF, email, telefone ou chave aleatória"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Informações adicionais"
                rows={3}
              />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              Solicitar Saque
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
