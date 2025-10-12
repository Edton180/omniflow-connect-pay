import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ForceLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      console.log('Force logout initiated...');
      
      try {
        // Fazer logout do Supabase
        await supabase.auth.signOut();
        
        // Limpar todo o armazenamento local
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpar cookies
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // Limpar cache do service worker se existir
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
        }
        
        console.log('Logout complete, cache cleared, redirecting to auth...');
      } catch (error) {
        console.error('Error during logout:', error);
      }
      
      // Redirecionar para auth após 1 segundo
      setTimeout(() => {
        navigate('/auth', { replace: true });
        // Forçar reload para garantir limpeza completa
        window.location.href = '/auth';
      }, 1000);
    };
    
    logout();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground">Limpando sessão...</p>
      </div>
    </div>
  );
};

export default ForceLogout;
