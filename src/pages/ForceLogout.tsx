import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const ForceLogout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      console.log('Force logout initiated...');
      
      // Fazer logout do Supabase
      await supabase.auth.signOut();
      
      // Limpar todo o armazenamento local
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('Logout complete, redirecting to auth...');
      
      // Redirecionar para auth após 1 segundo
      setTimeout(() => {
        navigate('/auth', { replace: true });
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
