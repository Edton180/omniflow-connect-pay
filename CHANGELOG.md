# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.0.0] - 2025-12-12

### 🎉 Release Inicial

Primeira versão estável do OmniFlow - Plataforma Multi-Tenant de Atendimento.

### ✨ Adicionado

#### Multi-tenant & Autenticação
- Sistema completo multi-tenant com isolamento de dados via RLS
- Três níveis de usuários: Super Admin, Tenant Admin e Agent
- Gestão de tenants pelo Super Admin
- Autenticação segura com confirmação automática de email
- Logs de auditoria para rastreamento de ações

#### Atendimento Omnichannel
- Integração com WhatsApp Business API (Cloud API oficial)
- Integração com Telegram via Bot API com webhooks
- Integração com Instagram Direct via Graph API
- Integração com Facebook Messenger
- WebChat personalizável para sites
- SMTP configurável por tenant para email

#### Sistema de Tickets
- Gestão completa de atendimentos
- Chat em tempo real via WebSocket (Realtime)
- Histórico completo de mensagens
- Status configuráveis (aberto, pendente, resolvido, fechado)
- Prioridades (baixa, média, alta, urgente)
- Atribuição automática de agentes (round-robin)
- Encaminhamento para filas, agentes ou bot
- Notas privadas entre agentes
- Menções de usuários nas conversas

#### Filas & Distribuição
- Filas customizáveis por tenant
- SLA configurável por fila
- Cores e identificação visual
- Distribuição inteligente round-robin
- Contagem de tickets por agente

#### Pagamentos Integrados
- Gateway ASAAS (boleto, PIX, cartão)
- Gateway Mercado Pago (PIX, cartão, boleto)
- Gateway Stripe (internacional)
- Gateway PayPal (global)
- Pagamento Manual com comprovantes
- Sistema de planos e assinaturas recorrentes
- Geração automática de faturas
- Controle de vencimentos com alertas
- Dashboard de receita em tempo real
- Webhooks para processamento de pagamentos

#### Marca Branca (White Label)
- Upload de logo personalizado
- Cores primárias e secundárias customizáveis
- Domínio personalizado
- Favicon e meta tags configuráveis
- Landing page totalmente editável
- Temas globais gerenciáveis

#### Inteligência Artificial
- Lovable AI integrado (sem necessidade de API key externa)
- Sugestões de respostas automáticas
- Melhoria de tom de mensagens
- Resumo de conversas
- Base de conhecimento por tenant
- Teste de conexão com IA

#### Dashboard & Analytics
- Dashboard com métricas em tempo real
- Gráficos de tickets por período
- Status de canais
- Estatísticas de performance de agentes
- Relatórios financeiros exportáveis
- Ranking de avaliações

#### CRM Integrado
- Kanban de leads
- Colunas customizáveis
- Integração com contatos e tickets
- Notas por contato

#### Broadcast & Campanhas
- Disparo de mensagens em massa
- Filtros por tags de contatos
- Templates de mensagens
- Estatísticas de envio

#### Avaliação de Atendimento
- CSAT automático ao fechar tickets
- Escala configurável (1-5, 1-10)
- Mensagens personalizáveis
- Dashboard de satisfação

### 🔐 Segurança
- Row Level Security (RLS) em todas as tabelas
- Isolamento completo entre tenants
- Autenticação via Auth integrado
- Storage seguro com RLS policies
- Rate limiting no Nginx
- Logs de auditoria completos
- Validação de webhooks com assinatura
- Proteção contra SQL injection

### 🏗️ Infraestrutura
- Docker + Docker Compose
- Nginx como reverse proxy
- Multi-stage builds otimizados
- Health checks automáticos
- Scripts de backup e restauração
- Scripts de atualização
- SSL/HTTPS com Let's Encrypt

### 📚 Documentação
- README completo
- Guia de instalação passo a passo
- Guia de deploy em produção
- Guia de integrações
- Guia de branding/white label
- Guia de webhooks
- Guia de contribuição

---

## Legenda

- ✨ **Adicionado** - Novas funcionalidades
- 🔄 **Alterado** - Mudanças em funcionalidades existentes
- 🗑️ **Removido** - Funcionalidades removidas
- 🐛 **Corrigido** - Correções de bugs
- 🔐 **Segurança** - Correções de vulnerabilidades
- 📚 **Documentação** - Atualizações na documentação
