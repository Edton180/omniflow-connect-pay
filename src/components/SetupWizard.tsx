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
      toast.error('Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          tenant_id: null
        });

      if (profileError) throw profileError;

      // Create super_admin role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          tenant_id: null,
          role: 'super_admin'
        });

      if (roleError) throw roleError;

      toast.success('Account setup complete!');
      await refetchProfile();
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Setup error:', error);
      toast.error(error.message || 'Failed to setup account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center gradient-hero p-4">
      <Card className="w-full max-w-md gradient-card">
        <CardHeader>
          <CardTitle>Complete Your Setup</CardTitle>
          <CardDescription>
            Let's set up your account as a Super Admin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleSetup}
            disabled={loading || !fullName.trim()}
            className="w-full"
          >
            {loading ? 'Setting up...' : 'Complete Setup'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};