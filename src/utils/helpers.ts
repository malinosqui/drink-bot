// Utilitários gerais para o projeto

/**
 * Formatar número de telefone brasileiro para padrão internacional
 */
export function formatBrazilianPhone(phone: string): string {
  // Remove tudo que não é número
  const clean = phone.replace(/\D/g, '');
  
  // Se já tem código do país, retorna como está
  if (clean.startsWith('55') && clean.length >= 12) {
    return clean;
  }
  
  // Se é número brasileiro sem código do país
  if (clean.length === 11 || clean.length === 10) {
    return '55' + clean;
  }
  
  return clean;
}

/**
 * Validar se string é um número de telefone válido
 */
export function isValidPhoneNumber(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  
  // Número brasileiro: 11 dígitos (com 9) ou 10 dígitos (sem 9)
  // Com código do país: 13 ou 12 dígitos
  return /^(55)?(11|12|13|14|15|16|17|18|19|21|22|24|27|28|31|32|33|34|35|37|38|41|42|43|44|45|46|47|48|49|51|53|54|55|61|62|63|64|65|66|67|68|69|71|73|74|75|77|79|81|82|83|84|85|86|87|88|89|91|92|93|94|95|96|97|98|99)\d{8,9}$/.test(clean);
}

/**
 * Delay/sleep para controle de tempo
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Truncar texto mantendo integridade de palavras
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  // Se tem espaço e não está muito no início
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Extrair ingredientes de uma mensagem de texto
 */
export function extractIngredients(text: string): string[] {
  const commonIngredients = [
    'vodka', 'gin', 'whisky', 'whiskey', 'cachaça', 'rum', 'tequila', 'bourbon',
    'limão', 'lime', 'laranja', 'maracujá', 'morango', 'abacaxi', 'manga',
    'açúcar', 'mel', 'xarope', 'grenadine', 'angostura',
    'gelo', 'água', 'refrigerante', 'tônica', 'soda', 'sprite', 'coca',
    'hortelã', 'manjericão', 'gengibre', 'canela', 'pimenta',
    'leite', 'creme', 'iogurte', 'sorvete'
  ];
  
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  
  for (const ingredient of commonIngredients) {
    if (lowerText.includes(ingredient)) {
      found.push(ingredient);
    }
  }
  
  return [...new Set(found)]; // Remove duplicados
}

/**
 * Detectar tipo de ocasião na mensagem
 */
export function detectOccasion(text: string): string | null {
  const occasions = {
    'festa': ['festa', 'party', 'celebração'],
    'aniversário': ['aniversário', 'birthday', 'anniversary'],
    'casamento': ['casamento', 'wedding', 'matrimônio'],
    'ano novo': ['ano novo', 'réveillon', 'new year'],
    'natal': ['natal', 'christmas', 'ceia'],
    'encontro': ['encontro', 'date', 'romantic'],
    'trabalho': ['trabalho', 'office', 'escritório', 'reunião'],
    'verão': ['verão', 'summer', 'praia', 'piscina'],
    'inverno': ['inverno', 'winter', 'frio']
  };
  
  const lowerText = text.toLowerCase();
  
  for (const [occasion, keywords] of Object.entries(occasions)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      return occasion;
    }
  }
  
  return null;
}

/**
 * Escapar caracteres especiais do markdown do WhatsApp
 */
export function escapeMarkdown(text: string): string {
  return text
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\~')
    .replace(/`/g, '\\`')
    .replace(/>/g, '\\>')
    .replace(/#/g, '\\#')
    .replace(/\+/g, '\\+')
    .replace(/-/g, '\\-')
    .replace(/=/g, '\\=')
    .replace(/\|/g, '\\|')
    .replace(/{/g, '\\{')
    .replace(/}/g, '\\}')
    .replace(/\./g, '\\.')
    .replace(/!/g, '\\!');
}

/**
 * Converter timestamp Unix para data legível em português
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Gerar ID único simples
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Validar se uma URL é válida
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calcular tempo decorrido em formato humano
 */
export function timeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora mesmo';
  if (diffMins < 60) return `${diffMins}min atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Limpar e normalizar texto de entrada
 */
export function normalizeText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ') // Múltiplos espaços vira um só
    .replace(/[^\w\s\u00C0-\u024F\u1E00-\u1EFF]/g, '') // Remove caracteres especiais mas mantém acentos
    .toLowerCase();
}

/**
 * Extrair mencões (@usuario) de uma mensagem
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

/**
 * Verificar se horário está dentro do horário comercial
 */
export function isBusinessHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay(); // 0 = domingo, 6 = sábado
  
  // Segunda a sexta, 9h às 18h
  return day >= 1 && day <= 5 && hour >= 9 && hour < 18;
}

/**
 * Formatar duração em milissegundos para texto legível
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
} 