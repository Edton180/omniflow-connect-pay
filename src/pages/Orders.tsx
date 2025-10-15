import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, LogOut, Package, Eye, Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function Orders() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (tenantId) {
      loadOrders();
    }
  }, [filterStatus, tenantId]);

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
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadOrders = async () => {
    if (!tenantId && !user?.id) return;

    try {
      // Check if user is super admin
      const { data: isSuperAdmin } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "super_admin")
        .maybeSingle();

      let query = supabase
        .from("catalog_orders")
        .select("*")
        .order("created_at", { ascending: false });

      // Only filter by tenant if not super admin
      if (!isSuperAdmin && tenantId) {
        query = query.eq("tenant_id", tenantId);
      }

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      const { data, error } = await query;

      if (error) {
        toast({
          title: "Erro ao carregar pedidos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadOrderDetails = async (orderId: string) => {
    const { data, error } = await supabase
      .from("catalog_order_items")
      .select("*")
      .eq("order_id", orderId);

    if (error) {
      toast({
        title: "Erro ao carregar detalhes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setOrderItems(data || []);
  };

  const handleViewDetails = async (order: any) => {
    setSelectedOrder(order);
    await loadOrderDetails(order.id);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("catalog_orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      toast({ title: "Status atualizado com sucesso" });
      await loadOrders();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      confirmed: { label: "Confirmado", className: "bg-blue-500" },
      preparing: { label: "Preparando", className: "bg-orange-500" },
      ready: { label: "Pronto", className: "bg-green-500" },
      delivered: { label: "Entregue", className: "bg-green-700" },
      cancelled: { label: "Cancelado", className: "bg-red-500" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
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
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Pedidos</h1>
              <p className="text-xs text-foreground/60">Gerencie pedidos do catálogo</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="confirmed">Confirmados</SelectItem>
                <SelectItem value="preparing">Preparando</SelectItem>
                <SelectItem value="ready">Prontos</SelectItem>
                <SelectItem value="delivered">Entregues</SelectItem>
              </SelectContent>
            </Select>
            <ThemeToggle />
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
                Você precisa estar associado a uma empresa para gerenciar pedidos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/dashboard")} className="mt-4">
                Voltar ao Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : orders.length === 0 ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Nenhum pedido</CardTitle>
              <CardDescription>
                Aguardando novos pedidos do catálogo
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <Package className="h-16 w-16 text-muted-foreground" />
              <p className="text-center text-muted-foreground">
                Os pedidos realizados pelos clientes aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {order.order_number || `Pedido #${order.id.slice(0, 8)}`}
                      </CardTitle>
                      <CardDescription>
                        {order.customer_name} • {order.customer_phone || order.customer_email}
                      </CardDescription>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-semibold">
                        R$ {parseFloat(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    {order.delivery_fee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Frete:</span>
                        <span>R$ {parseFloat(order.delivery_fee).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Realizado:</span>
                      <span>
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDetails(order)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalhes
                    </Button>
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleUpdateStatus(order.id, value)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="confirmed">Confirmado</SelectItem>
                        <SelectItem value="preparing">Preparando</SelectItem>
                        <SelectItem value="ready">Pronto</SelectItem>
                        <SelectItem value="delivered">Entregue</SelectItem>
                        <SelectItem value="cancelled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes do Pedido {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Informações do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nome:</span>
                    <span>{selectedOrder.customer_name}</span>
                  </div>
                  {selectedOrder.customer_phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Telefone:</span>
                      <span>{selectedOrder.customer_phone}</span>
                    </div>
                  )}
                  {selectedOrder.customer_email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span>{selectedOrder.customer_email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {selectedOrder.delivery_address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Endereço de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm">
                    <pre className="whitespace-pre-wrap">
                      {JSON.stringify(selectedOrder.delivery_address, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {orderItems.map((item) => (
                    <div key={item.id} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantity}x R$ {parseFloat(item.product_price).toFixed(2)}
                          </p>
                          {item.variations && item.variations.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Variações: {JSON.stringify(item.variations)}
                            </div>
                          )}
                          {item.optionals && item.optionals.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Opcionais: {JSON.stringify(item.optionals)}
                            </div>
                          )}
                          {item.notes && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Obs: {item.notes}
                            </p>
                          )}
                        </div>
                        <p className="font-semibold">
                          R$ {parseFloat(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 space-y-2 border-t">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                    </div>
                    {selectedOrder.delivery_fee > 0 && (
                      <div className="flex justify-between">
                        <span>Frete:</span>
                        <span>R$ {parseFloat(selectedOrder.delivery_fee).toFixed(2)}</span>
                      </div>
                    )}
                    {selectedOrder.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>- R$ {parseFloat(selectedOrder.discount_amount).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total:</span>
                      <span>
                        R$ {(
                          parseFloat(selectedOrder.total_amount) + 
                          parseFloat(selectedOrder.delivery_fee || 0) - 
                          parseFloat(selectedOrder.discount_amount || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
