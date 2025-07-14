# 🍹 Drink Bot - Bot Inteligente de Receitas para WhatsApp

Bot especialista em drinks e coquetéis que usa LLM (Large Language Model) para fornecer receitas personalizadas, sugestões baseadas em ingredientes e dicas de preparo através do WhatsApp.

## 🚀 Características Principais

### 🤖 Sistema de IA Avançado
- **IA Especializada**: Prompts otimizados para receitas de drinks
- **LLM Flexível**: Compatible com OpenAI SDK mas configurável para qualquer provedor (Novita, etc.)
- **Engine de Recomendações**: Sistema de ML para sugestões personalizadas
- **Análise de Intenção**: Detecção automática do que o usuário deseja

### 📱 Integração WhatsApp Completa
- **Recebe e envia mensagens**: Integração total via Whapi.Cloud
- **Conversas Contextuais**: Histórico e memória de conversas
- **Comandos Especiais**: /help, /status, /drinkdodia, etc.
- **Sistema de Cortesia**: Respostas automáticas a agradecimentos

### 🍹 Sistema de Drinks Inteligente
- **Drink do Dia**: Rotação de 7 drinks clássicos baseado na data
- **Base de Dados Completa**: Receitas com metadados nutricionais
- **Busca Inteligente**: Pesquisa por ingredientes, complexidade, ocasião
- **Sistema de Avaliações**: Rating e reviews de usuários

### 👤 Gestão de Usuários Avançada
- **Perfis Personalizados**: Preferências, histórico e estatísticas
- **Sistema de Favoritos**: Drinks salvos por usuário
- **Níveis de Experiência**: Beginner, Intermediate, Advanced, Expert
- **Análise de Comportamento**: Padrões de uso e engajamento

### 🚀 API REST Completa
- **30+ Endpoints**: CRUD completo para usuários, drinks e analytics
- **Documentação Automática**: Endpoints auto-documentados
- **Autenticação**: Sistema de API keys para endpoints admin
- **Cache Inteligente**: Sistema de cache com múltiplas camadas

### 📊 Analytics e Dashboard
- **Métricas em Tempo Real**: Usuários ativos, sessões, performance
- **Business Intelligence**: KPIs, forecasts, insights automáticos
- **Dashboard Administrativo**: Interface completa de analytics
- **Exportação de Dados**: CSV, JSON para análise externa

### ⚡ Performance e Confiabilidade
- **Cache Inteligente**: Sistema LFU/LRU com invalidação por tags
- **TypeScript**: Código 100% tipado e confiável
- **Monitoramento**: Health checks e alertas automáticos
- **Otimização Automática**: Sistema auto-tune baseado em métricas

## 📋 Pré-requisitos

