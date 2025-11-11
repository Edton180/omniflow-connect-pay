import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ChevronUp, Minus, ChevronDown } from "lucide-react";

interface TicketPriorityIndicatorProps {
  priority: string;
  showLabel?: boolean;
}

export function TicketPriorityIndicator({ priority, showLabel = true }: TicketPriorityIndicatorProps) {
  const getPriorityConfig = () => {
    switch (priority) {
      case "urgent":
        return {
          icon: <AlertTriangle className="h-3 w-3" />,
          label: "Urgente",
          className: "bg-red-500 text-white hover:bg-red-600",
        };
      case "high":
        return {
          icon: <ChevronUp className="h-3 w-3" />,
          label: "Alta",
          className: "bg-orange-500 text-white hover:bg-orange-600",
        };
      case "medium":
        return {
          icon: <Minus className="h-3 w-3" />,
          label: "Média",
          className: "bg-yellow-500 text-white hover:bg-yellow-600",
        };
      case "low":
        return {
          icon: <ChevronDown className="h-3 w-3" />,
          label: "Baixa",
          className: "bg-green-500 text-white hover:bg-green-600",
        };
      default:
        return {
          icon: <Minus className="h-3 w-3" />,
          label: "Média",
          className: "bg-yellow-500 text-white hover:bg-yellow-600",
        };
    }
  };

  const config = getPriorityConfig();

  return (
    <Badge className={`${config.className} flex items-center gap-1`}>
      {config.icon}
      {showLabel && <span>{config.label}</span>}
    </Badge>
  );
}
