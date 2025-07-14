import dotenv from 'dotenv';
import { EnvConfig } from '../types';

dotenv.config();

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name] || defaultValue;
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${name}`);
  }
  return value;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    throw new Error(`Variável de ambiente ${name} deve ser um número válido`);
  }
  return num;
}

function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

export const config: EnvConfig = {
  port: getEnvNumber('PORT', 3000),
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  
  whapi: {
    token: getEnvVar('WHAPI_TOKEN'),
    url: getEnvVar('WHAPI_URL', 'https://gate.whapi.cloud'),
    webhookUrl: getEnvVar('WEBHOOK_URL'),
  },
  
  llm: {
    baseUrl: getEnvVar('LLM_BASE_URL', 'https://api.openai.com/v1'),
    apiKey: getEnvVar('LLM_API_KEY'),
    model: getEnvVar('LLM_MODEL', 'gpt-3.5-turbo'),
    maxTokens: getEnvNumber('LLM_MAX_TOKENS', 512),
    temperature: parseFloat(getEnvVar('LLM_TEMPERATURE', '0.7')),
    stream: getEnvBoolean('LLM_STREAM', false),
  },
  
  bot: {
    prefix: getEnvVar('BOT_PREFIX', '/'),
    responseTimeout: getEnvNumber('RESPONSE_TIMEOUT', 15000),
    maxConversationHistory: getEnvNumber('MAX_CONVERSATION_HISTORY', 10),
  }
};

// Validar configurações críticas
if (!config.whapi.token) {
  console.error('⚠️  WHAPI_TOKEN não configurado. Configure para integração com WhatsApp.');
}

if (!config.llm.apiKey) {
  console.error('⚠️  LLM_API_KEY não configurado. Configure para integração com LLM.');
}

console.log('🔧 Configuração carregada:', {
  port: config.port,
  env: config.nodeEnv,
  llmModel: config.llm.model,
  whapiUrl: config.whapi.url,
}); 