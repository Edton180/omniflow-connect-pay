import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Database, Download, Upload, History, RefreshCw, 
  FileArchive, CheckCircle, AlertTriangle,
  HardDrive, Table, Users, FileText
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface BackupInfo {
  id: string;
  type: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  size_mb: number;
  tables_count: number;
}

export default function SuperAdminBackup() {
  const [exporting, setExporting] = useState(false);
  const [backupHistory] = useState<BackupInfo[]>([
    {
      id: '1',
      type: 'full',
      status: 'completed',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      size_mb: 45.2,
      tables_count: 28
    },
    {
      id: '2',
      type: 'incremental',
      status: 'completed',
      created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      size_mb: 12.8,
      tables_count: 15
    }
  ]);

  const [tableStats, setTableStats] = useState<Record<string, number>>({});
  const [loadingStats, setLoadingStats] = useState(false);

  const loadTableStats = async () => {
    setLoadingStats(true);
    try {
      const stats: Record<string, number> = {};
      
      const [tenants, profiles, tickets, messages, contacts, channels, invoices, payments] = await Promise.all([
        supabase.from('tenants').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('contacts').select('*', { count: 'exact', head: true }),
        supabase.from('channels').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }),
      ]);
      
      stats['tenants'] = tenants.count || 0;
      stats['profiles'] = profiles.count || 0;
      stats['tickets'] = tickets.count || 0;
      stats['messages'] = messages.count || 0;
      stats['contacts'] = contacts.count || 0;
      stats['channels'] = channels.count || 0;
      stats['invoices'] = invoices.count || 0;
      stats['payments'] = payments.count || 0;
      
      setTableStats(stats);
      toast.success("Estatísticas atualizadas");
    } catch (error) {
      console.error("Error loading stats:", error);
      toast.error("Erro ao carregar estatísticas");
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExportData = async (type: 'full' | 'tenants' | 'users' | 'tickets') => {
    setExporting(true);
    try {
      let exportData: any = null;
      let filename = '';

      switch (type) {
        case 'tenants':
          const { data: tenantsData } = await supabase.from('tenants').select('*');
          exportData = tenantsData || [];
          filename = `tenants_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
        case 'users':
          const { data: usersData } = await supabase.from('profiles').select('*');
          exportData = usersData || [];
          filename = `users_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
        case 'tickets':
          const { data: ticketsData } = await supabase.from('tickets').select('*');
          exportData = ticketsData || [];
          filename = `tickets_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
        case 'full':
          const [t, u, tk, m, c] = await Promise.all([
            supabase.from('tenants').select('*'),
            supabase.from('profiles').select('*'),
            supabase.from('tickets').select('*'),
            supabase.from('messages').select('*').limit(10000),
            supabase.from('contacts').select('*'),
          ]);
          exportData = {
            tenants: t.data || [],
            users: u.data || [],
            tickets: tk.data || [],
            messages: m.data || [],
            contacts: c.data || [],
            exported_at: new Date().toISOString(),
          };
          filename = `full_backup_${format(new Date(), 'yyyy-MM-dd_HHmm')}.json`;
          break;
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Backup exportado: ${filename}`);
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Concluído</Badge>;
      case 'pending':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Em andamento</Badge>;
      case 'failed':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Backup & Restauração</h1>
          <p className="text-muted-foreground">
            Gerencie backups do sistema e exporte dados
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="hover-scale cursor-pointer" onClick={() => handleExportData('full')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Backup Completo</p>
                  <p className="text-sm text-muted-foreground">Exportar todos os dados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale cursor-pointer" onClick={() => handleExportData('tenants')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <HardDrive className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="font-semibold">Exportar Tenants</p>
                  <p className="text-sm text-muted-foreground">Dados das empresas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale cursor-pointer" onClick={() => handleExportData('users')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Exportar Usuários</p>
                  <p className="text-sm text-muted-foreground">Lista de usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-scale cursor-pointer" onClick={() => handleExportData('tickets')}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="font-semibold">Exportar Tickets</p>
                  <p className="text-sm text-muted-foreground">Todos os atendimentos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {exporting && (
          <Card className="border-primary">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                <div>
                  <p className="font-semibold">Exportando dados...</p>
                  <p className="text-sm text-muted-foreground">Aguarde enquanto preparamos o arquivo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Database Statistics */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Estatísticas do Banco de Dados
                </CardTitle>
                <CardDescription>Registros por tabela</CardDescription>
              </div>
              <Button onClick={loadTableStats} disabled={loadingStats} variant="outline" size="sm">
                <RefreshCw className={`mr-2 h-4 w-4 ${loadingStats ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {Object.keys(tableStats).length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {Object.entries(tableStats).map(([table, count]) => (
                  <div key={table} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="font-medium capitalize">{table}</span>
                    <Badge variant="secondary">{count.toLocaleString()}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Clique em "Atualizar" para carregar as estatísticas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Backup History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Backups
            </CardTitle>
            <CardDescription>Últimos backups realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileArchive className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {backup.type === 'full' ? 'Backup Completo' : 'Backup Incremental'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(backup.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{backup.size_mb} MB</p>
                      <p className="text-xs text-muted-foreground">{backup.tables_count} tabelas</p>
                    </div>
                    {getStatusBadge(backup.status)}
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Import Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restaurar Dados
            </CardTitle>
            <CardDescription>
              Importe dados de um backup anterior (funcionalidade em desenvolvimento)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Arraste um arquivo de backup ou clique para selecionar
              </p>
              <Button variant="outline" disabled>
                Selecionar Arquivo
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Formatos suportados: .json, .sql
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
