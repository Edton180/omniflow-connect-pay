import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export function useNotifications() {
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    // Get user tenant
    const getUserTenant = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("tenant_id")
        .eq("user_id", user.id)
        .maybeSingle();

      return data?.tenant_id;
    };

    getUserTenant().then((tenantId) => {
      if (!tenantId) return;

      // Subscribe to new tickets
      const ticketChannel = supabase
        .channel("new-tickets")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "tickets",
            filter: `tenant_id=eq.${tenantId}`,
          },
          (payload) => {
            console.log("New ticket notification:", payload);

            // Show toast notification
            toast({
              title: "Novo Ticket!",
              description: `Um novo ticket chegou do canal ${payload.new.channel}`,
            });

            // Show browser notification if permission granted
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Novo Ticket - OmniFlow", {
                body: `Um novo ticket chegou do canal ${payload.new.channel}`,
                icon: "/favicon.ico",
                tag: "new-ticket",
              });
            }

            // Play notification sound
            const audio = new Audio("/notification.mp3");
            audio.play().catch((e) => console.log("Audio play failed:", e));
          }
        )
        .subscribe();

      // Subscribe to ticket assignments
      const assignmentChannel = supabase
        .channel("ticket-assignments")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "tickets",
            filter: `assigned_to=eq.${user.id}`,
          },
          (payload) => {
            console.log("Ticket assigned:", payload);

            toast({
              title: "Ticket Atribuído!",
              description: "Um ticket foi atribuído a você",
            });

            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Ticket Atribuído - OmniFlow", {
                body: "Um ticket foi atribuído a você",
                icon: "/favicon.ico",
                tag: "ticket-assigned",
              });
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ticketChannel);
        supabase.removeChannel(assignmentChannel);
      };
    });
  }, [user?.id, toast]);
}
