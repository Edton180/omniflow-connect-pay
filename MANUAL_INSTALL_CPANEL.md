# 📦 Guia de Instalação - cPanel

Guia completo para instalar o OmniFlow em hospedagens com cPanel.

## 📋 Pré-requisitos

- Acesso ao cPanel da sua hospedagem
- Node.js instalado localmente (para build)
- Credenciais do Supabase

---

## 🔨 Passo 1: Build Local do Projeto

No seu computador local:

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cat > .env << EOF
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua-chave-publica
VITE_SUPABASE_PROJECT_ID=seu-project-id
EOF

# Faça o build
npm run build
```

Isso criará uma pasta `dist` com os arquivos prontos para produção.

---

## 📤 Passo 2: Upload para o cPanel

### 2.1 Acesse o File Manager

1. Faça login no seu cPanel
2. Acesse **Gerenciador de Arquivos** (File Manager)
3. Navegue até `public_html`

### 2.2 Limpe o Diretório (se necessário)

Se houver arquivos antigos em `public_html`, remova-os (exceto `.htaccess` se existir).

### 2.3 Faça Upload dos Arquivos

1. Clique em **Upload** no File Manager
2. Faça upload de todos os arquivos da pasta `dist`
3. Aguarde o upload completar

**Ou use FTP:**

```bash
# Via FileZilla ou outro cliente FTP
# Conecte ao seu servidor
# Copie todos os arquivos de dist/ para public_html/
```

---

## ⚙️ Passo 3: Configurar .htaccess

Crie ou edite o arquivo `.htaccess` em `public_html`:

```apache
# Habilitar módulo de rewrite
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /

    # Redirecionar HTTP para HTTPS (opcional mas recomendado)
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

    # Não fazer rewrite de arquivos e diretórios existentes
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d

    # Redirecionar todas as requisições para index.html (SPA)
    RewriteRule . /index.html [L]
</IfModule>

# Habilitar compressão GZIP
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache de arquivos estáticos
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType application/x-javascript "access plus 1 month"
    ExpiresByType application/x-shockwave-flash "access plus 1 month"
    ExpiresByType image/x-icon "access plus 1 year"
    ExpiresDefault "access plus 2 days"
</IfModule>

# Segurança adicional
<IfModule mod_headers.c>
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"
</IfModule>
```

---

## 🔐 Passo 4: Configurar SSL (HTTPS)

### Opção A: Let's Encrypt (Gratuito)

Se seu cPanel tem o Let's Encrypt disponível:

1. Vá em **Segurança** → **SSL/TLS**
2. Clique em **Manage AutoSSL**
3. Ative para seu domínio
4. Aguarde alguns minutos para o certificado ser emitido

### Opção B: SSL Manual

1. No cPanel, vá em **Segurança** → **SSL/TLS**
2. Clique em **Manage SSL Sites**
3. Selecione seu domínio
4. Cole seu certificado SSL
5. Salve as alterações

---

## 📧 Passo 5: Configurar Subdomínios (Opcional)

Se você quiser um subdomínio dedicado (ex: `app.seudominio.com`):

1. No cPanel, vá em **Domínios** → **Subdomínios**
2. Crie um novo subdomínio (ex: `app`)
3. Aponte o document root para a pasta onde estão os arquivos
4. Configure SSL para o subdomínio

---

## 🧪 Passo 6: Testar a Instalação

1. Acesse seu domínio: `https://seudominio.com`
2. Você deve ver a landing page do OmniFlow
3. Tente fazer login ou criar conta
4. Verifique se todas as páginas carregam corretamente

### Checklist de Teste:

- [ ] Landing page carrega
- [ ] Página de login funciona
- [ ] Registro de novo usuário funciona
- [ ] Dashboard aparece após login
- [ ] Navegação entre páginas funciona
- [ ] Imagens e assets carregam
- [ ] Console do navegador sem erros críticos

---

## 🚨 Troubleshooting Comum

### Erro 500 - Internal Server Error

**Causa**: Problema no .htaccess ou permissões

**Solução**:
```bash
# Verifique as permissões dos arquivos
# Arquivos: 644
# Pastas: 755
```

### Página em branco

**Causa**: Caminho base incorreto

**Solução**: Verifique se o `RewriteBase` no .htaccess está correto:
```apache
RewriteBase /
# Se estiver em subpasta: RewriteBase /subpasta/
```

### CSS e JS não carregam

**Causa**: Caminhos absolutos incorretos

**Solução**: 
1. Verifique se fez o build corretamente
2. Confirme que todos os arquivos da pasta `dist` foram enviados
3. Limpe o cache do navegador

### Erro ao conectar com Supabase

**Causa**: Variáveis de ambiente não configuradas

**Solução**: As variáveis de ambiente são compiladas no build. Certifique-se de que configurou o arquivo `.env` ANTES de rodar `npm run build`.

---

## 🔄 Atualizações Futuras

Para atualizar o OmniFlow no cPanel:

```bash
# No seu computador local
git pull origin main
npm install
npm run build

# Faça upload apenas dos arquivos alterados
# Ou substitua todos os arquivos em public_html
```

---

## 📞 Suporte

- **Documentação**: `/INSTALLATION.md`
- **Issues**: https://github.com/seu-usuario/omniflow/issues

---

## 🎉 Próximos Passos

Após instalação:

1. ✅ Faça o primeiro acesso e complete o setup
2. ✅ Configure o Evolution API (se disponível em seu servidor)
3. ✅ Personalize sua marca branca
4. ✅ Configure canais de atendimento
5. ✅ Comece a usar!

**OmniFlow rodando no cPanel!** 🚀
