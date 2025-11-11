import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

interface TicketStatsProps {
  tickets: any[];
}

export const TicketStats = ({ tickets }: TicketStatsProps) => {
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const pendingTickets = tickets.filter(t => t.status === 'pending').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;
  const totalTickets = tickets.length;

  const stats = [
    {
      label: "Abertos",
      value: openTickets,
      icon: AlertCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-950",
    },
    {
      label: "Pendentes",
      value: pendingTickets,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-950",
    },
    {
      label: "Fechados",
      value: closedTickets,
      icon: CheckCircle2,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-950",
    },
    {
      label: "Total",
      value: totalTickets,
      icon: XCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className={`${stat.bgColor} p-2 rounded-lg`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
