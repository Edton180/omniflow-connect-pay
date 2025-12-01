import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function usePresence(tenantId: string | null) {
  const { user } = useAuth();

  const updatePresence = useCallback(async (isOnline: boolean) => {
    if (!user?.id || !tenantId) return;

    try {
      await supabase
        .from("user_presence")
        .upsert({
          user_id: user.id,
          tenant_id: tenantId,
          is_online: isOnline,
          last_seen: new Date().toISOString(),
        });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }, [user?.id, tenantId]);

  useEffect(() => {
    if (!user?.id || !tenantId) return;

    // Set online on mount
    updatePresence(true);

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      updatePresence(true);
    }, 30000);

    // Set offline on unmount
    const handleBeforeUnload = () => {
      updatePresence(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      updatePresence(false);
    };
  }, [user?.id, tenantId, updatePresence]);

  return { updatePresence };
}
