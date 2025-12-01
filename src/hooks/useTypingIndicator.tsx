import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UseTypingIndicatorProps {
  conversationUserId?: string;
  teamId?: string;
  tenantId: string | null;
}

export function useTypingIndicator({
  conversationUserId,
  teamId,
  tenantId,
}: UseTypingIndicatorProps) {
  const { user } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const sendTypingIndicator = useCallback(async () => {
    if (!user?.id || !tenantId) return;

    try {
      await supabase.from("typing_indicators").upsert({
        user_id: user.id,
        conversation_user_id: conversationUserId || null,
        team_id: teamId || null,
        tenant_id: tenantId,
        updated_at: new Date().toISOString(),
      });

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Auto-clear after 3 seconds
      timeoutRef.current = setTimeout(async () => {
        await supabase
          .from("typing_indicators")
          .delete()
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId);
      }, 3000);
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  }, [user?.id, conversationUserId, teamId, tenantId]);

  useEffect(() => {
    if (!user?.id || !tenantId) return;

    const channel = supabase
      .channel(`typing:${conversationUserId || teamId || "general"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_indicators",
          filter: conversationUserId
            ? `conversation_user_id=eq.${conversationUserId}`
            : teamId
            ? `team_id=eq.${teamId}`
            : undefined,
        },
        async (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const typingUser = payload.new as any;
            if (typingUser.user_id !== user.id) {
              const { data } = await supabase
                .from("profiles")
                .select("full_name")
                .eq("id", typingUser.user_id)
                .single();

              if (data) {
                setTypingUsers((prev) =>
                  prev.includes(data.full_name) ? prev : [...prev, data.full_name]
                );

                // Remove after 4 seconds
                setTimeout(() => {
                  setTypingUsers((prev) => prev.filter((name) => name !== data.full_name));
                }, 4000);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user?.id, conversationUserId, teamId, tenantId]);

  return { typingUsers, sendTypingIndicator };
}
