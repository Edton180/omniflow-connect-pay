import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FileDown, FileSpreadsheet, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { supabase } from "@/integrations/supabase/client";

interface ReportData {
  tickets: any[];
  messages: any[];
  agents: any[];
  evaluations: any[];
}

interface ReportExporterProps {
  tenantId: string;
  tenantName?: string;
}

export function ReportExporter({ tenantId, tenantName = "Empresa" }: ReportExporterProps) {
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState("performance");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const fetchReportData = async (): Promise<ReportData> => {
    const startStr = startDate.toISOString();
    const endStr = endDate.toISOString();

    const [ticketsRes, messagesRes, agentsRes, evaluationsRes] = await Promise.all([
      supabase
        .from("tickets")
        .select("*, contact:contacts(name), assigned:profiles(full_name), queue:queues(name)")
        .eq("tenant_id", tenantId)
        .gte("created_at", startStr)
        .lte("created_at", endStr),
      supabase
        .from("messages")
        .select("*, ticket:tickets!inner(tenant_id)")
        .eq("ticket.tenant_id", tenantId)
        .gte("created_at", startStr)
        .lte("created_at", endStr),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("tenant_id", tenantId),
      supabase
        .from("evaluations")
        .select("*")
        .eq("tenant_id", tenantId)
        .gte("created_at", startStr)
        .lte("created_at", endStr)
    ]);

    return {
      tickets: ticketsRes.data || [],
      messages: messagesRes.data || [],
      agents: agentsRes.data || [],
      evaluations: evaluationsRes.data || []
    };
  };

  const calculateMetrics = (data: ReportData) => {
    const { tickets, messages, agents, evaluations } = data;

    // Tickets by status
    const ticketsByStatus = tickets.reduce((acc: any, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});

    // Tickets by channel
    const ticketsByChannel = tickets.reduce((acc: any, t) => {
      acc[t.channel] = (acc[t.channel] || 0) + 1;
      return acc;
    }, {});

    // Agent performance
    const agentPerformance = agents.map(agent => {
      const agentTickets = tickets.filter(t => t.assigned_to === agent.id);
      const agentMessages = messages.filter(m => m.sender_id === agent.id);
      const agentEvals = evaluations.filter(e => e.agent_id === agent.id);
      const avgRating = agentEvals.length > 0
        ? agentEvals.reduce((sum, e) => sum + e.score, 0) / agentEvals.length
        : 0;

      return {
        name: agent.full_name || "Sem nome",
        totalTickets: agentTickets.length,
        resolvedTickets: agentTickets.filter(t => t.status === "closed" || t.status === "resolved").length,
        messages: agentMessages.length,
        avgRating: avgRating.toFixed(1),
        evaluations: agentEvals.length
      };
    });

    // CSAT
    const avgCsat = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length
      : 0;

    return {
      totalTickets: tickets.length,
      closedTickets: tickets.filter(t => t.status === "closed" || t.status === "resolved").length,
      avgCsat: avgCsat.toFixed(1),
      ticketsByStatus,
      ticketsByChannel,
      agentPerformance,
      totalEvaluations: evaluations.length
    };
  };

  const exportToPDF = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData();
      const metrics = calculateMetrics(data);
      
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      // Header
      doc.setFillColor(99, 102, 241);
      doc.rect(0, 0, pageWidth, 40, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.text("Relatório de Performance", 14, 25);
      doc.setFontSize(10);
      doc.text(`${tenantName} | ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`, 14, 35);

      // Reset colors
      doc.setTextColor(0, 0, 0);
      
      // KPIs
      let yPos = 55;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Indicadores Principais", 14, yPos);
      yPos += 10;
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const kpis = [
        ["Total de Tickets", metrics.totalTickets.toString()],
        ["Tickets Resolvidos", metrics.closedTickets.toString()],
        ["Taxa de Resolução", `${((metrics.closedTickets / metrics.totalTickets) * 100 || 0).toFixed(1)}%`],
        ["CSAT Médio", `${metrics.avgCsat}/5`],
        ["Total de Avaliações", metrics.totalEvaluations.toString()]
      ];
      
      autoTable(doc, {
        startY: yPos,
        head: [["Indicador", "Valor"]],
        body: kpis,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Tickets by Status
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Tickets por Status", 14, yPos);
      yPos += 10;

      const statusData = Object.entries(metrics.ticketsByStatus).map(([status, count]) => [
        status.charAt(0).toUpperCase() + status.slice(1),
        count.toString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Status", "Quantidade"]],
        body: statusData,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Agent Performance Table
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Performance por Agente", 14, yPos);
      yPos += 10;

      const agentData = metrics.agentPerformance.map(a => [
        a.name,
        a.totalTickets.toString(),
        a.resolvedTickets.toString(),
        a.messages.toString(),
        a.avgRating,
        a.evaluations.toString()
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [["Agente", "Tickets", "Resolvidos", "Mensagens", "CSAT", "Avaliações"]],
        body: agentData,
        theme: "grid",
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14 }
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128);
        doc.text(
          `Gerado em ${format(new Date(), "dd/MM/yyyy HH:mm")} | Página ${i} de ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: "center" }
        );
      }

      doc.save(`relatorio-${reportType}-${format(new Date(), "yyyy-MM-dd")}.pdf`);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar relatório PDF");
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData();
      const metrics = calculateMetrics(data);
      
      const workbook = XLSX.utils.book_new();

      // KPIs Sheet
      const kpisSheet = XLSX.utils.aoa_to_sheet([
        ["Relatório de Performance"],
        [`Período: ${format(startDate, "dd/MM/yyyy")} - ${format(endDate, "dd/MM/yyyy")}`],
        [],
        ["Indicador", "Valor"],
        ["Total de Tickets", metrics.totalTickets],
        ["Tickets Resolvidos", metrics.closedTickets],
        ["Taxa de Resolução", `${((metrics.closedTickets / metrics.totalTickets) * 100 || 0).toFixed(1)}%`],
        ["CSAT Médio", metrics.avgCsat],
        ["Total de Avaliações", metrics.totalEvaluations]
      ]);
      XLSX.utils.book_append_sheet(workbook, kpisSheet, "Resumo");

      // Tickets by Status
      const statusSheet = XLSX.utils.aoa_to_sheet([
        ["Status", "Quantidade"],
        ...Object.entries(metrics.ticketsByStatus)
      ]);
      XLSX.utils.book_append_sheet(workbook, statusSheet, "Por Status");

      // Tickets by Channel
      const channelSheet = XLSX.utils.aoa_to_sheet([
        ["Canal", "Quantidade"],
        ...Object.entries(metrics.ticketsByChannel)
      ]);
      XLSX.utils.book_append_sheet(workbook, channelSheet, "Por Canal");

      // Agent Performance
      const agentSheet = XLSX.utils.aoa_to_sheet([
        ["Agente", "Tickets", "Resolvidos", "Mensagens", "CSAT", "Avaliações"],
        ...metrics.agentPerformance.map(a => [
          a.name,
          a.totalTickets,
          a.resolvedTickets,
          a.messages,
          a.avgRating,
          a.evaluations
        ])
      ]);
      XLSX.utils.book_append_sheet(workbook, agentSheet, "Agentes");

      // Tickets Details
      const ticketsSheet = XLSX.utils.json_to_sheet(
        data.tickets.map(t => ({
          ID: t.id.slice(0, 8),
          Status: t.status,
          Canal: t.channel,
          Prioridade: t.priority,
          Contato: t.contact?.name || "-",
          Agente: t.assigned?.full_name || "-",
          Fila: t.queue?.name || "-",
          "Criado em": format(new Date(t.created_at), "dd/MM/yyyy HH:mm"),
          "Fechado em": t.closed_at ? format(new Date(t.closed_at), "dd/MM/yyyy HH:mm") : "-"
        }))
      );
      XLSX.utils.book_append_sheet(workbook, ticketsSheet, "Tickets");

      // Export
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `relatorio-${reportType}-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
      
      toast.success("Relatório Excel exportado com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast.error("Erro ao gerar relatório Excel");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileDown className="h-5 w-5" />
          Exportar Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="performance">Performance Geral</SelectItem>
                <SelectItem value="agents">Desempenho de Agentes</SelectItem>
                <SelectItem value="channels">Análise por Canal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data Inicial</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data Final</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => date && setEndDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} dias selecionados
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button onClick={exportToPDF} disabled={loading} className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
            Exportar PDF
          </Button>
          <Button onClick={exportToExcel} disabled={loading} variant="outline" className="flex-1">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Exportar Excel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
