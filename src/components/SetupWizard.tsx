import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CompanySetupWizard } from './setup/CompanySetupWizard';
import { toast } from 'sonner';

export const SetupWizard = () => {
  const { user, profile, refetchProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsCompanySetup, setNeedsCompanySetup] = useState(false);

  useEffect(() => {
    const checkUserSetup = async () => {
      if (!user || authLoading) return;

      try {
        // Check if user has profile with setup completed
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('setup_completed, tenant_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // If setup is completed and has tenant, redirect to dashboard
        if (profileData?.setup_completed && profileData?.tenant_id) {
          navigate('/dashboard');
          return;
        }

        // Check if user has any roles
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role, tenant_id')
          .eq('user_id', user.id);

        // If user is super_admin and setup completed, go to dashboard
        if (rolesData?.some(r => r.role === 'super_admin') && profileData?.setup_completed) {
          navigate('/dashboard');
          return;
        }

        // If no tenant_id, user needs to create/join a company
        if (!profileData?.tenant_id) {
          setNeedsCompanySetup(true);
        } else {
          navigate('/dashboard');
        }
      } catch (error: any) {
        console.error('Setup check error:', error);
        toast.error('Erro ao verificar configuração');
      } finally {
        setCheckingSetup(false);
      }
    };

    checkUserSetup();
  }, [user, authLoading, navigate]);

  const handleCompanySetupComplete = async () => {
    if (refetchProfile) await refetchProfile();
    toast.success('Configuração concluída!');
    navigate('/dashboard');
  };

  if (checkingSetup || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando configuração...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (needsCompanySetup) {
    return <CompanySetupWizard userId={user.id} onComplete={handleCompanySetupComplete} />;
  }

  return null;
};