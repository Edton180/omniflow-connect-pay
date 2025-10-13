# 🖥️ Guia de Instalação - VirtualBox

Guia completo para instalar o OmniFlow em uma máquina virtual VirtualBox.

## 📋 Pré-requisitos

- VirtualBox 6.0+ instalado
- 8GB RAM disponível para a VM (mínimo 4GB)
- 50GB de espaço em disco
- Imagem ISO do Ubuntu 20.04 LTS

---

## 🔧 Passo 1: Criar a Máquina Virtual

### 1.1 No VirtualBox, clique em "Nova"

**Configurações recomendadas:**
- **Nome**: OmniFlow
- **Tipo**: Linux
- **Versão**: Ubuntu (64-bit)
- **Memória**: 8192 MB (8GB)
- **Disco**: 50GB VDI dinâmico

### 1.2 Configurações de Rede

1. Vá em **Configurações** → **Rede**
2. **Adaptador 1**:
   - Habilitar Placa de Rede
   - Conectado a: **Bridge Adapter** (para acesso externo)
   - Ou: **NAT** com Port Forwarding configurado

**Port Forwarding (se usar NAT):**
| Nome | Protocolo | IP Host | Porta Host | IP Convidado | Porta Convidado |
|------|-----------|---------|------------|--------------|-----------------|
| HTTP | TCP | | 8080 | | 80 |
| HTTPS | TCP | | 8443 | | 443 |
| SSH | TCP | | 2222 | | 22 |
| Evolution | TCP | | 8081 | | 8080 |

### 1.3 Outras Configurações

- **Sistema** → **Processador**: 2 CPUs
- **Sistema** → **Aceleração**: Habilitar VT-x/AMD-V
- **Display** → **Memória de Vídeo**: 128 MB

---

## 💿 Passo 2: Instalar Ubuntu

1. Inicie a VM
2. Selecione a ISO do Ubuntu 20.04
3. Siga o instalador:
   - Idioma: Português
   - Instação normal
   - Apagar disco e instalar Ubuntu
   - Criar usuário (ex: `omniflow`)

4. Após instalação, reinicie e remova a ISO

---

## 🚀 Passo 3: Instalação Automática

Após logar no Ubuntu:

```bash
# Abra o Terminal (Ctrl+Alt+T)

# Atualize o sistema
sudo apt update && sudo apt upgrade -y

# Instale o curl
sudo apt install -y curl

# Execute o instalador automático
curl -sSL https://raw.githubusercontent.com/seu-usuario/omniflow/main/scripts/auto-install.sh | sudo bash

# Escolha a opção 4: VirtualBox
```

O instalador irá:
- ✅ Instalar Docker e Docker Compose
- ✅ Instalar Node.js 18
- ✅ Clonar o repositório
- ✅ Configurar Nginx
- ✅ Instalar Evolution API
- ✅ Configurar firewall
- ✅ Criar backups automáticos

---

## 🌐 Passo 4: Acessar o Sistema

### Se usou Bridge Adapter:

```bash
# Descubra o IP da VM
ip addr show

# Acesse no navegador do host:
http://IP_DA_VM
```

### Se usou NAT com Port Forwarding:

```
http://localhost:8080
```

---

## 🔧 Configurações Adicionais

### Instalar Guest Additions (Recomendado)

Melhora performance e permite compartilhar pastas:

```bash
# No menu da VM: Dispositivos → Inserir imagem de CD dos Adicionais para Convidado
sudo apt install -y gcc make perl
sudo mount /dev/cdrom /mnt
cd /mnt
sudo ./VBoxLinuxAdditions.run
sudo reboot
```

### Compartilhar Pasta entre Host e VM

1. **No VirtualBox**: Configurações → Pastas Compartilhadas
2. Adicione uma nova pasta compartilhada:
   - **Caminho**: Pasta no host
   - **Nome**: omniflow-shared
   - ✓ Auto-montar
   - ✓ Tornar permanente

3. **Na VM**:
```bash
sudo usermod -aG vboxsf $USER
# Reinicie a VM
# Pasta estará em /media/sf_omniflow-shared/
```

### Habilitar SSH

Para acessar a VM via SSH do host:

```bash
sudo apt install -y openssh-server
sudo systemctl enable ssh
sudo systemctl start ssh
```

