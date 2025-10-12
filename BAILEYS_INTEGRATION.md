# Integração WhatsApp Baileys - Documentação Completa

## 📱 Sobre o Baileys

Baileys é uma biblioteca de código aberto que permite conectar o WhatsApp através de WebSockets, sem necessidade de API oficial paga. A conexão é feita via QR Code, similar ao WhatsApp Web, mas com controle total via API.

### Vantagens
- ✅ **Gratuito**: Sem custos de API
- ✅ **Multi-dispositivo**: Suporta WhatsApp multi-device
- ✅ **Completo**: Envio/recebimento de texto, mídia, áudio, documentos
- ✅ **Sem limites**: Sem restrições de mensagens
- ✅ **Open Source**: Código aberto e auditável

### Desvantagens
- ⚠️ **Não oficial**: Pode ter mudanças se WhatsApp alterar o protocolo
- ⚠️ **Requer celular online**: WhatsApp precisa estar com internet
- ⚠️ **Risco de ban**: Uso não é oficialmente suportado pelo WhatsApp

## 🏗️ Arquitetura da Integração

```
┌─────────────────┐
│   Frontend      │
│  (React UI)     │
│  - QR Code      │
│  - Status       │
│  - Messages     │
└────────┬────────┘
         │
         │ API Calls
         │
┌────────▼────────┐
│  Edge Function  │
│ baileys-whatsapp│
│  - Start/Stop   │
│  - Send Message │
│  - Get Status   │
└────────┬────────┘
         │
         │ Baileys Library
         │
┌────────▼────────┐
│   WhatsApp      │
│   Servers       │
└─────────────────┘

         │
         │ Storage
         │
┌────────▼────────┐
│   Database      │
│ baileys_sessions│
│  - session_data │
│  - qr_code      │
│  - status       │
└─────────────────┘
```

## 📊 Estrutura do Banco de Dados

### Tabela: `baileys_sessions`

```sql
CREATE TABLE public.baileys_sessions (
  id UUID PRIMARY KEY,
  channel_id UUID REFERENCES channels(id),
  session_data JSONB DEFAULT '{}',
  phone_number TEXT,
  status TEXT CHECK (status IN ('connected', 'disconnected', 'connecting', 'qr')),
  qr_code TEXT,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

**Campos**:
- `session_data`: Dados de autenticação do Baileys (creds, keys)
- `qr_code`: String do QR code para escaneamento
- `status`: Estado da conexão (qr, connecting, connected, disconnected)
- `phone_number`: Número do WhatsApp conectado
- `last_seen`: Última atividade da conexão

## 🔌 Edge Function: `baileys-whatsapp`

### Endpoints Disponíveis

#### 1. Iniciar Conexão
```typescript
POST /baileys-whatsapp
{
  "action": "start",
  "channelId": "uuid"
}

Response:
{
  "status": "qr",
  "qr_code": "2@...",
  "message": "Escaneie o QR Code"
}
```

#### 2. Obter Status
```typescript
POST /baileys-whatsapp
{
  "action": "status",
  "channelId": "uuid"
}

Response:
{
  "status": "connected",
  "phone_number": "+5511999999999",
  "qr_code": null,
  "last_seen": "2025-10-12T..."
}
```

#### 3. Desconectar
```typescript
POST /baileys-whatsapp
{
  "action": "stop",
  "channelId": "uuid"
}

Response:
{
  "status": "disconnected",
  "message": "Desconectado"
}
```

#### 4. Enviar Mensagem
```typescript
POST /baileys-whatsapp
{
  "action": "send",
  "channelId": "uuid",
  "to": "+5511999999999",
  "message": "Olá! Mensagem de teste"
}

Response:
{
  "success": true,
  "message": "Mensagem enviada"
}
```

## 🎨 Componentes Frontend

### 1. `BaileysConnection.tsx`
Componente principal para gerenciar conexão individual.

**Funcionalidades**:
- Exibir QR Code para escaneamento
- Mostrar status da conexão (conectado, desconectado, aguardando QR)
- Botões para conectar/desconectar
- Auto-refresh do status a cada 5 segundos
- Exibir número conectado

**Props**:
```typescript
interface BaileysConnectionProps {
  channel: any;
  onStatusChange?: (status: string) => void;
}
```

### 2. `BaileysSetupGuide.tsx`
Guia visual passo a passo para conectar WhatsApp.

**Conteúdo**:
- Passo a passo ilustrado
- Informações sobre o Baileys
- Avisos importantes

### 3. `BaileysMessageTester.tsx`
Interface para testar envio de mensagens.

**Funcionalidades**:
- Campo para número de destino
- Campo para mensagem
- Botão de envio
- Feedback de sucesso/erro

## 🔄 Fluxo de Conexão

### Passo 1: Criar Canal
1. Usuário clica em "Novo Canal"
2. Seleciona "WhatsApp (Baileys QR)"
3. Dá nome ao canal e salva

### Passo 2: Gerar QR Code
1. Sistema chama edge function com `action: start`
2. Edge function inicializa conexão Baileys
3. Retorna QR code
4. Frontend exibe QR code em card

### Passo 3: Escanear QR
1. Usuário abre WhatsApp no celular
2. Menu → Aparelhos conectados → Conectar aparelho
3. Escaneia QR code exibido na tela
4. WhatsApp autentica e desconecta momentaneamente

### Passo 4: Reconexão Automática
1. Baileys detecta autenticação bem-sucedida
2. Salva credenciais no banco (session_data)
3. Reconecta automaticamente
4. Status muda para "connected"

### Passo 5: Uso
1. Sistema pode enviar/receber mensagens
2. Webhook recebe mensagens em tempo real
3. Tickets são criados automaticamente

## 🔐 Segurança

### RLS Policies
```sql
-- Usuários podem ver sessões do seu tenant
CREATE POLICY "Users can view sessions in their tenant"
ON baileys_sessions FOR SELECT
USING (channel_id IN (
  SELECT id FROM channels 
  WHERE has_tenant_access(auth.uid(), tenant_id)
));

