import { AppLayout } from "@/components/layout/AppLayout";
import { ReportExporter } from "@/components/reports/ReportExporter";
import { useAuth } from "@/hooks/useAuth";
import { FileBarChart } from "lucide-react";

export default function ExportReports() {
  const { roles, profile } = useAuth();
  const tenantId = roles.find(r => r.tenant_id)?.tenant_id;

  if (!tenantId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Nenhum tenant encontrado</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileBarChart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Exportar Relatórios</h1>
            <p className="text-muted-foreground">Gere relatórios detalhados em PDF ou Excel</p>
          </div>
        </div>

        <ReportExporter tenantId={tenantId} tenantName={profile?.full_name || "Empresa"} />
      </div>
    </AppLayout>
  );
}
