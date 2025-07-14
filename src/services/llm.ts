import OpenAI from 'openai';
import { config } from '../config/env';
import { LLMResponse, ConversationContext, ConversationMessage } from '../types';

class LLMService {
  private client: OpenAI;
  private conversations: Map<string, ConversationContext> = new Map();

  constructor() {
    this.client = new OpenAI({
      baseURL: config.llm.baseUrl,
      apiKey: config.llm.apiKey,
    });
  }

  async generateResponse(
    userId: string, 
    chatId: string, 
    userMessage: string,
    systemPrompt?: string
  ): Promise<LLMResponse> {
    try {
      // Obter ou criar contexto da conversa
      const context = this.getOrCreateContext(userId, chatId);
      
      // Adicionar mensagem do usuário ao histórico
      this.addMessage(context, 'user', userMessage);

      // Preparar mensagens para o LLM
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }

      // Adicionar histórico da conversa (limitado)
      context.history
        .slice(-config.bot.maxConversationHistory)
        .forEach(msg => {
          messages.push({ 
            role: msg.role, 
            content: msg.content 
          });
        });

      // Por enquanto, sempre usar modo não-stream
      const completion = await this.client.chat.completions.create({
        model: config.llm.model,
        messages: messages,
        max_tokens: config.llm.maxTokens,
        temperature: config.llm.temperature,
        stream: false, // Fixo em false por enquanto
      }) as OpenAI.Chat.ChatCompletion;

      const choice = completion.choices[0];
      const responseContent = choice.message?.content || 'Desculpe, não consegui gerar uma resposta.';

      // Adicionar resposta do assistente ao histórico
      this.addMessage(context, 'assistant', responseContent);

      return {
        content: responseContent,
        finishReason: choice?.finish_reason || undefined,
        usage: completion.usage ? {
          promptTokens: completion.usage.prompt_tokens,
          completionTokens: completion.usage.completion_tokens,
          totalTokens: completion.usage.total_tokens,
        } : undefined,
      };

    } catch (error) {
      console.error('Erro ao gerar resposta do LLM:', error);
      throw new Error('Erro interno do sistema de IA');
    }
  }

  private getOrCreateContext(userId: string, chatId: string): ConversationContext {
    const key = `${userId}-${chatId}`;
    let context = this.conversations.get(key);
    
    if (!context) {
      context = {
        userId,
        chatId,
        history: [],
        lastActivity: new Date(),
      };
      this.conversations.set(key, context);
    } else {
      context.lastActivity = new Date();
    }
    
    return context;
  }

  private addMessage(
    context: ConversationContext, 
    role: 'user' | 'assistant', 
    content: string
  ): void {
    context.history.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Limitar histórico se necessário
    if (context.history.length > config.bot.maxConversationHistory * 2) {
      context.history = context.history.slice(-config.bot.maxConversationHistory);
    }
  }

  // Limpar conversas antigas (pode ser chamado periodicamente)
  cleanOldConversations(maxAge: number = 24 * 60 * 60 * 1000): void {
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [key, context] of this.conversations.entries()) {
      if (context.lastActivity < cutoff) {
        this.conversations.delete(key);
      }
    }
  }

  // Obter estatísticas das conversas
  getStats(): { totalConversations: number; activeConversations: number } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let activeCount = 0;
    
    for (const context of this.conversations.values()) {
      if (context.lastActivity > oneHourAgo) {
        activeCount++;
      }
    }

    return {
      totalConversations: this.conversations.size,
      activeConversations: activeCount,
    };
  }
}

export const llmService = new LLMService(); 