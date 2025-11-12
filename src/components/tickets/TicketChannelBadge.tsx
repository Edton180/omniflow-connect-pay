import { Badge } from "@/components/ui/badge";
import { MessageCircle, Send, Phone, Mail, Globe } from "lucide-react";

interface TicketChannelBadgeProps {
  channel: string;
  size?: "sm" | "md" | "lg";
}

export function TicketChannelBadge({ channel, size = "md" }: TicketChannelBadgeProps) {
  const getChannelConfig = () => {
    switch (channel?.toLowerCase()) {
      case "telegram":
        return {
          label: "Telegram",
          icon: Send,
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "whatsapp":
      case "waba":
        return {
          label: "WhatsApp",
          icon: MessageCircle,
          className: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        };
      case "instagram":
        return {
          label: "Instagram",
          icon: MessageCircle,
          className: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
        };
      case "facebook":
        return {
          label: "Facebook",
          icon: MessageCircle,
          className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "email":
        return {
          label: "E-mail",
          icon: Mail,
          className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
      case "webchat":
        return {
          label: "WebChat",
          icon: Globe,
          className: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
        };
      default:
        return {
          label: channel || "Desconhecido",
          icon: MessageCircle,
          className: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
        };
    }
  };

  const config = getChannelConfig();
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
