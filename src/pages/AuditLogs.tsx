import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Filter, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";

export default function AuditLogs() {
  const { isSuperAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [tenantFilter, setTenantFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const { data: tenants } = useQuery({
    queryKey: ["tenants-for-filter"],
    queryFn: async () => {
      if (!isSuperAdmin) return [];
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: isSuperAdmin,
  });

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["audit-logs", actionFilter, entityTypeFilter, tenantFilter, page],
    queryFn: async () => {
      let query = supabase
        .from("audit_logs")
        .select(`
          *,
          profiles!audit_logs_user_id_fkey(full_name, tenant_id),
          tenants!audit_logs_tenant_id_fkey(name)
        `, { count: 'exact' })
        .order("created_at", { ascending: false })
        .range((page - 1) * itemsPerPage, page * itemsPerPage - 1);

      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      if (entityTypeFilter !== "all") {
        query = query.eq("entity_type", entityTypeFilter);
      }

      if (tenantFilter !== "all" && isSuperAdmin) {
        query = query.eq("tenant_id", tenantFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      return { logs: data, total: count || 0 };
    },
  });

  const logs = logsData?.logs;
  const totalPages = Math.ceil((logsData?.total || 0) / itemsPerPage);

  const filteredLogs = logs?.filter((log) =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.entity_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    const colors: Record<string, string> = {
      INSERT: "bg-green-500",
      UPDATE: "bg-blue-500",
      DELETE: "bg-red-500",
      STATUS_CHANGE: "bg-yellow-500",
    };
    return colors[action] || "bg-gray-500";
  };

  const clearFilters = () => {
    setActionFilter("all");
    setEntityTypeFilter("all");
    setTenantFilter("all");
    setSearchTerm("");
    setPage(1);
  };

  const hasActiveFilters = actionFilter !== "all" || entityTypeFilter !== "all" || tenantFilter !== "all" || searchTerm !== "";

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Logs de Auditoria
          </h1>
          <p className="text-muted-foreground mt-1">
            Histórico de ações realizadas no sistema
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <Input
            placeholder="Buscar por ação ou tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-2">
                    {[actionFilter, entityTypeFilter, tenantFilter].filter(f => f !== "all").length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Ação</label>
                  <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar ação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="INSERT">INSERT</SelectItem>
                      <SelectItem value="UPDATE">UPDATE</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="STATUS_CHANGE">STATUS_CHANGE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipo de Entidade</label>
                  <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="tickets">Tickets</SelectItem>
                      <SelectItem value="contacts">Contatos</SelectItem>
                      <SelectItem value="users">Usuários</SelectItem>
                      <SelectItem value="user_roles">Papéis de Usuário</SelectItem>
                      <SelectItem value="tenants">Empresas</SelectItem>
                      <SelectItem value="invoices">Faturas</SelectItem>
                      <SelectItem value="payments">Pagamentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {isSuperAdmin && tenants && tenants.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Empresa</label>
                    <Select value={tenantFilter} onValueChange={setTenantFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {tenants.map((tenant) => (
                          <SelectItem key={tenant.id} value={tenant.id}>
                            {tenant.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Card>
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">
              Carregando logs...
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    {isSuperAdmin && <TableHead>Empresa</TableHead>}
                    <TableHead>Ação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.created_at!), "dd/MM/yyyy HH:mm:ss", {
                          locale: ptBR,
                        })}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const profile = log.profiles as { full_name?: string } | null;
                          return profile?.full_name || "Sistema";
                        })()}
                      </TableCell>
                      {isSuperAdmin && (
                        <TableCell>
                          {(() => {
                            const tenant = log.tenants as { name?: string } | null;
                            return tenant?.name || "N/A";
                          })()}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge className={getActionBadge(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.entity_type}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.ip_address ? String(log.ip_address) : "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Página {page} de {totalPages} ({logsData?.total} registros)
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters 
                  ? "Tente ajustar os filtros para encontrar registros"
                  : "Não há registros de auditoria para exibir"
                }
              </p>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
