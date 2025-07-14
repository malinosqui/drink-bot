import axios, { AxiosResponse } from 'axios';
import FormData from 'form-data';
import { config } from '../config/env';
import { SendMessageParams, SendMediaParams } from '../types';

class WhatsAppService {
  private readonly apiUrl: string;
  private readonly token: string;

  constructor() {
    this.apiUrl = config.whapi.url;
    this.token = config.whapi.token;
  }

  // Configurar headers padrão para requisições
  private getHeaders(isFormData: boolean = false): Record<string, string> {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/json'
    };

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    return headers;
  }

  // Enviar mensagem de texto
  async sendTextMessage(params: SendMessageParams): Promise<any> {
    try {
      const url = `${this.apiUrl}/messages/text`;
      
      const response: AxiosResponse = await axios.post(url, {
        to: params.to,
        body: params.body,
        typing_time: params.typing_time || 0
      }, {
        headers: this.getHeaders()
      });

      console.log('📤 Mensagem enviada:', {
        to: params.to,
        messageId: response.data?.id,
        status: response.status
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar mensagem:', error);
      throw new Error('Falha ao enviar mensagem pelo WhatsApp');
    }
  }

  // Enviar imagem
  async sendImage(params: SendMediaParams): Promise<any> {
    try {
      const url = `${this.apiUrl}/messages/image`;
      
      const formData = new FormData();
      formData.append('to', params.to);
      if (params.caption) {
        formData.append('caption', params.caption);
      }
      
      if (typeof params.media === 'string') {
        // URL da imagem
        formData.append('media', params.media);
      } else {
        // Buffer da imagem
        formData.append('media', params.media, params.filename || 'image.jpg');
      }

      const response: AxiosResponse = await axios.post(url, formData, {
        headers: this.getHeaders(true)
      });

      console.log('📤 Imagem enviada:', {
        to: params.to,
        messageId: response.data?.id
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar imagem:', error);
      throw new Error('Falha ao enviar imagem pelo WhatsApp');
    }
  }

  // Enviar documento
  async sendDocument(params: SendMediaParams): Promise<any> {
    try {
      const url = `${this.apiUrl}/messages/document`;
      
      const formData = new FormData();
      formData.append('to', params.to);
      if (params.caption) {
        formData.append('caption', params.caption);
      }
      
      if (typeof params.media === 'string') {
        formData.append('media', params.media);
      } else {
        formData.append('media', params.media, params.filename || 'document.pdf');
      }

      const response: AxiosResponse = await axios.post(url, formData, {
        headers: this.getHeaders(true)
      });

      console.log('📤 Documento enviado:', {
        to: params.to,
        messageId: response.data?.id
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao enviar documento:', error);
      throw new Error('Falha ao enviar documento pelo WhatsApp');
    }
  }

  // Configurar webhook
  async setupWebhook(): Promise<void> {
    try {
      const url = `${this.apiUrl}/settings`;
      
      const settings = {
        webhooks: [
          {
            url: config.whapi.webhookUrl,
            events: [
              { type: "messages", method: "post" }
            ],
            mode: "method"
          }
        ]
      };

      const response: AxiosResponse = await axios.patch(url, settings, {
        headers: this.getHeaders()
      });

      console.log('✅ Webhook configurado com sucesso:', config.whapi.webhookUrl);
      
    } catch (error) {
      console.error('❌ Erro ao configurar webhook:', error);
      console.log('⚠️  Configure manualmente o webhook no painel Whapi.Cloud');
    }
  }

  // Obter informações sobre grupos
  async getGroups(): Promise<any> {
    try {
      const url = `${this.apiUrl}/groups`;
      
      const response: AxiosResponse = await axios.get(url, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter grupos:', error);
      return [];
    }
  }

  // Enviar mensagem para grupo
  async sendGroupMessage(groupId: string, message: string): Promise<any> {
    return this.sendTextMessage({
      to: groupId,
      body: message
    });
  }

  // Validar se um número existe no WhatsApp
  async checkWhatsAppNumber(phoneNumber: string): Promise<boolean> {
    try {
      const url = `${this.apiUrl}/contacts/check`;
      
      const response: AxiosResponse = await axios.post(url, {
        contacts: [phoneNumber]
      }, {
        headers: this.getHeaders()
      });

      const result = response.data?.contacts?.[0];
      return result?.exists === true;
      
    } catch (error) {
      console.error('❌ Erro ao verificar número:', error);
      return false;
    }
  }

  // Marcar mensagem como lida
  async markAsRead(messageId: string): Promise<void> {
    try {
      const url = `${this.apiUrl}/messages/${messageId}/read`;
      
      await axios.post(url, {}, {
        headers: this.getHeaders()
      });
      
    } catch (error) {
      console.error('❌ Erro ao marcar como lida:', error);
    }
  }

  // Obter status da conta
  async getAccountStatus(): Promise<any> {
    try {
      const url = `${this.apiUrl}/health`;
      
      const response: AxiosResponse = await axios.get(url, {
        headers: this.getHeaders()
      });

      return response.data;
    } catch (error) {
      console.error('❌ Erro ao obter status:', error);
      return { status: 'unknown' };
    }
  }

  // Função utilitária para formatear número do WhatsApp
  static formatWhatsAppNumber(phoneNumber: string): string {
    // Remove caracteres não numéricos
    let clean = phoneNumber.replace(/\D/g, '');
    
    // Adiciona código do país se não estiver presente
    if (!clean.startsWith('55') && clean.length === 11) {
      clean = '55' + clean;
    }
    
    // Adiciona sufixo do WhatsApp se não estiver presente
    if (!clean.includes('@')) {
      clean += '@s.whatsapp.net';
    }
    
    return clean;
  }

  // Função para extrair número limpo do chat_id
  static extractPhoneNumber(chatId: string): string {
    return chatId.replace('@s.whatsapp.net', '').replace('@g.us', '');
  }

  // Verificar se é mensagem de grupo
  static isGroupMessage(chatId: string): boolean {
    return chatId.includes('@g.us');
  }

  // Enviar indicador de digitação
  async sendTypingIndicator(chatId: string, duration: number = 3000): Promise<void> {
    try {
      // Simular indicador de digitação
      await new Promise(resolve => setTimeout(resolve, Math.min(duration, 5000)));
    } catch (error) {
      console.error('❌ Erro ao enviar indicador de digitação:', error);
    }
  }
}

export const whatsappService = new WhatsAppService();
export { WhatsAppService }; 