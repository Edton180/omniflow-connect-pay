# 🔌 Evolution API - Guia Completo de Configuração

Documentação detalhada para configurar e usar a Evolution API com o OmniFlow.

## 📋 Índice

1. [O que é Evolution API](#o-que-é-evolution-api)
2. [Instalação](#instalação)
3. [Configuração](#configuração)
4. [Integração com OmniFlow](#integração-com-omniflow)
5. [Endpoints Principais](#endpoints-principais)
6. [Webhooks](#webhooks)
7. [Troubleshooting](#troubleshooting)

---

## 🤔 O que é Evolution API?

Evolution API é uma API REST open-source para integração com WhatsApp, construída sobre a biblioteca Baileys. Oferece:

- ✅ **Múltiplas instâncias** simultâneas
- ✅ **API REST** completa e documentada
- ✅ **Webhooks** para eventos em tempo real
- ✅ **Multi-dispositivo** (WhatsApp Business)
- ✅ **Mensagens de texto, mídia, áudio, documentos**
- ✅ **Grupos e listas de transmissão**
- ✅ **Respostas rápidas e templates**
- ✅ **Alta disponibilidade**

**Repositório oficial**: https://github.com/EvolutionAPI/evolution-api

---

## 📦 Instalação

### Método 1: Docker (Recomendado)

```bash
# Crie diretório
mkdir -p /opt/evolution-api
cd /opt/evolution-api

# Crie docker-compose.yml
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # Server
      - SERVER_URL=https://api.seu-dominio.com
      - SERVER_PORT=8080
      
      # Authentication
      - AUTHENTICATION_API_KEY=${API_KEY}
      
      # Database
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=postgresql
      - DATABASE_CONNECTION_URI=postgresql://user:pass@postgres:5432/evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      
      # Cache
      - CACHE_REDIS_ENABLED=true
      - CACHE_REDIS_URI=redis://redis:6379
      - CACHE_REDIS_PREFIX_KEY=evolution
      - CACHE_LOCAL_ENABLED=false
      
      # Storage
      - S3_ENABLED=false
      - S3_BUCKET=evolution
      
      # WhatsApp Config
      - CONFIG_SESSION_PHONE_CLIENT=OmniFlow
      - CONFIG_SESSION_PHONE_NAME=Chrome
      
      # Webhook
      - WEBHOOK_GLOBAL_ENABLED=false
      - WEBHOOK_GLOBAL_URL=
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      
      # WebSocket
      - WEBSOCKET_ENABLED=true
      - WEBSOCKET_GLOBAL_EVENTS=false
      
      # Logs
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      - LOG_BAILEYS=error
      
      # Other
      - DEL_INSTANCE=false
      - DEL_TEMP_INSTANCES=true
      
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    depends_on:
      - postgres
      - redis
    networks:
      - evolution

  postgres:
    image: postgres:15-alpine
    container_name: evolution-postgres
    restart: always
    environment:
      - POSTGRES_USER=evolution
      - POSTGRES_PASSWORD=evolution_secure_password
      - POSTGRES_DB=evolution
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - evolution

  redis:
    image: redis:alpine
    container_name: evolution-redis
    restart: always
    command: >
      redis-server
      --appendonly yes
      --port 6379
    volumes:
      - redis_data:/data
    networks:
      - evolution

volumes:
  evolution_instances:
  evolution_store:
  postgres_data:
  redis_data:

networks:
  evolution:
    driver: bridge
```

Crie `.env`:
```env
API_KEY=gere_um_token_forte_aqui_min_32_caracteres
```

Inicie:
```bash
docker compose up -d

# Verifique logs
docker logs evolution-api -f
```

### Método 2: Manual (Node.js)

```bash
# Clone repositório
git clone https://github.com/EvolutionAPI/evolution-api.git
cd evolution-api

# Instale dependências
npm install

# Configure
cp .env.example .env
nano .env

# Build
npm run build

# Inicie com PM2
npm install -g pm2
pm2 start dist/src/main.js --name evolution-api
pm2 startup
pm2 save
```

---

## ⚙️ Configuração

### Variáveis de Ambiente Principais

```env
# === OBRIGATÓRIAS ===

# URL pública da API
SERVER_URL=https://api.seu-dominio.com

# Chave de autenticação (min 32 caracteres)
AUTHENTICATION_API_KEY=seu_token_secreto_forte_aqui

# === BANCO DE DADOS (Recomendado) ===

DATABASE_ENABLED=true
DATABASE_PROVIDER=postgresql
DATABASE_CONNECTION_URI=postgresql://user:pass@host:5432/evolution

# === CACHE (Recomendado para produção) ===

CACHE_REDIS_ENABLED=true
CACHE_REDIS_URI=redis://localhost:6379

# === STORAGE ===

# Local (desenvolvimento)
S3_ENABLED=false

# S3 (produção recomendada)
S3_ENABLED=true
S3_ACCESS_KEY_ID=seu_access_key
S3_SECRET_ACCESS_KEY=seu_secret_key
S3_BUCKET=evolution
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com

# === WHATSAPP ===

CONFIG_SESSION_PHONE_CLIENT=OmniFlow
CONFIG_SESSION_PHONE_NAME=Chrome

# === WEBHOOKS ===

WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://seu-dominio.com/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true

# === LOGS ===

LOG_LEVEL=ERROR
LOG_COLOR=true
LOG_BAILEYS=error
```

---

## 🔗 Integração com OmniFlow

### 1. Configure Secrets no Supabase

No dashboard do Supabase:
1. Vá em **Edge Functions**
2. Adicione secrets:
   - `EVOLUTION_API_URL`: `https://api.seu-dominio.com`
   - `EVOLUTION_API_KEY`: (seu token secreto)

### 2. No OmniFlow

1. Faça login como Super Admin
2. Vá em **Canais de Atendimento**
3. Clique em **Novo Canal**
4. Selecione **WhatsApp (Evolution API)**
5. Clique em **Salvar Configuração**
6. Clique em **Conectar WhatsApp**
7. Escaneie o QR Code

---

## 📡 Endpoints Principais

### Health Check
```bash
curl https://api.seu-dominio.com/health \
  -H "apikey: seu-token"
```

### Criar Instância
```bash
curl -X POST https://api.seu-dominio.com/instance/create \
  -H "apikey: seu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "minha_instancia",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

### Obter QR Code
```bash
curl https://api.seu-dominio.com/instance/connect/minha_instancia \
  -H "apikey: seu-token"
```

### Status da Conexão
```bash
curl https://api.seu-dominio.com/instance/connectionState/minha_instancia \
  -H "apikey: seu-token"
```

### Enviar Mensagem
```bash
curl -X POST https://api.seu-dominio.com/message/sendText/minha_instancia \
  -H "apikey: seu-token" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "text": "Olá! Esta é uma mensagem de teste."
  }'
```

### Listar Instâncias
```bash
curl https://api.seu-dominio.com/instance/fetchInstances \
  -H "apikey: seu-token"
```

### Desconectar (Logout)
```bash
curl -X DELETE https://api.seu-dominio.com/instance/logout/minha_instancia \
  -H "apikey: seu-token"
```

### Deletar Instância
```bash
curl -X DELETE https://api.seu-dominio.com/instance/delete/minha_instancia \
  -H "apikey: seu-token"
```

---

## 🪝 Webhooks

Configure webhooks para receber eventos em tempo real:

### Configuração Global

No `.env` ou ao criar instância:

```env
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_GLOBAL_URL=https://seu-dominio.com/webhook
WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=true
```

### Eventos Disponíveis

- `messages.upsert` - Nova mensagem recebida
- `messages.update` - Mensagem atualizada
- `messages.delete` - Mensagem deletada
- `send.message` - Mensagem enviada
- `connection.update` - Status da conexão alterado
- `presence.update` - Status de presença alterado
- `chats.update` - Chat atualizado
- `chats.upsert` - Novo chat
- `chats.delete` - Chat deletado
- `contacts.update` - Contato atualizado
- `contacts.upsert` - Novo contato
- `groups.update` - Grupo atualizado
- `group-participants.update` - Participantes do grupo atualizados

### Exemplo de Payload

```json
{
  "event": "messages.upsert",
  "instance": "minha_instancia",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false,
      "id": "3EB0XXXXX"
    },
    "message": {
      "conversation": "Olá!"
    },
    "messageType": "conversation",
    "messageTimestamp": 1234567890
  },
  "server_url": "https://api.seu-dominio.com",
  "apikey": "seu-token"
}
```

---

## 🔧 Troubleshooting

### Evolution API não inicia

```bash
# Veja logs detalhados
docker logs evolution-api --tail 100 -f

# Verifique variáveis de ambiente
docker exec evolution-api env | grep -E "SERVER_URL|API_KEY|DATABASE"

# Teste conexão com banco
docker exec evolution-postgres psql -U evolution -c "\dt"
```

### QR Code não conecta

1. Verifique se o WhatsApp está na versão mais recente
2. Limpe cache do WhatsApp
3. Tente com outro telefone
4. Veja logs: `docker logs evolution-api -f`
5. Regenere QR Code (delete e crie nova instância)

### Mensagens não enviam

```bash
# Verifique status da instância
curl https://api.seu-dominio.com/instance/connectionState/nome_instancia \
  -H "apikey: seu-token"

# Deve retornar: "state": "open"
```

### Erro "Instance not found"

```bash
# Liste instâncias
curl https://api.seu-dominio.com/instance/fetchInstances \
  -H "apikey: seu-token"

# Se não aparecer, recrie a instância
```

---

## 🔄 Atualizações

### Atualizar Evolution API

```bash
cd /opt/evolution-api

# Pare containers
docker compose down

# Atualize imagem
docker pull atendai/evolution-api:latest

# Reinicie
docker compose up -d

# Verifique
docker logs evolution-api -f
```

---

## 📊 Monitoramento

### Logs em Tempo Real

```bash
# Evolution API
docker logs evolution-api -f

# PostgreSQL
docker logs evolution-postgres -f

# Redis
docker logs evolution-redis -f
```

### Métricas de Recursos

```bash
# CPU e Memória
docker stats

# Disco
docker system df
```

### Portainer (Interface Gráfica)

```bash
# Instale Portainer
docker run -d -p 9000:9000 \
  --name=portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest
```

Acesse: `http://seu-servidor:9000`

---

## 🛡️ Segurança

### Práticas Recomendadas

1. **Use HTTPS sempre** (Let's Encrypt)
2. **Proteja sua API key** (min 32 caracteres aleatórios)
3. **Configure firewall** (UFW ou iptables)
4. **Backups regulares** do banco de dados e instâncias
5. **Monitore logs** para atividades suspeitas
6. **Rate limiting** no Nginx

### Nginx Rate Limiting

```nginx
# No bloco http
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

# No server da API
server {
    location / {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:8080;
    }
}
```

---

## 🔌 Integração Avançada

### Enviar Mídia

```bash
curl -X POST https://api.seu-dominio.com/message/sendMedia/instance \
  -H "apikey: token" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "5511999999999",
    "mediatype": "image",
    "media": "https://exemplo.com/imagem.jpg",
    "caption": "Confira esta imagem!"
  }'
```

### Criar Grupo

```bash
curl -X POST https://api.seu-dominio.com/group/create/instance \
  -H "apikey: token" \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "Meu Grupo",
    "participants": ["5511999999999", "5511888888888"]
  }'
```

### Listar Chats

```bash
curl https://api.seu-dominio.com/chat/findChats/instance \
  -H "apikey: token"
```

---

## 📈 Otimização para Produção

### PostgreSQL

```sql
-- Otimize o banco
VACUUM ANALYZE;

-- Índices recomendados
CREATE INDEX IF NOT EXISTS idx_messages_instance ON messages(instance_name);
CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_chats_instance ON chats(instance_name);
```

### Redis Cache

```bash
# No docker-compose.yml, configure Redis com persistência
redis:
  command: redis-server --appendonly yes --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Nginx Cache

```nginx
# Cache para assets estáticos
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}

# Sem cache para API
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## 🎯 Casos de Uso

### 1. Atendimento Automatizado

```javascript
// Webhook handler
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'messages.upsert' && !data.key.fromMe) {
    const message = data.message?.conversation;
    const from = data.key.remoteJid;
    
    // Resposta automática
    if (message.toLowerCase().includes('horário')) {
      sendMessage(from, 'Atendemos de segunda a sexta, 9h às 18h.');
    }
  }
  
  res.json({ success: true });
});
```

### 2. Notificações em Massa

```javascript
async function sendBulkMessages(recipients, message) {
  for (const number of recipients) {
    await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'apikey': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        number: number,
        text: message
      })
    });
    
    // Aguarde 1 segundo entre mensagens
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}
```

### 3. Chatbot com IA

```javascript
// Integre com sua AI preferida
async function handleMessage(from, message) {
  // Chame sua IA
  const aiResponse = await callAI(message);
  
  // Envie resposta
  await fetch(`${EVOLUTION_URL}/message/sendText/${instance}`, {
    method: 'POST',
    headers: { 'apikey': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      number: from,
      text: aiResponse
    })
  });
}
```

---

## 📚 Recursos Adicionais

- **Documentação Oficial**: https://doc.evolution-api.com
- **GitHub**: https://github.com/EvolutionAPI/evolution-api
- **Postman Collection**: Disponível no repositório
- **Swagger UI**: `https://api.seu-dominio.com/docs`

---

## 💡 Dicas de Performance

1. **Use Redis** para cache em produção
2. **Configure PostgreSQL** para otimizar queries
3. **Limite instâncias simultâneas** (4-8 por servidor de 4GB RAM)
4. **Use Load Balancer** para alta disponibilidade
5. **Monitore recursos** com Portainer ou Grafana
6. **Backups automáticos** do banco e volumes

---

## 🆘 Suporte

- Evolution API Issues: https://github.com/EvolutionAPI/evolution-api/issues
- OmniFlow Issues: https://github.com/seu-usuario/omniflow/issues
- Documentação: `/DEPLOY.md` e `/INSTALLATION.md`

---

**Evolution API integrada ao OmniFlow = Solução profissional de WhatsApp!** 🚀📱
