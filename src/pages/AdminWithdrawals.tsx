import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, LogOut, Wallet, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AdminWithdrawals() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from("withdrawal_requests")
        .select("*, tenants(name)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleApprove = async (id: string) => {
    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Saque aprovado",
        description: "O saque foi aprovado com sucesso",
      });

      await loadWithdrawals();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    if (!selectedWithdrawal || !rejectionReason.trim()) {
      toast({
        title: "Erro",
        description: "Informe o motivo da rejeição",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("withdrawal_requests")
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", selectedWithdrawal.id);

      if (error) throw error;

      toast({
        title: "Saque rejeitado",
        description: "O saque foi rejeitado",
      });

      setDialogOpen(false);
      setSelectedWithdrawal(null);
      setRejectionReason("");
      await loadWithdrawals();
    } catch (error: any) {
      toast({
        title: "Erro",
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
              <h1 className="text-xl font-bold">Gerenciar Saques</h1>
              <p className="text-xs text-foreground/60">Aprovar ou rejeitar solicitações</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ThemeToggle />
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => (
            <Card key={withdrawal.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {(withdrawal.tenants as any)?.name || 'Empresa'}
                    </CardTitle>
                    <CardDescription>
                      {formatDistanceToNow(new Date(withdrawal.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(withdrawal.status)}>
                    {getStatusLabel(withdrawal.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold">Valor</p>
                    <p className="text-2xl font-bold">
                      R$ {parseFloat(withdrawal.amount).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Dados Bancários</p>
                    <div className="text-sm space-y-1">
                      <p>Banco: {withdrawal.bank_info.bank_name}</p>
                      <p>Tipo: {withdrawal.bank_info.account_type}</p>
                      <p>Agência: {withdrawal.bank_info.agency}</p>
                      <p>Conta: {withdrawal.bank_info.account_number}</p>
                      {withdrawal.bank_info.pix_key && (
                        <p>PIX: {withdrawal.bank_info.pix_key}</p>
                      )}
                    </div>
                  </div>
                </div>
                {withdrawal.notes && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Observações</p>
                    <p className="text-sm text-foreground/60">{withdrawal.notes}</p>
                  </div>
                )}
                {withdrawal.rejection_reason && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold">Motivo da Rejeição</p>
                    <p className="text-sm text-red-500">{withdrawal.rejection_reason}</p>
                  </div>
                )}
                {withdrawal.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => handleApprove(withdrawal.id)}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => {
                        setSelectedWithdrawal(withdrawal);
                        setDialogOpen(true);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Rejeitar
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {withdrawals.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <p className="text-center text-foreground/60">
                  Nenhuma solicitação de saque
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Saque</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Motivo da Rejeição *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explique o motivo da rejeição"
                rows={4}
              />
            </div>
            <Button onClick={handleReject} variant="destructive" className="w-full">
              Confirmar Rejeição
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