- Node.js 16+ 
- NPM ou Yarn
- Conta [Whapi.Cloud](https://whapi.cloud) (para WhatsApp)
- Chave de API LLM (OpenAI, Novita, etc.)

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd drink-bot
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` baseado no exemplo:

```bash
# ===============================
# CONFIGURAÇÕES DO SERVIDOR
# ===============================
PORT=3000
NODE_ENV=development

# ===============================
# WHATSAPP (Whapi.Cloud)
# ===============================
WHAPI_TOKEN=your_whapi_token_here
WHAPI_URL=https://gate.whapi.cloud
WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook

# ===============================
# LLM CONFIGURATION
# ===============================
LLM_BASE_URL=https://api.novita.ai/v3/openai
LLM_API_KEY=your_llm_api_key_here
LLM_MODEL=deepseek/deepseek-r1
LLM_MAX_TOKENS=512
LLM_TEMPERATURE=0.7
LLM_STREAM=false

# ===============================
# CONFIGURAÇÕES DO BOT
# ===============================
BOT_PREFIX=/
RESPONSE_TIMEOUT=15000
MAX_CONVERSATION_HISTORY=10
```

## 🔧 Configuração

### WhatsApp (Whapi.Cloud)

1. **Cadastre-se** em [Whapi.Cloud](https://whapi.cloud)
2. **Crie um canal** e conecte seu WhatsApp via QR Code
3. **Copie o token** do seu canal
4. **Configure o webhook** apontando para `https://seu-dominio.com/webhook`

### LLM Provider (Exemplo com Novita)

```typescript
// Exemplo de configuração para Novita
LLM_BASE_URL=https://api.novita.ai/v3/openai
LLM_API_KEY=sua_chave_novita
LLM_MODEL=deepseek/deepseek-r1
```

### Desenvolvimento Local com Ngrok

Para testes locais, use o Ngrok:

```bash
# Instale o ngrok
npm install -g ngrok

# Exponha a porta 3000
ngrok http 3000

# Use a URL gerada no WEBHOOK_URL
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm run build
npm start
```

## 📱 Como Usar

### Comandos Disponíveis

- `/help` - Mostra ajuda completa
- `/status` - Status do sistema
- `/stats` - Estatísticas de uso
- `/start` - Mensagem de boas-vindas

### Exemplos de Conversas

```
Usuário: "Como fazer uma caipirinha?"
Bot: 🍹 Caipirinha Clássica

Ingredientes:
• 50ml de cachaça
• 1/2 limão cortado em pedaços
• 2 colheres de açúcar
• Gelo a gosto

Modo de preparo:
1. Coloque o limão no copo...
```

```
Usuário: "Tenho vodka e limão, que drink posso fazer?"
Bot: Com vodka e limão você pode fazer:

🍸 Moscow Mule
• 60ml vodka
• Suco de 1/2 limão
• 120ml ginger beer...
```

## 🎯 Funcionalidades do Bot

### ✨ Tipos de Consulta Suportados

- **Receitas específicas**: "Como fazer mojito?"
- **Ingredientes disponíveis**: "Tenho gin e tônica"
- **Ocasiões**: "Drinks para festa de aniversário"
- **Preferências**: "Drinks sem álcool"
- **Dificuldade**: "Drinks fáceis para iniciantes"
- **Categorias**: "Drinks com whisky"

### 🧠 Sistema de Prompts Inteligentes

O bot analisa automaticamente a intenção do usuário e escolhe o prompt mais adequado:

- `PromptsService.analyzeUserIntent()` - Detecta intenção
- Prompts especializados para cada cenário
- Contexto mantido entre mensagens
- Respostas personalizadas

## 🔄 API Endpoints

### Webhook Principal
```
POST /webhook
```
Recebe mensagens do WhatsApp

### Health Check
```
GET /health
```
Status do sistema

### Teste de Mensagem
```
POST /send-test-message
Body: {
  "to": "5511999999999",
  "message": "Teste"
}
```

### Estatísticas
```
GET /stats
```
Estatísticas de uso

## 🏗️ Arquitetura

```
src/
├── index.ts              # Servidor Express principal
├── config/
│   └── env.ts            # Configurações de ambiente
├── services/
│   ├── llm.ts           # Serviço LLM (OpenAI SDK)
│   ├── whatsapp.ts      # Serviço WhatsApp (Whapi.Cloud)
│   └── prompts.ts       # Prompts especializados
├── controllers/
│   └── webhook.ts       # Controller do webhook
├── types/
│   └── index.ts         # Tipos TypeScript
└── utils/
    └── helpers.ts       # Utilitários
```

## 🧪 Desenvolvimento

### Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento com reload automático
npm run build        # Build para produção
npm start           # Execução em produção
npm run type-check  # Verificação de tipos
```

### Adicionando Novos Prompts

1. Edite `src/services/prompts.ts`
2. Adicione novo método estático
3. Atualize `analyzeUserIntent()` para detectar a nova intenção

```typescript
static getNewPrompt(parameter: string): string {
  return `Seu novo prompt aqui com ${parameter}`;
}
```

## 📦 Deploy

### Heroku

```bash
# Configurar Heroku
heroku create drink-bot-app
heroku config:set NODE_ENV=production
heroku config:set WHAPI_TOKEN=seu_token
# ... outras variáveis

# Deploy
git push heroku main
```

### Railway

```bash
# Configurar Railway
railway login
railway init
railway add

# Configurar variáveis no dashboard
# Deploy automático via GitHub
```

### VPS/Servidor

```bash
# Build da aplicação
npm run build

# Usando PM2
npm install -g pm2
pm2 start dist/index.js --name drink-bot

# Configurar nginx proxy reverso se necessário
```

## 🔒 Segurança

- **Helmet**: Headers de segurança
- **CORS**: Controle de origem
- **Validação**: Dados de entrada validados
- **Rate Limiting**: Implementar se necessário
- **Environment**: Nunca commitar credenciais

## 🐛 Troubleshooting

### Bot não responde

1. ✅ Verificar se WHAPI_TOKEN está correto
2. ✅ Confirmar webhook configurado
3. ✅ Testar endpoint `/health`
4. ✅ Verificar logs do servidor

### LLM não gera respostas

1. ✅ Verificar LLM_API_KEY
2. ✅ Confirmar LLM_BASE_URL
3. ✅ Testar modelo disponível
4. ✅ Verificar cota/limite da API

### Webhook não recebe mensagens

1. ✅ Verificar WEBHOOK_URL público
2. ✅ Confirmar HTTPS (obrigatório)
3. ✅ Testar webhook no painel Whapi.Cloud

## 📝 Logs

O sistema produz logs estruturados:

```
2024-01-15 10:30:00 - 📨 Webhook recebido
2024-01-15 10:30:01 - 💬 Processando mensagem: Como fazer caipirinha?
2024-01-15 10:30:03 - 📤 Mensagem enviada: messageId=abc123
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- 📧 Issues do GitHub para bugs
- 💬 Discussions para dúvidas
- 📖 Documentação completa na Wiki

---

Feito com ❤️ e 🍹 para entusiastas de drinks! 