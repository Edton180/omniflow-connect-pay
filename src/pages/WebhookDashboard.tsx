import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Search, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WebhookDashboard() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [filters, setFilters] = useState({
    gateway: "all",
    status: "all",
    search: "",
  });
  const [retrying, setRetrying] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filters.gateway !== "all") {
        query = query.eq("gateway", filters.gateway);
      }

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.search) {
        query = query.or(`event_type.ilike.%${filters.search}%,event_id.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);
    } catch (error: any) {
      console.error("Error loading webhook logs:", error);
      toast.error("Erro ao carregar logs de webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (logId: string) => {
    setRetrying(logId);
    try {
      const log = logs.find((l) => l.id === logId);
      if (!log) return;

      // Reprocessar webhook
      const { error } = await supabase.functions.invoke(
        `${log.gateway}-webhook`,
        {
          body: log.payload,
        }
      );

      if (error) throw error;

      toast.success("Webhook reenviado com sucesso!");
      loadLogs();
    } catch (error: any) {
      console.error("Error retrying webhook:", error);
      toast.error(error.message || "Erro ao reenviar webhook");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      processed: { variant: "default", icon: CheckCircle, label: "Processado" },
      processing: { variant: "secondary", icon: Clock, label: "Processando" },
      pending: { variant: "secondary", icon: Clock, label: "Pendente" },
      failed: { variant: "destructive", icon: XCircle, label: "Falhou" },
      error: { variant: "destructive", icon: AlertCircle, label: "Erro" },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getGatewayBadge = (gateway: string) => {
    const colors: Record<string, string> = {
      asaas: "bg-blue-500",
      stripe: "bg-purple-500",
      mercadopago: "bg-cyan-500",
      infinitepay: "bg-orange-500",
    };

    return (
      <Badge className={colors[gateway] || "bg-gray-500"}>
        {gateway.toUpperCase()}
      </Badge>
    );
  };

  const stats = {
    total: logs.length,
    processed: logs.filter((l) => l.status === "processed").length,
    failed: logs.filter((l) => l.status === "failed" || l.status === "error").length,
    pending: logs.filter((l) => l.status === "pending" || l.status === "processing").length,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Webhooks</h1>
          <p className="text-muted-foreground">
            Monitore e gerencie notificações de pagamentos
          </p>
        </div>
        <Button onClick={loadLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              Processados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-destructive">
              Falhados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{stats.failed}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Gateway</label>
              <Select
                value={filters.gateway}
                onValueChange={(value) => setFilters({ ...filters, gateway: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="asaas">ASAAS</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                  <SelectItem value="infinitepay">InfinitePay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="processed">Processado</SelectItem>
                  <SelectItem value="processing">Processando</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="error">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tipo ou ID do evento..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Webhooks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>ID Externo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Carregando logs...</p>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <AlertCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum log encontrado
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>{getGatewayBadge(log.gateway)}</TableCell>
                      <TableCell className="font-medium">{log.event_type}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.event_id?.substring(0, 12) || "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.retry_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedLog(log)}
                          >
                            Detalhes
                          </Button>
                          {(log.status === "failed" || log.status === "error") && (
                            <Button
                              size="sm"
                              onClick={() => handleRetry(log.id)}
                              disabled={retrying === log.id}
                            >
                              {retrying === log.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                "Retry"
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Webhook</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gateway</label>
                  <div className="mt-1">{getGatewayBadge(selectedLog.gateway)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tipo de Evento</label>
                  <p className="mt-1 font-medium">{selectedLog.event_type}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Evento</label>
                  <p className="mt-1 font-mono text-xs">{selectedLog.event_id || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tentativas</label>
                  <p className="mt-1 font-medium">{selectedLog.retry_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Criado em</label>
                  <p className="mt-1 font-mono text-xs">
                    {format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
              </div>

              {selectedLog.error_message && (
                <div>
                  <label className="text-sm font-medium text-destructive">Mensagem de Erro</label>
                  <pre className="mt-1 p-3 bg-destructive/10 rounded-md text-xs overflow-x-auto">
                    {selectedLog.error_message}
                  </pre>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Payload</label>
                <pre className="mt-1 p-3 bg-muted rounded-md text-xs overflow-x-auto">
                  {JSON.stringify(selectedLog.payload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
