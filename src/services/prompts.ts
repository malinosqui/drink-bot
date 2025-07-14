import { DrinkRecipe } from '../types';

export class PromptsService {
  
  // Drinks do dia - rotaciona baseado na data
  private static readonly DRINKS_OF_THE_DAY = [
    {
      name: 'Caipirinha',
      description: 'O clássico brasileiro que nunca sai de moda! 🇧🇷',
      recipe: '• 50ml de cachaça\n• 1/2 limão cortado em pedaços\n• 2 colheres (chá) de açúcar\n• Gelo a gosto\n\nAmasse o limão com açúcar, adicione cachaça e gelo. Misture bem!'
    },
    {
      name: 'Mojito',
      description: 'Refrescante e aromático, perfeito para qualquer hora! 🌿',
      recipe: '• 50ml de rum branco\n• 10 folhas de hortelã\n• 1/2 limão\n• 2 colheres (chá) de açúcar\n• Água com gás\n• Gelo\n\nAmasse a hortelã com açúcar, adicione limão, rum, gelo e complete com água com gás!'
    },
    {
      name: 'Negroni',
      description: 'Sofisticado e equilibrado, para paladares mais refinados! 🍊',
      recipe: '• 30ml de gin\n• 30ml de vermute rosso\n• 30ml de Campari\n• Casca de laranja\n• Gelo\n\nMisture tudo com gelo, coe e sirva com casca de laranja!'
    },
    {
      name: 'Margarita',
      description: 'O sabor do México no seu copo! 🇲🇽',
      recipe: '• 50ml de tequila\n• 25ml de triple sec\n• 25ml de suco de limão\n• Sal para a borda\n• Gelo\n\nPasse sal na borda do copo, misture ingredientes com gelo e sirva!'
    },
    {
      name: 'Old Fashioned',
      description: 'Clássico atemporal para os amantes de whisky! 🥃',
      recipe: '• 60ml de bourbon\n• 1 cubo de açúcar\n• 2-3 gotas de angostura\n• Casca de laranja\n• Gelo\n\nAmasse açúcar com angostura, adicione whisky, gelo e casca de laranja!'
    },
    {
      name: 'Cosmopolitan',
      description: 'Elegante e rosado, perfeito para brindar! 💅',
      recipe: '• 40ml de vodka\n• 15ml de triple sec\n• 30ml de suco de cranberry\n• 15ml de suco de limão\n• Gelo\n\nMisture tudo com gelo, coe e sirva em taça de martini!'
    },
    {
      name: 'Daiquiri',
      description: 'Simplicidade perfeita em três ingredientes! 🍋',
      recipe: '• 60ml de rum branco\n• 30ml de suco de limão\n• 15ml de xarope simples\n• Gelo\n\nMisture tudo com gelo, coe e sirva em taça gelada!'
    }
  ];

  // Respostas de cortesia aleatórias
  private static readonly COURTESY_RESPONSES = [
    "Fico feliz em ajudar! 🍹 Qualquer dúvida sobre drinks, é só falar!",
    "Por nada! Adoro compartilhar conhecimento sobre drinks! 🥂",
    "De nada! Espero que você aproveite muito esse drink! 🍸",
    "Foi um prazer ajudar! Bom drink! 🍻",
    "Sempre às ordens para falar de drinks! Saúde! 🥃",
    "Que bom que pude ajudar! Drinks são minha paixão! 🍷",
    "Imagina! Agora vai lá fazer esse drink delicioso! 🧊",
    "Disponha sempre! Adoro trocar experiências sobre coquetelaria! 🍊"
  ];

  // Detectar agradecimentos
  private static readonly GRATITUDE_PATTERNS = [
    'obrigad', 'valeu', 'obrig', 'vlw', 'thanks', 'thank you', 
    'brigad', 'grato', 'grata', 'muito bom', 'excelente', 
    'perfeito', 'show', 'top', 'massa', 'demais'
  ];

  // Obter drink do dia baseado na data
  static getDrinkOfTheDay(): { name: string; description: string; recipe: string } {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = domingo, 1 = segunda, etc.
    return this.DRINKS_OF_THE_DAY[dayOfWeek];
  }

