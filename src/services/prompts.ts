import { DrinkRecipe } from '../types';

export class PromptsService {
  
  // Prompt principal do sistema para o bot de drinks
  static getSystemPrompt(): string {
    return `Você é um bartender expert e assistente especializado em drinks e coquetéis. Sua missão é ajudar pessoas a descobrir, aprender e criar deliciosos drinks.

PERSONALIDADE:
- Amigável, entusiasmado e conhecedor
- Use linguagem casual mas informativa
- Seja criativo nas sugestões
- Incentive a experimentação

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
    
    // Palavras-chave para diferentes intenções
    if (lowerMessage.includes('sem álcool') || lowerMessage.includes('mocktail') || lowerMessage.includes('não bebo')) {
      return this.getMocktailPrompt();
    }
    
    if (lowerMessage.includes('iniciante') || lowerMessage.includes('começando') || lowerMessage.includes('nunca fiz')) {
      return this.getBeginnerPrompt();
    }
    
    if (lowerMessage.includes('tenho ') && (lowerMessage.includes('vodka') || lowerMessage.includes('gin') || lowerMessage.includes('limão'))) {
      // Tentar extrair ingredientes mencionados
      const ingredients = this.extractIngredients(message);
      if (ingredients.length > 0) {
        return this.getIngredientBasedPrompt(ingredients);
      }
    }
    
    if (lowerMessage.includes('festa') || lowerMessage.includes('aniversário') || lowerMessage.includes('casamento')) {
      const occasion = message.match(/(festa|aniversário|casamento|evento|celebração)/i)?.[0] || 'evento especial';
      return this.getOccasionPrompt(occasion);
    }
    
    if (lowerMessage.includes('variação') || lowerMessage.includes('versão') || lowerMessage.includes('diferente')) {
      const drinkName = this.extractDrinkName(message);
      if (drinkName) {
        return this.getVariationPrompt(drinkName);
      }
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