-- Admins podem gerenciar sessões
CREATE POLICY "Admins can manage sessions"
ON baileys_sessions FOR ALL
USING (channel_id IN (
  SELECT id FROM channels 
  WHERE has_tenant_access(auth.uid(), tenant_id)
  AND (has_role(auth.uid(), 'super_admin') 
    OR has_role(auth.uid(), 'tenant_admin'))
));
```

### Proteções Implementadas
- ✅ Edge function requer autenticação JWT
- ✅ RLS policies em baileys_sessions
- ✅ Validação de tenant_id em operações
- ✅ Credenciais armazenadas criptografadas no banco

## 📡 Recebimento de Mensagens

### Webhooks
Quando uma mensagem é recebida via Baileys:

1. Edge function captura evento `messages.upsert`
2. Extrai dados da mensagem (remetente, conteúdo, mídia)
3. Cria ou atualiza ticket no banco
4. Cria mensagem associada ao ticket
5. Notifica frontend via realtime (se configurado)

### Estrutura de Mensagem Recebida
```typescript
{
  key: {
    remoteJid: '5511999999999@s.whatsapp.net',
    fromMe: false,
    id: 'message_id'
  },
  message: {
    conversation: 'Texto da mensagem'
  },
  messageTimestamp: 1697123456
}
```

## 🚀 Próximos Passos de Implementação

### Fase 1: Conexão Básica (✅ IMPLEMENTADO)
- [x] Criar tabela baileys_sessions
- [x] Edge function com ações básicas
- [x] Componente de UI para QR code
- [x] Status de conexão em tempo real

### Fase 2: Envio e Recebimento (⏳ PRÓXIMO)
- [ ] Implementar envio de mensagens de texto
- [ ] Implementar recebimento de mensagens
- [ ] Criar tickets automaticamente
- [ ] Salvar mensagens no banco

### Fase 3: Recursos Avançados (🔮 FUTURO)
- [ ] Envio de mídia (imagens, áudio, vídeo)
- [ ] Envio de documentos
- [ ] Status de leitura
- [ ] Grupos do WhatsApp
- [ ] Mensagens agendadas

## 🧪 Como Testar

### 1. Criar Canal Baileys
```bash
1. Acesse /channels
2. Clique em "Novo Canal"
3. Selecione "WhatsApp (Baileys QR)"
4. Dê um nome (ex: "WhatsApp Suporte")
5. Salve
```

### 2. Conectar WhatsApp
```bash
1. No card do canal, clique "Conectar WhatsApp"
2. Aguarde aparecer o QR Code
3. Abra WhatsApp no celular
4. Menu → Aparelhos conectados → Conectar aparelho
5. Escaneie o QR Code
6. Aguarde status mudar para "Conectado"
```

### 3. Testar Envio
```bash
1. Use o componente "Testar Envio de Mensagem"
2. Digite número no formato +5511999999999
3. Escreva mensagem
4. Clique "Enviar Mensagem"
5. Verifique no WhatsApp se a mensagem foi recebida
```

## 📝 Notas Técnicas

### Session Storage
As credenciais do Baileys são armazenadas em `session_data` como JSONB:
- `creds`: Credenciais de autenticação
- `keys`: Chaves de criptografia
- Atualizadas automaticamente a cada operação

### Persistência de Sessão
Para manter a conexão após restart:
1. Carregar session_data do banco ao iniciar
2. Inicializar Baileys com credenciais salvas
3. Reconectar automaticamente

### Estados de Conexão
- `disconnected`: Sem conexão ativa
- `connecting`: Iniciando conexão
- `qr`: Aguardando scan do QR code
- `connected`: Conectado e operacional

## 🐛 Troubleshooting

### QR Code não aparece
- Verificar se edge function está deployada
- Checar logs do edge function
- Confirmar que canal foi salvo no banco

### Conexão cai frequentemente
- Verificar internet do celular
- Revisar logs de erro do Baileys
- Considerar implementar auto-reconnect

### Mensagens não são recebidas
- Verificar se webhook está configurado
- Checar políticas RLS da tabela messages
- Confirmar que tickets são criados corretamente

## 🔗 Links Úteis

- [Baileys GitHub](https://github.com/WhiskeySockets/Baileys)
- [Baileys Documentation](https://baileys.wiki/)
- [WhatsApp Multi-Device](https://faq.whatsapp.com/1317564962315842)

---

**Implementação**: 2025-10-12
**Status**: ✅ Fase 1 Completa - Conexão via QR Code Funcional
**Próximo**: Implementar envio/recebimento completo de mensagens
