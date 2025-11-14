import { useState, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Receipt, CreditCard, ShoppingCart, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

export default function TransactionHistory() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if super admin
      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      let paymentsQuery = supabase
        .from("payments")
        .select(`
          *,
          tenants:tenant_id (name)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      let invoicesQuery = supabase
        .from("invoices")
        .select(`
          *,
          tenants:tenant_id (name),
          subscriptions:subscription_id (status)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      let checkoutsQuery = supabase
        .from("checkout_sessions")
        .select(`
          *,
          invoices:invoice_id (
            amount,
            currency,
            tenants:tenant_id (name)
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!isSuperAdmin) {
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("tenant_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!userRole?.tenant_id) return;

        paymentsQuery = paymentsQuery.eq("tenant_id", userRole.tenant_id);
        invoicesQuery = invoicesQuery.eq("tenant_id", userRole.tenant_id);
      }

      const [paymentsResult, invoicesResult, checkoutsResult] = await Promise.all([
        paymentsQuery,
        invoicesQuery,
        checkoutsQuery,
      ]);

      if (paymentsResult.data) setPayments(paymentsResult.data);
      if (invoicesResult.data) setInvoices(invoicesResult.data);
      if (checkoutsResult.data) setCheckouts(checkoutsResult.data);

    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      completed: { variant: "default", label: "Pago" },
      pending: { variant: "secondary", label: "Pendente" },
      failed: { variant: "destructive", label: "Falhou" },
      paid: { variant: "default", label: "Pago" },
      overdue: { variant: "destructive", label: "Vencido" },
      processing: { variant: "secondary", label: "Processando" },
    };

    const config = variants[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const filteredPayments = payments.filter(p =>
    p.gateway_payment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInvoices = invoices.filter(i =>
    i.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCheckouts = checkouts.filter(c =>
    c.external_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.gateway?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.invoices?.tenants?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Histórico de Transações</h1>
          <p className="text-muted-foreground">
            Acompanhe todos os pagamentos, faturas e checkout sessions
          </p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID, nome, email ou tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamentos ({filteredPayments.length})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-2">
              <Receipt className="h-4 w-4" />
              Faturas ({filteredInvoices.length})
            </TabsTrigger>
            <TabsTrigger value="checkouts" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Checkout Sessions ({filteredCheckouts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments" className="space-y-4">
            {filteredPayments.map((payment) => (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {formatCurrency(payment.amount, payment.currency)}
                      </CardTitle>
                      <CardDescription>
                        {payment.tenants?.name} • {payment.payment_gateway.toUpperCase()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(payment.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">ID:</span>{" "}
                      <span className="font-mono">{payment.gateway_payment_id || payment.id.slice(0, 8)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Método:</span>{" "}
                      {payment.payment_method}
                    </div>
                    {payment.customer_name && (
                      <div>
                        <span className="text-muted-foreground">Cliente:</span>{" "}
                        {payment.customer_name}
                      </div>
                    )}
                    {payment.customer_email && (
                      <div>
                        <span className="text-muted-foreground">Email:</span>{" "}
                        {payment.customer_email}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Data:</span>{" "}
                      {format(new Date(payment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                    {payment.paid_at && (
                      <div>
                        <span className="text-muted-foreground">Pago em:</span>{" "}
                        {format(new Date(payment.paid_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                    {payment.failure_reason && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Motivo da falha:</span>{" "}
                        <span className="text-destructive">{payment.failure_reason}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredPayments.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum pagamento encontrado
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoices" className="space-y-4">
            {filteredInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </CardTitle>
                      <CardDescription>
                        {invoice.tenants?.name}
                      </CardDescription>
                    </div>
                    {getStatusBadge(invoice.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {invoice.description && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Descrição:</span>{" "}
                        {invoice.description}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Vencimento:</span>{" "}
                      {format(new Date(invoice.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                    {invoice.paid_at && (
                      <div>
                        <span className="text-muted-foreground">Pago em:</span>{" "}
                        {format(new Date(invoice.paid_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>{" "}
                      {format(new Date(invoice.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                    {invoice.subscriptions && (
                      <div>
                        <span className="text-muted-foreground">Assinatura:</span>{" "}
                        {invoice.subscriptions.status}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredInvoices.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma fatura encontrada
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="checkouts" className="space-y-4">
            {filteredCheckouts.map((checkout) => (
              <Card key={checkout.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {checkout.gateway.toUpperCase()}
                      </CardTitle>
                      <CardDescription>
                        {checkout.invoices?.tenants?.name || 'N/A'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(checkout.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {checkout.external_id && (
                      <div>
                        <span className="text-muted-foreground">ID Externo:</span>{" "}
                        <span className="font-mono">{checkout.external_id.slice(0, 20)}...</span>
                      </div>
                    )}
                    {checkout.invoices?.amount && (
                      <div>
                        <span className="text-muted-foreground">Valor:</span>{" "}
                        {formatCurrency(checkout.invoices.amount, checkout.invoices.currency)}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Criado em:</span>{" "}
                      {format(new Date(checkout.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </div>
                    {checkout.expires_at && (
                      <div>
                        <span className="text-muted-foreground">Expira em:</span>{" "}
                        {format(new Date(checkout.expires_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                    {checkout.error_message && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Erro:</span>{" "}
                        <span className="text-destructive">{checkout.error_message}</span>
                      </div>
                    )}
                    {checkout.url && (
                      <div className="col-span-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(checkout.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Abrir Checkout
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCheckouts.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma checkout session encontrada
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
