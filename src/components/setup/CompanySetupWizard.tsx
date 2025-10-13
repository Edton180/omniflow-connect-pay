import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface CompanySetupWizardProps {
  userId: string;
  onComplete: () => void;
}

export const CompanySetupWizard = ({ userId, onComplete }: CompanySetupWizardProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");

  const handleSetup = async () => {
    if (!companyName.trim()) {
      toast({
        title: "Erro",
        description: "Digite o nome da empresa",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Chamar função que cria tenant e associa usuário
      const { data, error } = await supabase.rpc('auto_assign_tenant', {
        _user_id: userId,
        _company_name: companyName.trim()
      });

      if (error) throw error;

      // Marcar setup como completo
      await supabase
        .from('profiles')
        .update({ setup_completed: true })
        .eq('id', userId);

      toast({
        title: "Empresa criada!",
        description: "Sua conta foi configurada com sucesso",
      });

      onComplete();
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erro ao criar empresa",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Bem-vindo ao OmniFlow!</CardTitle>
          <CardDescription>
            Vamos configurar sua empresa para começar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="company">Nome da Empresa *</Label>
            <Input
              id="company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ex: Minha Empresa Ltda"
              disabled={loading}
            />
          </div>
          <Button 
            onClick={handleSetup} 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              "Criando empresa..."
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Criar Empresa e Começar
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Você será o administrador desta empresa e poderá convidar outros usuários depois.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};