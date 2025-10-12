# 🤝 Guia de Contribuição - OmniFlow

## Bem-vindo!

Obrigado por considerar contribuir com o OmniFlow! Este documento fornece diretrizes para contribuições.

## Como Contribuir

### 1. Fork e Clone

```bash
# Fork o projeto no GitHub
# Clone seu fork
git clone https://github.com/seu-usuario/omniflow.git
cd omniflow

# Adicione o repositório original como upstream
git remote add upstream https://github.com/original-usuario/omniflow.git
```

### 2. Crie uma Branch

```bash
# Atualize main
git checkout main
git pull upstream main

# Crie uma branch para sua feature
git checkout -b feature/nome-da-feature
```

### 3. Desenvolva

```bash
# Instale dependências
npm install

# Execute em modo desenvolvimento
npm run dev

# Execute testes (quando disponíveis)
npm test
```

### 4. Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Tipos de commit
feat: Nova funcionalidade
fix: Correção de bug
docs: Documentação
style: Formatação (sem mudança de código)
refactor: Refatoração de código
test: Testes
chore: Tarefas de manutenção

# Exemplos
git commit -m "feat: adiciona integração com WhatsApp"
git commit -m "fix: corrige erro de autenticação"
git commit -m "docs: atualiza guia de instalação"
```

### 5. Push e Pull Request

```bash
# Push para seu fork
git push origin feature/nome-da-feature

# Crie um Pull Request no GitHub
```

## Diretrizes de Código

### Estilo

- Use TypeScript
- Siga ESLint rules
- Use componentes funcionais com hooks
- Prefira composição sobre herança
- Mantenha componentes pequenos e focados

### Nomenclatura

```typescript
// Componentes: PascalCase
const UserProfile = () => {}

// Hooks: camelCase com prefixo 'use'
const useAuth = () => {}

// Funções: camelCase
const getUserData = () => {}

// Constantes: UPPER_SNAKE_CASE
const API_ENDPOINT = ""

// Interfaces/Types: PascalCase com prefixo 'I' ou sufixo 'Type'
interface IUser {}
type UserType = {}
```

### Estrutura de Arquivos

```
src/
├── components/       # Componentes reutilizáveis
│   ├── ui/          # Componentes de UI (shadcn)
│   └── features/    # Componentes específicos de features
├── pages/           # Páginas/Rotas
├── hooks/           # Custom hooks
├── lib/             # Utilitários
├── integrations/    # Integrações (Supabase, etc)
└── types/           # Definições de tipos
```

## Checklist do Pull Request

- [ ] Código segue as diretrizes de estilo
- [ ] Comentários foram adicionados onde necessário
- [ ] Documentação foi atualizada
- [ ] Não há warnings no console
- [ ] Build passa sem erros (`npm run build`)
- [ ] Testes passam (quando disponíveis)
- [ ] PR tem título descritivo
- [ ] PR referencia issue relacionada (#123)

## Tipos de Contribuição

### 🐛 Reportar Bugs

Use o template de issue para bugs:
- Descreva o problema
- Passos para reproduzir
- Comportamento esperado
- Screenshots se aplicável
- Ambiente (OS, Browser, etc)

### 💡 Sugerir Features

Use o template de issue para features:
- Descrição clara da feature
- Casos de uso
- Mockups/wireframes se aplicável
- Impacto esperado

### 📝 Documentação

- Corrija typos
- Melhore explicações
- Adicione exemplos
- Traduza documentação

### 🎨 Design

- Melhorias de UI/UX
- Acessibilidade
- Responsividade
- Animações

## Código de Conduta

- Seja respeitoso
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia

## Dúvidas?

- Abra uma issue com a tag `question`
- Entre em contato via Discord
- Consulte a documentação

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto.

---

Obrigado por contribuir! 🎉
