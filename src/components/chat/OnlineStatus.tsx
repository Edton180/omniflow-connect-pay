import { Badge } from "@/components/ui/badge";

interface OnlineStatusProps {
  isOnline: boolean;
  status?: "available" | "busy" | "away";
}

export function OnlineStatus({ isOnline, status = "available" }: OnlineStatusProps) {
  if (!isOnline) {
    return <Badge variant="secondary" className="text-xs">Offline</Badge>;
  }

  const statusConfig = {
    available: { label: "Online", color: "bg-green-500" },
    busy: { label: "Ocupado", color: "bg-red-500" },
    away: { label: "Ausente", color: "bg-yellow-500" },
  };

  const config = statusConfig[status];

  return (
    <div className="flex items-center gap-1">
      <span className={`w-2 h-2 rounded-full ${config.color}`} />
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
