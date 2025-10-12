import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Trash2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const SystemReset = () => {
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleResetSystem = async () => {
    const confirmation = window.prompt(
      'Esta ação vai DELETAR TODOS os usuários e dados do sistema!\n\nPara confirmar, digite: DELETAR TUDO'
    );

    if (confirmation !== 'DELETAR TUDO') {
      toast({
        title: "Operação cancelada",
        description: "Você precisa digitar exatamente 'DELETAR TUDO' para confirmar.",
        variant: "destructive",
      });
      return;
    }

    setDeleting(true);
    try {
      console.log('Calling delete-all-users function...');
      
      const { data, error } = await supabase.functions.invoke('delete-all-users', {
        body: {}
      });
      
      console.log('Function response:', { data, error });

      if (error) {
        console.error('Error from function:', error);
        throw error;
      }

      // Primeiro fazer logout
      console.log('Signing out...');
      await supabase.auth.signOut();
      
      // Limpar todo o localStorage
      console.log('Clearing localStorage...');
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: "✅ Sistema Resetado!",
        description: data.message || "Todos os dados foram deletados. Você será redirecionado para fazer o primeiro cadastro.",
      });

      // Aguardar e redirecionar
      setTimeout(() => {
        window.location.href = '/auth';
      }, 2000);
      
    } catch (error: any) {
      console.error('Error deleting users:', error);
      toast({
        title: "Erro ao resetar sistema",
        description: error.message || "Ocorreu um erro ao tentar deletar os dados.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-destructive">Reset Completo do Sistema</CardTitle>
          </div>
          <CardDescription>
            Esta página permite resetar completamente o sistema, deletando TODOS os usuários e dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              ⚠️ ATENÇÃO - Esta ação é IRREVERSÍVEL!
            </h3>
            <p className="text-sm text-muted-foreground">
              Ao clicar no botão abaixo, você irá:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
              <li>Deletar todos os usuários do sistema (auth.users)</li>
              <li>Limpar todas as tabelas do banco de dados</li>
              <li>Remover todos os perfis, roles e permissões</li>
              <li>Apagar tickets, mensagens, contatos e canais</li>
              <li>Eliminar planos, pagamentos e assinaturas</li>
            </ul>
            <p className="text-sm text-muted-foreground font-semibold mt-3">
              Após o reset, você poderá cadastrar um novo primeiro usuário que automaticamente se tornará super_admin.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleResetSystem}
              disabled={deleting}
              variant="destructive"
              className="w-full h-12 text-lg"
            >
              {deleting ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Resetando Sistema...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-5 w-5" />
                  Resetar Sistema Completamente
                </>
              )}
            </Button>

            <Button
              onClick={() => navigate('/auth')}
              variant="outline"
              className="w-full"
              disabled={deleting}
            >
              Cancelar
            </Button>
          </div>

          <div className="text-xs text-center text-muted-foreground border-t pt-4">
            <p>Esta é uma função administrativa crítica.</p>
            <p>Use apenas se você tem certeza do que está fazendo.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemReset;
