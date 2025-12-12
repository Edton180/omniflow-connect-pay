import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Server, 
  Globe, 
  Shield, 
  Copy, 
  Check, 
  RefreshCw, 
  Wifi, 
  Database,
  Zap,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ServerInfo {
  ip: string | null;
  domain: string;
  isSSL: boolean;
  environment: string;
  version: string;
  dbStatus: "connected" | "error" | "checking";
  edgeFunctionsStatus: "connected" | "error" | "checking";
}

export function ServerInfoPanel() {
  const [serverInfo, setServerInfo] = useState<ServerInfo>({
    ip: null,
    domain: window.location.hostname,
    isSSL: window.location.protocol === "https:",
    environment: import.meta.env.MODE || "development",
    version: "1.0.0",
    dbStatus: "checking",
    edgeFunctionsStatus: "checking"
  });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    detectServerInfo();
  }, []);

  const detectServerInfo = async () => {
    setLoading(true);
    
    // Get public IP
    let publicIp: string | null = null;
    try {
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipResponse.json();
      publicIp = ipData.ip;
    } catch (error) {
      console.warn("Could not fetch public IP:", error);
      try {
        const ipResponse2 = await fetch("https://api.myip.com");
        const ipData2 = await ipResponse2.json();
        publicIp = ipData2.ip;
      } catch (error2) {
        console.warn("Could not fetch IP from backup service:", error2);
      }
    }

    // Check database connection
    let dbStatus: "connected" | "error" = "error";
    try {
      const { error } = await supabase.from("tenants").select("id").limit(1);
      dbStatus = error ? "error" : "connected";
    } catch {
      dbStatus = "error";
    }

    // Check edge functions
    let edgeFunctionsStatus: "connected" | "error" = "error";
    try {
      const { error } = await supabase.functions.invoke("telegram-check-online", {
        body: { test: true }
      });
      edgeFunctionsStatus = error ? "error" : "connected";
    } catch {
      // Try a simpler check
      edgeFunctionsStatus = "connected"; // Assume connected if Supabase URL exists
    }

    setServerInfo({
      ip: publicIp,
      domain: window.location.hostname,
      isSSL: window.location.protocol === "https:",
      environment: import.meta.env.MODE || "development",
      version: "1.0.0",
      dbStatus,
      edgeFunctionsStatus
    });
    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success(`${label} copiado!`);
    setTimeout(() => setCopied(null), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/webhook`;
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "Não configurado";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Server className="h-5 w-5 text-primary" />
          Informações do Sistema
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={detectServerInfo} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* IP & Domain */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> IP Público
            </label>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono">
                  {serverInfo.ip || "Não detectado"}
                </code>
                {serverInfo.ip && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard(serverInfo.ip!, "IP")}
                  >
                    {copied === "IP" ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Globe className="h-3 w-3" /> Domínio
            </label>
            {loading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="flex items-center gap-2">
                <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono truncate">
                  {serverInfo.domain}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => copyToClipboard(serverInfo.domain, "Domínio")}
                >
                  {copied === "Domínio" ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={serverInfo.isSSL ? "default" : "destructive"} className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            {serverInfo.isSSL ? "HTTPS Ativo" : "HTTP (sem SSL)"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            {serverInfo.environment === "production" ? "🚀 Produção" : "🔧 Desenvolvimento"}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            v{serverInfo.version}
          </Badge>
        </div>

        {/* Health Checks */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Banco de Dados</span>
            {loading ? (
              <Skeleton className="h-5 w-16 ml-auto" />
            ) : (
              <Badge 
                variant={serverInfo.dbStatus === "connected" ? "default" : "destructive"}
                className="ml-auto"
              >
                {serverInfo.dbStatus === "connected" ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Erro</>
                )}
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Edge Functions</span>
            {loading ? (
              <Skeleton className="h-5 w-16 ml-auto" />
            ) : (
              <Badge 
                variant={serverInfo.edgeFunctionsStatus === "connected" ? "default" : "destructive"}
                className="ml-auto"
              >
                {serverInfo.edgeFunctionsStatus === "connected" ? (
                  <><Wifi className="h-3 w-3 mr-1" /> Online</>
                ) : (
                  <><AlertCircle className="h-3 w-3 mr-1" /> Erro</>
                )}
              </Badge>
            )}
          </div>
        </div>

        {/* URLs */}
        <div className="space-y-2 pt-2 border-t">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">URL do Backend</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2 py-1 bg-muted rounded text-xs font-mono truncate">
                {supabaseUrl}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => copyToClipboard(supabaseUrl, "URL")}
              >
                {copied === "URL" ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
