import { Request, Response } from 'express';
import { WhatsAppMessage, WebhookPayload } from '../types';
import { whatsappService, WhatsAppService } from '../services/whatsapp';
import { llmService } from '../services/llm';
import { PromptsService } from '../services/prompts';

export class WebhookController {
  
  // Processar webhook do WhatsApp
  static async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const payload: WebhookPayload = req.body;
      
      // Log da requisição recebida
      console.log('📨 Webhook recebido:', JSON.stringify(payload, null, 2));

      // Processar mensagens recebidas
      if (payload.messages && payload.messages.length > 0) {
        for (const message of payload.messages) {
          await WebhookController.processMessage(message);
        }
      }

      // Processar status de mensagens
      if (payload.statuses && payload.statuses.length > 0) {
        for (const status of payload.statuses) {
          console.log('📊 Status da mensagem:', {
            messageId: status.id,
            status: status.status,
            timestamp: new Date(status.timestamp * 1000)
          });
        }
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  // Processar mensagem individual
  private static async processMessage(message: WhatsAppMessage): Promise<void> {
    try {
      // Ignorar mensagens próprias
      if (message.from_me) {
        console.log('🔄 Ignorando mensagem própria');
        return;
      }

      // Só processar mensagens de texto por enquanto
      if (message.type !== 'text' || !message.text?.body) {
        console.log('⏭️  Ignorando mensagem não-texto:', message.type);
        return;
      }

      const userMessage = message.text.body.trim();
      const chatId = message.chat_id;
      const userId = WhatsAppService.extractPhoneNumber(chatId);
      const userName = message.from_name || 'Usuário';

      console.log('💬 Processando mensagem:', {
        from: userName,
        chatId: chatId,
        message: userMessage,
        isGroup: WhatsAppService.isGroupMessage(chatId)
      });

      // Marcar mensagem como lida
      await whatsappService.markAsRead(message.id);

      // Enviar indicador de digitação
      await whatsappService.sendTypingIndicator(chatId, 2000);

      // Verificar se é comando especial
      if (await WebhookController.handleSpecialCommands(userMessage, chatId)) {
        return;
      }

      // Analisar intenção do usuário e escolher prompt apropriado
      const systemPrompt = PromptsService.analyzeUserIntent(userMessage);

      // Gerar resposta usando LLM
      const response = await llmService.generateResponse(
        userId,
        chatId,
        userMessage,
        systemPrompt
      );

      // Enviar resposta
      await whatsappService.sendTextMessage({
        to: chatId,
        body: response.content,
        typing_time: 1000
      });

      console.log('✅ Resposta enviada com sucesso');

    } catch (error) {
      console.error('❌ Erro ao processar mensagem:', error);
      
      // Enviar mensagem de erro amigável
      try {
        await whatsappService.sendTextMessage({
          to: message.chat_id,
          body: 'Desculpe, tive um problema técnico. Tente novamente em alguns instantes! 🤖'
        });
      } catch (sendError) {
        console.error('❌ Erro ao enviar mensagem de erro:', sendError);
      }
    }
  }

  // Lidar com comandos especiais
  private static async handleSpecialCommands(message: string, chatId: string): Promise<boolean> {
    const lowerMessage = message.toLowerCase().trim();

    // Comando de ajuda
    if (lowerMessage === '/help' || lowerMessage === 'help' || lowerMessage === 'ajuda') {
      const helpMessage = `🍹 *Drink Bot - Seu Bartender Virtual*

Oi! Eu sou seu assistente especialista em drinks e coquetéis! 

*O que posso fazer por você:*
• 🍸 Sugerir receitas de drinks
• 🥤 Criar drinks sem álcool (mocktails)
• 📖 Ensinar técnicas de preparo
• 🥃 Explicar sobre ingredientes
• 🎯 Recomendar drinks para ocasiões
• 🔄 Mostrar variações de receitas clássicas

*Exemplos do que você pode perguntar:*
• "Como fazer uma caipirinha?"
• "Tenho vodka e limão, que drink posso fazer?"
• "Drinks sem álcool para festa"
• "Drinks fáceis para iniciantes"

*Comandos especiais:*
• /help - Esta mensagem de ajuda
• /status - Status do bot
• /stats - Estatísticas

Pode conversar comigo naturalmente! Estou aqui para ajudar você a criar drinks incríveis! 🚀`;

      await whatsappService.sendTextMessage({
        to: chatId,
        body: helpMessage
      });

      return true;
    }

    // Comando de status
    if (lowerMessage === '/status') {
      const status = await whatsappService.getAccountStatus();
      const statusMessage = `🤖 *Status do Drink Bot*

WhatsApp: ${status.status || 'Conectado'} ✅
LLM: Funcionando ✅
Última atualização: ${new Date().toLocaleString('pt-BR')}

Tudo funcionando perfeitamente! 🚀`;

      await whatsappService.sendTextMessage({
        to: chatId,
        body: statusMessage
      });

      return true;
    }

    // Comando de estatísticas
    if (lowerMessage === '/stats') {
      const stats = llmService.getStats();
      const statsMessage = `📊 *Estatísticas do Bot*

Conversas ativas: ${stats.activeConversations}
Total de conversas: ${stats.totalConversations}
Servidor online há: ${process.uptime().toFixed(0)}s

Obrigado por usar o Drink Bot! 🍹`;

      await whatsappService.sendTextMessage({
        to: chatId,
        body: statsMessage
      });

      return true;
    }

    // Comando de boas-vindas/início
    if (lowerMessage === '/start' || lowerMessage === 'oi' || lowerMessage === 'olá' || lowerMessage === 'hi') {
      const welcomeMessage = `🍹 Olá! Bem-vindo ao *Drink Bot*!

Eu sou seu bartender virtual especialista em drinks e coquetéis! 

🎯 *Pergunte-me qualquer coisa sobre:*
• Receitas de drinks clássicos
• Coquetéis modernos e criativos  
• Drinks sem álcool (mocktails)
• Técnicas de preparo
• Harmonização com comidas
• Drinks para ocasiões especiais

💡 *Exemplos:*
• "Como fazer um mojito?"
• "Drinks com gin"
• "Preciso de algo sem álcool"
• "Drinks para festa de aniversário"

Digite */help* para ver todos os comandos disponíveis.

O que você gostaria de beber hoje? 🥂`;

      await whatsappService.sendTextMessage({
        to: chatId,
        body: welcomeMessage
      });

      return true;
    }

    return false;
  }

  // Endpoint para testar envio de mensagem (opcional)
  static async sendTestMessage(req: Request, res: Response): Promise<void> {
    try {
      const { to, message } = req.body;

      if (!to || !message) {
        res.status(400).json({ error: 'Parâmetros "to" e "message" são obrigatórios' });
        return;
      }

      const result = await whatsappService.sendTextMessage({
        to: WhatsAppService.formatWhatsAppNumber(to),
        body: message
      });

      res.json({ success: true, messageId: result.id });
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem de teste:', error);
      res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
  }

  // Health check
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const whatsappStatus = await whatsappService.getAccountStatus();
      const llmStats = llmService.getStats();

      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        whatsapp: whatsappStatus,
        llm: llmStats,
        environment: process.env.NODE_ENV
      });
    } catch (error) {
      console.error('❌ Erro no health check:', error);
      res.status(500).json({ error: 'Erro no health check' });
    }
  }
} 