  // Verificar se mensagem é agradecimento
  static isGratitudeMessage(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    return this.GRATITUDE_PATTERNS.some(pattern => lowerMessage.includes(pattern));
  }

  // Obter resposta de cortesia aleatória
  static getRandomCourtesyResponse(): string {
    const randomIndex = Math.floor(Math.random() * this.COURTESY_RESPONSES.length);
    return this.COURTESY_RESPONSES[randomIndex];
  }

  // Saudação personalizada por horário
  static getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Bom dia! ☀️ Que tal começar o dia pensando no drink perfeito para mais tarde?";
    } else if (hour >= 12 && hour < 18) {
      return "Boa tarde! 🌤️ Perfeito para planejar um drink refrescante!";
    } else if (hour >= 18 && hour < 22) {
      return "Boa noite! 🌆 Hora perfeita para um drink especial!";
    } else {
      return "Opa, tarde da noite! 🌙 Que tal um drink mais suave para relaxar?";
    }
  }

  // Prompt principal do sistema para o bot de drinks
  static getSystemPrompt(): string {
    const drinkOfDay = this.getDrinkOfTheDay();
    const greeting = this.getTimeBasedGreeting();
    
    return `Você é um bartender expert e assistente especializado em drinks e coquetéis. Sua missão é ajudar pessoas a descobrir, aprender e criar deliciosos drinks.

${greeting}

🍹 DRINK DO DIA: ${drinkOfDay.name}
${drinkOfDay.description}

${drinkOfDay.recipe}

PERSONALIDADE:
- Amigável, entusiasmado e conhecedor
- Use linguagem casual mas informativa
- Seja criativo nas sugestões
- Incentive a experimentação
- Responda a agradecimentos de forma carinhosa

ESPECIALIDADES:
- Receitas de coquetéis clássicos e modernos
- Drinks sem álcool (mocktails)
- Variações regionais (caipirinha, mojito, etc.)
- Harmonização de sabores
- Técnicas de preparo
- Substituições de ingredientes

FORMATO DE RESPOSTA:
- Sempre responda em português brasileiro
- Para receitas, inclua ingredientes e modo de preparo
- Sugira apresentação e decoração
- Indique dificuldade quando relevante
- Seja específico com medidas

EXEMPLOS DE INTERAÇÃO:
- Se perguntarem sobre um drink: explique a receita completa
- Se mencionarem ingredientes: sugira drinks que usam esses ingredientes
- Se pedirem algo específico (sem álcool, refrescante, etc.): faça sugestões adequadas

Sempre mantenha o foco em drinks e bebidas. Se a pergunta não for relacionada, direcione gentilmente de volta ao tema de drinks.`;
  }

  // Prompt para sugestões baseadas em ingredientes
  static getIngredientBasedPrompt(ingredients: string[]): string {
    const ingredientList = ingredients.join(', ');
    return `O usuário tem estes ingredientes disponíveis: ${ingredientList}

Sugira 2-3 drinks diferentes que podem ser feitos com esses ingredientes. Para cada drink:
1. Nome do drink
2. Lista completa de ingredientes (com medidas)
3. Modo de preparo passo a passo
4. Tipo de copo recomendado
5. Decoração sugerida

Se alguns ingredientes estiverem faltando para drinks clássicos, mencione as substituições possíveis.`;
  }

  // Prompt para busca por categoria
  static getCategoryPrompt(category: string): string {
    return `O usuário está interessado em drinks da categoria: ${category}

Sugira 3 drinks desta categoria, variando do mais simples ao mais elaborado:
1. Nome e breve descrição
2. Ingredientes com medidas exatas
3. Modo de preparo detalhado
4. Dica especial para cada um

Inclua informações sobre origem ou curiosidades quando relevante.`;
  }

  // Prompt para drinks sem álcool
  static getMocktailPrompt(): string {
    return `O usuário quer opções de drinks sem álcool (mocktails).

Sugira 3 mocktails deliciosos e refrescantes:
1. Nome criativo
2. Ingredientes (sem álcool)
3. Modo de preparo
4. Decoração sugerida
5. Por que é especial

Varie entre opções frutadas, herbais e exóticas. Inclua dicas de apresentação para tornar as bebidas visualmente atrativas.`;
  }

  // Prompt para explicar técnicas
  static getTechniquePrompt(technique: string): string {
    return `Explique detalhadamente a técnica de bartending: ${technique}

Inclua:
1. O que é e para que serve
2. Passo a passo de como fazer
3. Equipamentos necessários
4. Drinks que usam esta técnica
5. Dicas para iniciantes

Use linguagem clara e didática.`;
  }

  // Prompt para harmonização
  static getPairingPrompt(food: string): string {
    return `O usuário quer saber quais drinks harmonizam bem com: ${food}

Sugira 2-3 drinks que combinam perfeitamente:
1. Nome do drink e por que combina
2. Receita completa
3. Como a harmonização funciona (sabores, texturas)
4. Momento ideal para servir

Explique os princípios da harmonização usados.`;
  }

  // Prompt para ocasiões especiais
  static getOccasionPrompt(occasion: string): string {
    return `O usuário precisa de drinks para a ocasião: ${occasion}

Sugira drinks apropriados para esta ocasião:
1. Drink principal (mais elaborado)
2. Opção simples para fazer em quantidade
3. Versão sem álcool
4. Dicas de preparação antecipada
5. Decoração temática

Considere praticidade, sabor e apresentação adequados para o evento.`;
  }

  // Prompt para iniciantes
  static getBeginnerPrompt(): string {
    return `O usuário é iniciante no mundo dos drinks.

Sugira 3 drinks fáceis de fazer para começar:
1. Nome e por que é ideal para iniciantes
2. Ingredientes básicos e fáceis de encontrar
3. Técnicas simples envolvidas
4. Equipamentos mínimos necessários
5. Variações simples para experimentar

Inclua dicas gerais para quem está começando no mundo da coquetelaria.`;
  }

  // Prompt para criar variações
  static getVariationPrompt(drinkName: string): string {
    return `O usuário quer conhecer variações do drink: ${drinkName}

Explique:
1. Receita clássica original
2. 2-3 variações populares (com nomes se tiverem)
3. Como cada variação muda o sabor
4. Origem das variações quando conhecida
5. Qual variação recomenda para diferentes ocasiões

Seja criativo mas mantenha a essência do drink original.`;
  }

  // Prompt para emergência quando não há ingredientes específicos
  static getSubstitutionPrompt(missingIngredient: string, drinkName: string): string {
    return `O usuário quer fazer ${drinkName} mas não tem ${missingIngredient}.

Sugira:
1. Melhores substitutos para ${missingIngredient}
2. Como cada substituto afeta o sabor
3. Ajustes nas proporções se necessário
4. Se vale a pena fazer com substituto ou sugerir outro drink
5. Onde encontrar o ingrediente original

Seja honesto sobre como ficará o resultado com cada substituição.`;
  }

  // Analisar mensagem do usuário para escolher o prompt mais adequado
  static analyzeUserIntent(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Detectar agradecimentos primeiro
    if (this.isGratitudeMessage(message)) {
      return this.getRandomCourtesyResponse();
    }
    
    // Detectar solicitação do drink do dia
    if (lowerMessage.includes('drink do dia') || lowerMessage.includes('qual o drink de hoje') || 
        lowerMessage.includes('drink de hoje') || lowerMessage.includes('sugestão de hoje')) {
      const drinkOfDay = this.getDrinkOfTheDay();
      return `🍹 **DRINK DO DIA: ${drinkOfDay.name}**

${drinkOfDay.description}

**Receita:**
${drinkOfDay.recipe}

Quer que eu explique alguma técnica específica ou sugira uma variação? 😊`;
    }
    
    // Detectar saudações e comandos de início
    if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('hey') || 
        lowerMessage.includes('/start') || lowerMessage.includes('começar') || lowerMessage.includes('help me')) {
      const greeting = this.getTimeBasedGreeting();
      const drinkOfDay = this.getDrinkOfTheDay();
      return `${greeting}

Sou seu bartender virtual especializado em drinks! 🍹

🍹 **DRINK DO DIA: ${drinkOfDay.name}**
${drinkOfDay.description}

**Como posso ajudar hoje?**
• Receitas de drinks clássicos e modernos
• Sugestões baseadas nos seus ingredientes
• Drinks sem álcool (mocktails)
• Técnicas de preparo
• Harmonização com comidas

Digite "drink do dia" para ver a receita completa ou me fale que tipo de drink você quer! 😊`;
    }
    
    // Palavras-chave para diferentes intenções
    if (lowerMessage.includes('sem álcool') || lowerMessage.includes('mocktail') || lowerMessage.includes('não bebo') ||
        lowerMessage.includes('virgem') || lowerMessage.includes('sem bebida')) {
      return this.getMocktailPrompt();
    }
    
    if (lowerMessage.includes('iniciante') || lowerMessage.includes('começando') || lowerMessage.includes('nunca fiz') ||
        lowerMessage.includes('sou novo') || lowerMessage.includes('primeira vez')) {
      return this.getBeginnerPrompt();
    }
    
    // Detecção melhorada de ingredientes
    if (lowerMessage.includes('tenho ') || lowerMessage.includes('tenho:') || lowerMessage.includes('ingredientes:') ||
        lowerMessage.includes('disponível') || lowerMessage.includes('o que fazer com')) {
      const ingredients = this.extractIngredients(message);
      if (ingredients.length > 0) {
        return this.getIngredientBasedPrompt(ingredients);
      }
    }
    
    if (lowerMessage.includes('festa') || lowerMessage.includes('aniversário') || lowerMessage.includes('casamento') ||
        lowerMessage.includes('evento') || lowerMessage.includes('celebração') || lowerMessage.includes('comemoração')) {
      const occasion = message.match(/(festa|aniversário|casamento|evento|celebração|comemoração)/i)?.[0] || 'evento especial';
      return this.getOccasionPrompt(occasion);
    }
    
    if (lowerMessage.includes('variação') || lowerMessage.includes('versão') || lowerMessage.includes('diferente') ||
        lowerMessage.includes('alternativa') || lowerMessage.includes('outro jeito')) {
      const drinkName = this.extractDrinkName(message);
      if (drinkName) {
        return this.getVariationPrompt(drinkName);
      }
    }
    
    // Detectar nomes de drinks específicos
    const drinkName = this.extractDrinkName(message);
    if (drinkName) {
      return `Me conte mais sobre o que você quer saber sobre ${drinkName}! Quer a receita clássica, alguma variação especial, ou dicas de preparo? 🍹`;
    }
    
    // Prompt padrão do sistema
    return this.getSystemPrompt();
  }
  
  // Extrair ingredientes mencionados na mensagem
  private static extractIngredients(message: string): string[] {
    const commonIngredients = [
      'vodka', 'gin', 'whisky', 'cachaça', 'rum', 'tequila',
      'limão', 'lime', 'laranja', 'maracujá', 'morango',
      'açúcar', 'mel', 'xarope', 'gelo', 'água', 'refrigerante',
      'hortelã', 'manjericão', 'gengibre'
    ];
    
    const found: string[] = [];
    const lowerMessage = message.toLowerCase();
    
    for (const ingredient of commonIngredients) {
      if (lowerMessage.includes(ingredient)) {
        found.push(ingredient);
      }
    }
    
    return found;
  }
  
  // Extrair nome de drink mencionado
  private static extractDrinkName(message: string): string | null {
    const commonDrinks = [
      'caipirinha', 'mojito', 'cosmopolitan', 'margarita', 'piña colada',
      'manhattan', 'martini', 'negroni', 'old fashioned', 'daiquiri'
    ];
    
    const lowerMessage = message.toLowerCase();
    
    for (const drink of commonDrinks) {
      if (lowerMessage.includes(drink)) {
        return drink;
      }
    }
    
    return null;
  }
} 