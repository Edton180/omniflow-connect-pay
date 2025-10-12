import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { User, Session } from '@supabase/supabase-js';

export type UserRole = 'super_admin' | 'tenant_admin' | 'manager' | 'agent' | 'user';

export interface UserProfile {
  id: string;
  tenant_id: string | null;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<{ role: string; tenant_id: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, tenant_id')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      setProfile(profileData);
      setRoles(rolesData || []);
    } catch (error) {
      logger.error('Error fetching profile:', error);
      setProfile(null);
      setRoles([]);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Use setTimeout to defer Supabase calls and prevent deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: fullName,
        },
      },
    });

    // If signup successful and user is confirmed, check if they should be super_admin
    if (data.user && !error) {
      try {
        // Check if any super_admin exists
        const { data: existingSuperAdmin } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role', 'super_admin')
          .maybeSingle();

        // If no super_admin exists, make this user the super_admin
        if (!existingSuperAdmin) {
          await supabase.from('user_roles').insert({
            user_id: data.user.id,
            tenant_id: null,
            role: 'super_admin'
          });
          
          logger.info('First user registered as super_admin');
        }
      } catch (roleError) {
        logger.error('Error assigning super_admin role:', roleError);
      }
    }

    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: UserRole) => {
    return roles.some(r => r.role === role);
  };

  const isSuperAdmin = hasRole('super_admin');

  return {
    user,
    session,
    profile,
    roles,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole,
    isSuperAdmin,
    refetchProfile: user ? () => fetchProfile(user.id) : () => Promise.resolve(),
  };
};