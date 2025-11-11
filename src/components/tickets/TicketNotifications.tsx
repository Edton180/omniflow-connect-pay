import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Bell, BellOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TicketNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const getTenantId = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.tenant_id) {
        setTenantId(data.tenant_id);
      }
    };

    getTenantId();
  }, [user?.id]);

  useEffect(() => {
    if (!tenantId) return;

    // Subscribe to new tickets
    const channel = supabase
      .channel("new-tickets-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "tickets",
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log("🔔 Novo ticket:", payload.new);

          // Show toast notification
          toast({
            title: "Novo Ticket!",
            description: `Ticket #${payload.new.id.slice(0, 8)} do canal ${payload.new.channel}`,
          });

          // Play notification sound
          if (soundEnabled) {
            try {
              const audio = new Audio("/notification.mp3");
              audio.volume = 0.5;
              audio.play().catch((e) => console.log("Erro ao reproduzir som:", e));
            } catch (e) {
              console.log("Erro ao criar audio:", e);
            }
          }

          // Browser notification if permission granted
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Novo Ticket - OmniFlow", {
              body: `Ticket do canal ${payload.new.channel}`,
              icon: "/favicon.ico",
              tag: "new-ticket",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId, soundEnabled, toast]);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setSoundEnabled(!soundEnabled)}
      title={soundEnabled ? "Desativar som de notificação" : "Ativar som de notificação"}
    >
      {soundEnabled ? (
        <Bell className="h-5 w-5" />
      ) : (
        <BellOff className="h-5 w-5" />
      )}
    </Button>
  );
}
