# 🎨 Guia de Marca Branca - OmniFlow

## Visão Geral

A funcionalidade de Marca Branca permite que cada tenant personalize completamente a aparência da plataforma, incluindo logo, cores e domínio personalizado.

## Recursos Implementados

### 1. Upload de Logo
- ✅ Bucket de storage `tenant-logos` criado
- ✅ Upload seguro com RLS policies
- ✅ Preview em tempo real
- ✅ Suporte para PNG, JPG e SVG
- ✅ Limite de 2MB por arquivo

### 2. Personalização de Cores
- ✅ Cor primária personalizável
- ✅ Cor secundária personalizável
- ✅ Preview em tempo real
- ✅ Aplicação automática em toda a plataforma
- ✅ Conversão automática HEX → HSL para CSS variables

### 3. Domínio Personalizado
- ✅ Campo para configuração de domínio
- ✅ Instruções de configuração DNS
- ✅ Documentação integrada

## Como Usar

### Acessar Configurações de Marca
1. Faça login como **Tenant Admin**
2. Acesse o **Dashboard**
3. Clique em **"Marca Branca"** nas ações rápidas
4. Ou navegue para `/branding`

### Upload de Logo
1. Vá para a aba **"Marca"**
2. Clique em **"Upload Logo"**
3. Selecione sua imagem (PNG, JPG ou SVG)
4. Visualize o preview
5. Clique em **"Salvar Alterações"**

### Personalizar Cores
1. Vá para a aba **"Cores"**
2. Selecione a **Cor Primária** (usada em botões, links, destaques)
3. Selecione a **Cor Secundária** (usada em elementos secundários)
4. Visualize o preview dos botões
5. Clique em **"Salvar Alterações"**

### Configurar Domínio Personalizado

#### Passo 1: Adicionar Domínio
1. Vá para a aba **"Domínio"**
2. Digite seu domínio (ex: `atendimento.suaempresa.com.br`)
3. Clique em **"Salvar Alterações"**

#### Passo 2: Configurar DNS
1. Acesse o painel do seu provedor de domínio (ex: GoDaddy, Hostgator, Registro.br)
2. Adicione um registro **A** com as seguintes informações:
   - **Tipo**: A
   - **Nome**: @ (para domínio raiz) ou subdomínio desejado
   - **Valor/IP**: `185.158.133.1`
   - **TTL**: 3600 (ou padrão)

3. Se quiser configurar o subdomínio **www** também:
   - **Tipo**: A
   - **Nome**: www
   - **Valor/IP**: `185.158.133.1`

#### Passo 3: Aguardar Propagação
- A propagação DNS pode levar de **15 minutos a 48 horas**
- Você pode verificar o status em: https://dnschecker.org

#### Passo 4: SSL Automático
- O Lovable configurará automaticamente o certificado SSL (HTTPS)
- Não é necessária nenhuma ação adicional

## Estrutura Técnica

### Banco de Dados
```sql
-- Campos na tabela tenants
- name: TEXT              -- Nome da plataforma
- logo_url: TEXT          -- URL pública do logo
- primary_color: TEXT     -- Cor primária em HEX
- secondary_color: TEXT   -- Cor secundária em HEX
- custom_domain: TEXT     -- Domínio personalizado
- custom_css: JSONB       -- Estilos personalizados adicionais
```

### Storage
```
tenant-logos/
  ├── {tenant_id}/
  │   └── logo.png
```

### Hook Personalizado
```typescript
// src/hooks/useBranding.tsx
const { branding, loading } = useBranding();

// Retorna:
{
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  custom_domain: string | null;
}
```

## Aplicação Automática

As personalizações são aplicadas automaticamente em:
- ✅ Logo no cabeçalho
- ✅ Nome da plataforma
- ✅ Cores de botões e elementos
- ✅ Gradientes e destaques
- ✅ CSS variables globais

### CSS Variables Afetadas
```css
--primary: {valor convertido para HSL}
--secondary: {valor convertido para HSL}
```

## Segurança

### RLS Policies
- ✅ Apenas **Super Admin** e **Tenant Admin** podem fazer upload
- ✅ Logos são públicos para visualização
- ✅ Cada tenant só pode acessar seus próprios arquivos
- ✅ Upload limitado por tenant_id no path

### Validações
- ✅ Formato de arquivo (imagem)
- ✅ Tamanho máximo (2MB)
- ✅ Permissões de tenant
- ✅ Validação de cores HEX

## Limitações Conhecidas

1. **Domínios Personalizados**
   - Requer configuração manual de DNS
   - Propagação pode levar até 48h
   - SSL configurado automaticamente pelo Lovable

2. **Logos**
   - Tamanho máximo: 2MB
   - Formatos: PNG, JPG, SVG
   - Resolução recomendada: 200x200px

3. **Cores**
   - Apenas formato HEX suportado
   - Conversão automática para HSL

## Troubleshooting

### Logo não aparece
- Verifique se o upload foi bem-sucedido
- Confirme que o bucket é público
- Limpe o cache do navegador

### Cores não aplicam
- Verifique o formato HEX (#RRGGBB)
- Recarregue a página
- Limpe o cache do navegador

### Domínio não funciona
- Verifique a configuração DNS
- Use https://dnschecker.org para verificar propagação
- Aguarde até 48h para propagação completa
- Verifique se não há conflitos com registros DNS antigos

## Próximos Passos

Funcionalidades futuras planejadas:
- [ ] Editor de tema avançado
- [ ] Múltiplos logos (light/dark mode)
- [ ] Fonte personalizada
- [ ] Editor CSS customizado
- [ ] Templates pré-definidos
- [ ] Export/Import de temas

## Suporte

Para dúvidas sobre marca branca:
1. Consulte este guia
2. Verifique a documentação do Lovable: https://docs.lovable.dev
3. Entre em contato com o suporte técnico

---

**Última atualização**: Fase 5 - Marca Branca implementada ✅
