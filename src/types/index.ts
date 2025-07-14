// Tipos para mensagens do WhatsApp
export interface WhatsAppMessage {
  id: string;
  from_me: boolean;
  type: 'text' | 'image' | 'document' | 'video' | 'audio' | 'voice';
  chat_id: string;
  timestamp: number;
  text?: {
    body: string;
  };
  from_name?: string;
  media?: {
    url: string;
    mime_type: string;
    filename?: string;
  };
}

// Webhook payload do Whapi.Cloud
export interface WebhookPayload {
  messages?: WhatsAppMessage[];
  statuses?: MessageStatus[];
}

// Status de mensagem
export interface MessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: number;
  recipient_id: string;
}

// Parâmetros para envio de mensagem
export interface SendMessageParams {
  to: string;
  body: string;
  typing_time?: number;
}

// Parâmetros para envio de mídia
export interface SendMediaParams {
  to: string;
  media: string | Buffer;
  caption?: string;
  filename?: string;
}

// Configurações do LLM
export interface LLMConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  stream: boolean;
}

// Contexto de conversa
export interface ConversationContext {
  userId: string;
  chatId: string;
  history: ConversationMessage[];
  lastActivity: Date;
}

// Mensagem da conversa
export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Resposta do LLM
export interface LLMResponse {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Receita de drink
export interface DrinkRecipe {
  name: string;
  ingredients: string[];
  instructions: string[];
  glassType?: string;
  garnish?: string;
  difficulty?: 'fácil' | 'médio' | 'difícil';
  category?: string;
}

// Comando do bot
export interface BotCommand {
  command: string;
  description: string;
  handler: (message: WhatsAppMessage, args: string[]) => Promise<void>;
}

// Configuração do ambiente
export interface EnvConfig {
  port: number;
  nodeEnv: string;
  whapi: {
    token: string;
    url: string;
    webhookUrl: string;
  };
  llm: LLMConfig;
  bot: {
    prefix: string;
    responseTimeout: number;
    maxConversationHistory: number;
  };
} 