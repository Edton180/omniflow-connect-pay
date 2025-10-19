import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { QrCode, CheckCircle2, XCircle, Loader2, RefreshCw, Trash2, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCodeReact from "react-qr-code";

interface EvolutionConnectionProps {
  channel: any;
  onStatusChange?: (status: string) => void;
}

export function EvolutionConnection({ channel, onStatusChange }: EvolutionConnectionProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'qr' | 'connected'>('disconnected');
  const [qrCode, setQrCode] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [instanceName, setInstanceName] = useState<string>('');

  useEffect(() => {
    loadStatus();
    
    // Poll status every 5 seconds when connecting
    const interval = setInterval(() => {
      if (status === 'connecting' || status === 'qr') {
        loadStatus();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [channel.id, status]);

  const loadStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: {
          action: 'status',
          channelId: channel.id,
        },
      });

      if (error) throw error;

      setStatus(data.status);
      setQrCode(data.qr_code || '');
      setPhoneNumber(data.phone_number || '');
      setInstanceName(data.instance_name || '');
      
      if (onStatusChange) {
        onStatusChange(data.status);
      }
    } catch (error: any) {
      console.error('Error loading status:', error);
      if (error.message?.includes('credentials not configured')) {
        toast.error('Configure as credenciais da Evolution API nas Configurações de Canais');
      }
    }
  };

  const handleConnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: {
          action: 'create',
          channelId: channel.id,
          instanceName: `channel_${channel.id.substring(0, 8)}`,
        },
      });

      if (error) throw error;

      setStatus(data.status);
      setQrCode(data.qr_code);
      setInstanceName(data.instance_name);
      
      toast.success('Conexão iniciada! Escaneie o QR Code.');
    } catch (error: any) {
      console.error('Error starting connection:', error);
      const message = error.message?.includes('credentials not configured')
        ? 'Configure as credenciais primeiro'
        : error.message;
      toast.error('Erro ao iniciar conexão: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: {
          action: 'logout',
          channelId: channel.id,
        },
      });

      if (error) throw error;

      setStatus('disconnected');
      setQrCode('');
      setPhoneNumber('');
      
      toast.success('Desconectado com sucesso!');
    } catch (error: any) {
      console.error('Error stopping connection:', error);
      toast.error('Erro ao desconectar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('evolution-whatsapp', {
        body: {
          action: 'delete',
          channelId: channel.id,
        },
      });

      if (error) throw error;

      setStatus('disconnected');
      setQrCode('');
      setPhoneNumber('');
      setInstanceName('');
      
      toast.success('Instância deletada com sucesso!');
      
      // Recarregar a lista de canais
      window.location.reload();
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      toast.error('Erro ao deletar instância: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Conectado</Badge>;
      case 'connecting':
      case 'qr':
        return <Badge className="bg-yellow-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Aguardando QR</Badge>;
      case 'disconnected':
      default:
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Desconectado</Badge>;
    }
  };

  return (
    <Card className="gradient-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Evolution API
            </CardTitle>
            <CardDescription>Conexão profissional via Evolution API</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {instanceName && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Instância:</p>
            <p className="font-mono text-sm">{instanceName}</p>
          </div>
        )}

        {phoneNumber && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Número conectado:</p>
            <p className="font-semibold">{phoneNumber}</p>
          </div>
        )}

        {(status === 'qr' || status === 'connecting') && qrCode && (
          <div className="flex flex-col items-center space-y-4 p-6 bg-white rounded-lg">
            <div className="p-4 bg-white border-2 border-border rounded-lg">
              <QRCodeReact value={qrCode} size={200} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm font-medium">Escaneie com seu WhatsApp</p>
              <ol className="text-xs text-muted-foreground text-left space-y-1">
                <li>1. Abra o WhatsApp no seu telefone</li>
                <li>2. Toque em Menu ou Configurações</li>
                <li>3. Toque em Aparelhos conectados</li>
                <li>4. Toque em Conectar um aparelho</li>
                <li>5. Aponte seu telefone para esta tela</li>
              </ol>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStatus}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          {status === 'disconnected' ? (
            <Button
              onClick={handleConnect}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Criando instância...</>
              ) : (
                <><QrCode className="mr-2 h-4 w-4" />Conectar WhatsApp</>
              )}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={loadStatus}
                disabled={loading}
                className="flex-1"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Atualizar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Desconectando...</>
                ) : (
                  <><XCircle className="mr-2 h-4 w-4" />Desconectar</>
                )}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={loading}
                size="icon"
                title="Deletar instância"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>

        <div className="p-3 bg-accent/10 rounded-lg space-y-2">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Sobre Evolution API
          </h4>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• API REST profissional para WhatsApp</li>
            <li>• Múltiplas instâncias simultâneas</li>
            <li>• Webhooks para eventos em tempo real</li>
            <li>• Suporte a mídia, áudio e documentos</li>
            <li>• Alta disponibilidade e escalabilidade</li>
            <li>• Ideal para produção</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
