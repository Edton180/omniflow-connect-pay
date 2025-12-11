import { ExternalLink, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ChannelDocsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelType: string;
}

const channelDocs: Record<string, {
  title: string;
  description: string;
  steps: string[];
  url: string;
  secondaryUrl?: { label: string; url: string };
  tips?: string[];
}> = {
  whatsapp: {
    title: "WhatsApp Business API (WABA)",
    description: "Integre com a API oficial do WhatsApp Business da Meta",
    steps: [
      "Acesse o Meta Business Suite (business.facebook.com)",
      "Crie ou selecione uma conta Business",
      "Vá em Configurações > Contas do WhatsApp",
      "Clique em 'Adicionar' e siga o fluxo de verificação",
      "No Facebook Developers, crie um app do tipo 'Business'",
      "Adicione o produto 'WhatsApp' ao app",
      "Obtenha o Phone Number ID e Access Token",
      "Configure o Verify Token para o webhook"
    ],
    url: "https://developers.facebook.com/docs/whatsapp/cloud-api/get-started",
    secondaryUrl: {
      label: "Meta Business Suite",
      url: "https://business.facebook.com"
    },
    tips: [
      "O número deve ser verificado no WhatsApp Business",
      "Templates de mensagem precisam ser aprovados pela Meta",
      "O Verify Token é criado por você (qualquer string segura)"
    ]
  },
  telegram: {
    title: "Telegram Bot",
    description: "Crie um bot no Telegram usando o BotFather",
    steps: [
      "Abra o Telegram e pesquise por @BotFather",
      "Envie o comando /newbot",
      "Escolha um nome para seu bot (ex: Minha Empresa Bot)",
      "Escolha um username único terminando em 'bot' (ex: minhaempresa_bot)",
      "Copie o token de API fornecido",
      "Cole o token na configuração do canal"
    ],
    url: "https://core.telegram.org/bots#6-botfather",
    secondaryUrl: {
      label: "Abrir BotFather",
      url: "https://t.me/BotFather"
    },
    tips: [
      "O token tem formato: 123456789:ABCdefGHI...",
      "Guarde o token em segurança, não compartilhe",
      "Você pode personalizar o bot com /setdescription e /setuserpic"
    ]
  },
  facebook: {
    title: "Facebook Messenger",
    description: "Conecte sua página do Facebook para receber mensagens",
    steps: [
      "Acesse developers.facebook.com e crie uma conta de desenvolvedor",
      "Crie um novo app do tipo 'Business'",
      "Adicione o produto 'Messenger' ao app",
      "Vincule uma página do Facebook ao app",
      "Gere um Page Access Token (token permanente)",
      "Copie o App Secret nas configurações do app",
      "Configure o webhook com seu Verify Token"
    ],
    url: "https://developers.facebook.com/docs/messenger-platform/getting-started",
    secondaryUrl: {
      label: "Facebook Developers",
      url: "https://developers.facebook.com"
    },
    tips: [
      "A página precisa estar publicada",
      "Solicite as permissões pages_messaging",
      "Para produção, o app precisa ser revisado pela Meta"
    ]
  },
  instagram: {
    title: "Instagram Direct",
    description: "Receba mensagens diretas do Instagram Business/Creator",
    steps: [
      "Converta seu perfil para Business ou Creator no Instagram",
      "Vincule o Instagram a uma Página do Facebook",
      "No Facebook Developers, adicione 'Instagram' ao seu app",
      "Configure as permissões instagram_manage_messages",
      "Obtenha o Access Token e Instagram Account ID",
      "Configure o webhook para mensagens"
    ],
    url: "https://developers.facebook.com/docs/instagram-api/getting-started",
    tips: [
      "Conta pessoal não funciona, precisa ser Business/Creator",
      "A página do Facebook deve estar vinculada",
      "O app precisa de revisão para produção"
    ]
  },
  email: {
    title: "Email SMTP/IMAP",
    description: "Configure um servidor de email para atendimento",
    steps: [
      "Obtenha as credenciais SMTP do seu provedor de email",
      "Para Gmail: ative a verificação em 2 etapas",
      "Gere uma 'Senha de App' nas configurações do Google",
      "Configure o host SMTP (ex: smtp.gmail.com)",
      "Configure a porta (587 para TLS ou 465 para SSL)",
      "Para IMAP, use as mesmas credenciais com imap.gmail.com"
    ],
    url: "https://support.google.com/mail/answer/7126229",
    secondaryUrl: {
      label: "Senhas de App Google",
      url: "https://myaccount.google.com/apppasswords"
    },
    tips: [
      "Gmail: use smtp.gmail.com:587 com TLS",
      "Outlook: use smtp.office365.com:587",
      "Senhas de app são diferentes da senha normal"
    ]
  },
  webchat: {
    title: "Web Chat (Widget)",
    description: "Adicione um chat ao vivo no seu site",
    steps: [
      "Crie o canal Web Chat no sistema",
      "Copie o código do widget gerado",
      "Cole o código antes do </body> no seu site",
      "Personalize as cores e mensagens",
      "Teste o widget no seu site"
    ],
    url: "#",
    tips: [
      "O widget funciona em qualquer site HTML",
      "Você pode personalizar cores e posição",
      "Formulário pré-chat pode coletar dados do visitante"
    ]
  }
};

export function ChannelDocsDialog({ open, onOpenChange, channelType }: ChannelDocsDialogProps) {
  const docs = channelDocs[channelType];
  
  if (!docs) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {docs.title}
          </DialogTitle>
          <DialogDescription>{docs.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold mb-3">Passo a Passo</h4>
            <ol className="space-y-2">
              {docs.steps.map((step, index) => (
                <li key={index} className="flex gap-3 text-sm">
                  <Badge variant="outline" className="h-6 w-6 flex items-center justify-center shrink-0">
                    {index + 1}
                  </Badge>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {docs.tips && docs.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-semibold mb-2 text-sm">Dicas</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {docs.tips.map((tip, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-primary">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {docs.url !== "#" && (
              <Button asChild>
                <a href={docs.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Documentação Oficial
                </a>
              </Button>
            )}
            {docs.secondaryUrl && (
              <Button variant="outline" asChild>
                <a href={docs.secondaryUrl.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {docs.secondaryUrl.label}
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
