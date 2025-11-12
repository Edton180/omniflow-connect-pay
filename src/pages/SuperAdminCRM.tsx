import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Loader2, Users2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  column_name: string;
  column_color: string;
  tenant_name: string;
}

export default function SuperAdminCRM() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (tenants.length > 0) {
      fetchAllLeads();
    }
  }, [selectedTenant, tenants]);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from("tenants")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar empresas",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchAllLeads = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("crm_leads")
        .select(`
          id,
          name,
          email,
          phone,
          tenant_id,
          crm_columns!inner(name, color),
          tenants!inner(name)
        `);

      if (selectedTenant !== "all") {
        query = query.eq("tenant_id", selectedTenant);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      const formattedLeads = data?.map((lead: any) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        column_name: lead.crm_columns.name,
        column_color: lead.crm_columns.color,
        tenant_name: lead.tenants.name,
      })) || [];

      setLeads(formattedLeads);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar leads",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading && leads.length === 0) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Todos os Leads do Sistema</h2>
            <p className="text-muted-foreground">Visualize todos os leads CRM de todas as empresas</p>
          </div>
          <div className="w-64">
            <Select value={selectedTenant} onValueChange={setSelectedTenant}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {tenants.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: lead.column_color }}
                  />
                  <Badge variant="outline" className="text-xs">{lead.column_name}</Badge>
                </div>
                <CardTitle className="text-base">{lead.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lead.email && (
                    <div className="text-sm text-muted-foreground">
                      📧 {lead.email}
                    </div>
                  )}
                  {lead.phone && (
                    <div className="text-sm text-muted-foreground">
                      📱 {lead.phone}
                    </div>
                  )}
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Empresa: </span>
                    <span className="text-xs font-medium">{lead.tenant_name}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {leads.length === 0 && (
          <Card>
            <CardContent className="p-12">
              <div className="text-center">
                <Users2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {selectedTenant === "all" 
                    ? "Nenhum lead encontrado no sistema"
                    : "Nenhum lead encontrado para esta empresa"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
