import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export const SetupWizard = () => {
  const { user, refetchProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');

  const handleSetup = async () => {
    if (!user || !fullName.trim()) {
      toast.error('Por favor, insira seu nome completo');
      return;
    }

    setLoading(true);
    try {
      // Check if super admin already exists
      const { data: existingSuperAdmin } = await supabase
        .from('user_roles')
        .select('id')
        .eq('role', 'super_admin')
        .maybeSingle();

      if (existingSuperAdmin) {
        toast.error('Um Super Admin já existe no sistema');
        navigate('/dashboard');
        return;
      }
      // Upsert profile to avoid duplicate key error
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: fullName,
          tenant_id: null
        }, {
          onConflict: 'id'
        });

      if (profileError) throw profileError;

      // Check if role already exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'super_admin')
        .maybeSingle();

      if (!existingRole) {
        // Create super_admin role
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            tenant_id: null,
            role: 'super_admin'
          });

        if (roleError) throw roleError;
      }

      toast.success('Conta configurada com sucesso!');
      
      // Wait a bit for database to sync
      setTimeout(async () => {
        if (refetchProfile) await refetchProfile();
        navigate('/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Falha ao configurar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-full max-w-md shadow-2xl border-2 border-primary/20">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-gradient">Primeiros Passos</CardTitle>
          <CardDescription className="text-base text-foreground/90">
            Configure sua plataforma em minutos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="fullName" className="text-base font-semibold text-foreground">
              Nome Completo
            </Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Digite seu nome completo"
              disabled={loading}
              className="h-12 text-base"
            />
          </div>
          <Button
            onClick={handleSetup}
            disabled={loading || !fullName.trim()}
            className="w-full h-12 text-base font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
          >
            {loading ? 'Configurando...' : 'Começar Agora'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};