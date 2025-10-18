import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, CreditCard, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
  items: any[];
}

export function OrderDetailsDialog({ open, onOpenChange, order, items }: OrderDetailsDialogProps) {
  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      pending: { label: "Pendente", className: "bg-yellow-500" },
      confirmed: { label: "Confirmado", className: "bg-blue-500" },
      preparing: { label: "Preparando", className: "bg-orange-500" },
      ready: { label: "Pronto", className: "bg-green-500" },
      delivered: { label: "Entregue", className: "bg-green-700" },
      cancelled: { label: "Cancelado", className: "bg-red-500" },
      paid: { label: "Pago", className: "bg-green-600" },
    };

    const config = statusConfig[status] || { label: status, className: "bg-gray-500" };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">
              {order.order_number || `Pedido #${order.id.slice(0, 8)}`}
            </DialogTitle>
            {getStatusBadge(order.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Informações do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <p className="font-medium">{order.customer_name}</p>
              </div>
              {order.customer_phone && (
                <div>
                  <span className="text-muted-foreground">Telefone:</span>
                  <p className="font-medium">{order.customer_phone}</p>
                </div>
              )}
              {order.customer_email && (
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p className="font-medium">{order.customer_email}</p>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Realizado:</span>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(order.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          {order.delivery_address && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {typeof order.delivery_address === 'object' ? (
                  <>
                    <p>{order.delivery_address.street}, {order.delivery_address.number}</p>
                    {order.delivery_address.complement && <p>{order.delivery_address.complement}</p>}
                    <p>{order.delivery_address.neighborhood}</p>
                    <p>{order.delivery_address.city} - {order.delivery_address.state}</p>
                    <p>CEP: {order.delivery_address.zipcode}</p>
                  </>
                ) : (
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(order.delivery_address, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Itens do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity}x R$ {parseFloat(item.product_price).toFixed(2)}
                      </p>
                      
                      {item.variations && Array.isArray(item.variations) && item.variations.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Variações:</span>
                          {item.variations.map((v: any, i: number) => (
                            <span key={i}> {v.name}: {v.option}</span>
                          ))}
                        </div>
                      )}
                      
                      {item.optionals && Array.isArray(item.optionals) && item.optionals.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          <span className="font-semibold">Opcionais:</span>
                          {item.optionals.map((o: any, i: number) => (
                            <span key={i}> {o.name} (+R$ {o.price})</span>
                          ))}
                        </div>
                      )}
                      
                      {item.notes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          💬 {item.notes}
                        </p>
                      )}
                    </div>
                    <p className="font-semibold">
                      R$ {parseFloat(item.subtotal).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Order Summary */}
              <div className="pt-4 space-y-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>R$ {parseFloat(order.total_amount).toFixed(2)}</span>
                </div>
                {order.delivery_fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de Entrega:</span>
                    <span>R$ {parseFloat(order.delivery_fee).toFixed(2)}</span>
                  </div>
                )}
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto:</span>
                    <span>- R$ {parseFloat(order.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
                  <span>Total:</span>
                  <span className="text-primary">
                    R$ {(
                      parseFloat(order.total_amount) + 
                      parseFloat(order.delivery_fee || 0) - 
                      parseFloat(order.discount_amount || 0)
                    ).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.payment_gateway && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Gateway:</span>
                  <p className="font-medium capitalize">{order.payment_gateway}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                {order.gateway_payment_id && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">ID Transação:</span>
                    <p className="font-mono text-xs mt-1">{order.gateway_payment_id}</p>
                  </div>
                )}
                {order.paid_at && (
                  <div>
                    <span className="text-muted-foreground">Pago em:</span>
                    <p className="font-medium">
                      {formatDistanceToNow(new Date(order.paid_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estimated Delivery */}
          {order.estimated_delivery && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Previsão de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {new Date(order.estimated_delivery).toLocaleString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
