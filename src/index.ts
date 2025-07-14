import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/env';
import { WebhookController } from './controllers/webhook';
import { whatsappService } from './services/whatsapp';
import { llmService } from './services/llm';

const app = express();

// Middleware de segurança
app.use(helmet());

// CORS configurado
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parser JSON com limite aumentado para imagens
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Rotas principais
app.get('/', (req, res) => {
  res.json({
    message: '🍹 Drink Bot API - Funcionando!',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      webhook: 'POST /webhook',
      health: 'GET /health',
      test: 'POST /send-test-message'
    }
  });
});

// Health check
app.get('/health', WebhookController.healthCheck);

// Webhook principal do WhatsApp
app.post('/webhook', WebhookController.handleWebhook);

// Endpoint para testar envio de mensagem (opcional, para desenvolvimento)
app.post('/send-test-message', WebhookController.sendTestMessage);

// Endpoint para obter estatísticas
app.get('/stats', async (req, res) => {
  try {
    const stats = llmService.getStats();
    const whatsappStatus = await whatsappService.getAccountStatus();
    
    res.json({
      uptime: process.uptime(),
      llm: stats,
      whatsapp: whatsappStatus,
      memory: process.memoryUsage(),
      environment: config.nodeEnv
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro ao obter estatísticas' });
  }
});

// Middleware de tratamento de erros
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: config.nodeEnv === 'development' ? err.message : 'Algo deu errado'
  });
});

// Middleware para rotas não encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /webhook',
      'POST /send-test-message',
      'GET /stats'
    ]
  });
});

// Função para inicializar a aplicação
async function startServer(): Promise<void> {
  try {
    console.log('🚀 Iniciando Drink Bot...');
    
    // Configurar webhook automaticamente (se possível)
    try {
      if (config.whapi.webhookUrl) {
        await whatsappService.setupWebhook();
      }
    } catch (error) {
      console.log('⚠️  Não foi possível configurar webhook automaticamente');
    }

    // Limpeza periódica de conversas antigas (a cada hora)
    setInterval(() => {
      llmService.cleanOldConversations();
      console.log('🧹 Limpeza de conversas antigas executada');
    }, 60 * 60 * 1000);

    // Iniciar servidor
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('🍹 ===== DRINK BOT INICIADO ===== 🍹');
      console.log(`📡 Servidor rodando na porta: ${config.port}`);
      console.log(`🌐 URL: http://localhost:${config.port}`);
      console.log(`📱 Webhook: ${config.whapi.webhookUrl || 'Não configurado'}`);
      console.log(`🤖 LLM: ${config.llm.model}`);
      console.log(`⚙️  Ambiente: ${config.nodeEnv}`);
      console.log('');
      console.log('📋 Endpoints disponíveis:');
      console.log(`   GET  /        - Informações da API`);
      console.log(`   GET  /health  - Status do sistema`);
      console.log(`   POST /webhook - Webhook WhatsApp`);
      console.log(`   GET  /stats   - Estatísticas`);
      console.log('');
      console.log('🎯 Bot pronto para receber mensagens!');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('📴 Recebido SIGTERM, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      console.log('📴 Recebido SIGINT, encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado com sucesso');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Capturar erros não tratados
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

// Iniciar aplicação
startServer().catch((error) => {
  console.error('❌ Falha ao iniciar aplicação:', error);
  process.exit(1);
}); 