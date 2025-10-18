import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ServerDetectionResult {
  ip: string | null;
  domain: string | null;
  channelCode: string | null;
  loading: boolean;
}

export function useServerDetection(tenantId?: string) {
  const [serverInfo, setServerInfo] = useState<ServerDetectionResult>({
    ip: null,
    domain: null,
    channelCode: null,
    loading: true,
  });

  useEffect(() => {
    detectServerInfo();
  }, [tenantId]);

  const detectServerInfo = async () => {
    try {
      // 1. Get current domain
      const currentDomain = window.location.hostname;
      
      // 2. Try to get public IP from external service
      let publicIp: string | null = null;
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        publicIp = ipData.ip;
      } catch (error) {
        console.warn('Could not fetch public IP:', error);
        // Fallback: try another service
        try {
          const ipResponse2 = await fetch('https://api.myip.com');
          const ipData2 = await ipResponse2.json();
          publicIp = ipData2.ip;
        } catch (error2) {
          console.warn('Could not fetch IP from backup service:', error2);
        }
      }

      // 3. Generate channel code based on domain
      const channelCode = currentDomain
        .replace(/\.(lovableproject\.com|lovable\.app|localhost)$/, '')
        .replace(/[^a-zA-Z0-9-]/g, '-')
        .toLowerCase();

      // 4. If tenant_id provided, save to database
      if (tenantId) {
        const { error } = await supabase
          .from('tenants')
          .update({
            custom_domain: currentDomain === 'localhost' ? null : currentDomain,
          })
          .eq('id', tenantId);

        if (error) console.error('Error updating tenant domain:', error);
      }

      setServerInfo({
        ip: publicIp,
        domain: currentDomain,
        channelCode,
        loading: false,
      });
    } catch (error) {
      console.error('Error detecting server info:', error);
      setServerInfo(prev => ({ ...prev, loading: false }));
    }
  };

  return { ...serverInfo, refresh: detectServerInfo };
}