Acesso do host:
```bash
# Se NAT com port forwarding
ssh omniflow@localhost -p 2222

# Se Bridge
ssh omniflow@IP_DA_VM
```

---

## 📸 Snapshots (Backup Rápido)

Crie snapshots antes de grandes mudanças:

1. **No VirtualBox**: Clique em **Tirar Foto**
2. Dê um nome descritivo
3. Para restaurar: Clique com botão direito → Restaurar

**Snapshots recomendados:**
- ✅ Após instalação do Ubuntu
- ✅ Após instalação do OmniFlow
- ✅ Antes de atualizações importantes

---

## 🔄 Clone da VM (Backup Completo)

Para criar um backup completo:

1. Desligue a VM
2. Botão direito na VM → **Clonar**
3. Escolha nome (ex: OmniFlow-Backup-2025-01-12)
4. Tipo: Clone completo

---

## 🧪 Testes e Desenvolvimento

A instalação em VirtualBox é ideal para:

- ✅ Testar atualizações antes de aplicar em produção
- ✅ Desenvolvimento e homologação
- ✅ Treinamento de equipe
- ✅ Demonstrações para clientes

### Ambiente de Desenvolvimento

Para desenvolvimento ativo:

```bash
# Clone o repositório em modo dev
cd ~/
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

# Instale dependências
npm install

# Rode em modo desenvolvimento
npm run dev

# Acesse em: http://localhost:5173
```

---

## ⚡ Performance

### Otimizar Performance da VM:

1. **Aumente Memória de Vídeo**: 128 MB
2. **Use SSD**: Se possível, crie a VM em SSD
3. **Desabilite Efeitos Visuais** do Ubuntu:
```bash
sudo apt install -y gnome-tweaks
# Abra Ajustes e desabilite animações
```

4. **Use Paravirtualização**:
   - Configurações → Sistema → Aceleração
   - Interface de Paravirtualização: KVM

---

## 🚨 Troubleshooting

### VM muito lenta

**Solução**:
- Aumente RAM para 8GB
- Verifique se VT-x/AMD-V está habilitado na BIOS
- Use disco SSD
- Reduza resolução da tela

### Não consegue acessar a internet

**Solução**:
```bash
# Reinicie o serviço de rede
sudo systemctl restart NetworkManager

# Ou mude adaptador de rede para NAT
```

### Erro de conexão com Supabase

**Solução**:
- Verifique se tem internet
- Confirme credenciais do Supabase
- Verifique firewall:
```bash
sudo ufw status
sudo ufw allow 443/tcp
```

---

## 🔐 Segurança

### Configurar Firewall

```bash
# Habilitar UFW
sudo ufw enable

# Permitir apenas portas necessárias
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow 8080/tcp # Evolution API
```

### Manter Sistema Atualizado

```bash
# Atualizações automáticas
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 📦 Backup e Restauração

### Backup Manual

```bash
# Backup dos dados
sudo tar czf /tmp/omniflow-backup-$(date +%Y%m%d).tar.gz /opt/omniflow /opt/evolution-api

# Copie para o host através da pasta compartilhada
cp /tmp/omniflow-backup-*.tar.gz /media/sf_omniflow-shared/
```

### Restauração

```bash
# Restaurar backup
sudo tar xzf omniflow-backup-YYYYMMDD.tar.gz -C /
sudo systemctl restart nginx
sudo docker-compose -f /opt/evolution-api/docker-compose.yml restart
```

---

## 🎯 Converter VM para Produção

Se quiser mover a VM para um servidor real:

1. **Exporte a VM**:
   - Arquivo → Exportar Appliance
   - Formato: OVF

2. **No servidor de produção**:
   - Importe o arquivo OVF
   - Ou converta para formato do hypervisor usado

---

## 📞 Suporte

- **Documentação**: `/INSTALLATION.md`
- **Issues**: https://github.com/seu-usuario/omniflow/issues

---

## 🎉 Próximos Passos

1. ✅ Acesse o sistema via navegador
2. ✅ Complete o setup do Super Admin
3. ✅ Configure canais e pagamentos
4. ✅ Faça testes completos
5. ✅ Crie snapshot de backup

**OmniFlow rodando no VirtualBox!** 🚀
