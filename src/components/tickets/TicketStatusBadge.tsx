import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle, CircleDot } from "lucide-react";

interface TicketStatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function TicketStatusBadge({ status, size = "md" }: TicketStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "open":
        return {
          label: "Aberto",
          icon: CircleDot,
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "in_progress":
        return {
          label: "Em Atendimento",
          icon: Clock,
          className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        };
      case "pending":
        return {
          label: "Pendente",
          icon: AlertCircle,
          className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
        };
      case "resolved":
        return {
          label: "Resolvido",
          icon: CheckCircle,
          className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        };
      case "closed":
        return {
          label: "Fechado",
          icon: XCircle,
          className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        };
      default:
        return {
          label: status,
          icon: CircleDot,
          className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : size === "lg" ? "h-5 w-5" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : size === "lg" ? "text-base" : "text-sm";

  return (
    <Badge variant="outline" className={`${config.className} ${textSize} gap-1.5`}>
      <Icon className={iconSize} />
      {config.label}
    </Badge>
  );
}
