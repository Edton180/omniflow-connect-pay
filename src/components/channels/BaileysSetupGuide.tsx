import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, QrCode, Smartphone, Zap } from "lucide-react";

export function BaileysSetupGuide() {
  return (
    <Card className="gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Como Conectar WhatsApp via Baileys
        </CardTitle>
        <CardDescription>
          Guia passo a passo para conectar seu WhatsApp usando QR Code
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <strong>Baileys</strong> é uma biblioteca de código aberto que permite conectar 
            o WhatsApp diretamente através de QR Code, sem necessidade de API paga.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <h4 className="font-semibold">Crie um Canal Baileys</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Novo Canal" e selecione "WhatsApp (Baileys QR)"
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <h4 className="font-semibold">Configure o Canal</h4>
              <p className="text-sm text-muted-foreground">
                Dê um nome ao canal e salve
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <h4 className="font-semibold">Conecte seu WhatsApp</h4>
              <p className="text-sm text-muted-foreground">
                Clique em "Conectar WhatsApp" no card do canal
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold">Escaneie o QR Code</h4>
              <p className="text-sm text-muted-foreground">
                Abra o WhatsApp → Menu → Aparelhos conectados → Conectar um aparelho
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold">Pronto!</h4>
              <p className="text-sm text-muted-foreground">
                Seu WhatsApp está conectado e pronto para receber mensagens
              </p>
            </div>
          </div>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/5">
          <AlertDescription className="text-sm">
            <strong>Importante:</strong> O WhatsApp deve permanecer com internet no celular. 
            A conexão Baileys funciona como um WhatsApp Web, mas com controle total via API.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
