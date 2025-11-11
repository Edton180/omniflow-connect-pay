import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TicketTimerProps {
  createdAt: string;
  slaMinutes?: number;
  status: string;
}

export function TicketTimer({ createdAt, slaMinutes = 30, status }: TicketTimerProps) {
  const [elapsed, setElapsed] = useState("");
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const created = new Date(createdAt);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
      
      setElapsed(formatDistanceToNow(created, { addSuffix: true, locale: ptBR }));
      
      // Check if overdue and not closed
      if (status !== "closed" && diffInMinutes > slaMinutes) {
        setIsOverdue(true);
      } else {
        setIsOverdue(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [createdAt, slaMinutes, status]);

  return (
    <div className={`flex items-center gap-1 text-xs ${isOverdue ? "text-red-500 font-semibold" : "text-muted-foreground"}`}>
      <Clock className={`h-3 w-3 ${isOverdue ? "animate-pulse" : ""}`} />
      <span>{elapsed}</span>
      {isOverdue && <span className="ml-1">(SLA vencido)</span>}
    </div>
  );
}
