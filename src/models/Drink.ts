export interface IngredientDetail {
  name: string;
  amount: string;
  unit: 'ml' | 'oz' | 'colher' | 'unidade' | 'fatia' | 'folhas' | 'gotas';
  category: 'alcohol' | 'mixer' | 'fruit' | 'herb' | 'spice' | 'garnish' | 'other';
  isOptional: boolean;
  substitutes?: string[];
  price?: number; // preço estimado em reais
}

export interface NutritionalInfo {
  calories: number;
  alcohol: number; // % ABV
  sugar: number; // gramas
  carbs: number; // gramas
  fat: number; // gramas
  protein: number; // gramas
  sodium: number; // mg
}

export interface DrinkComplexity {
  level: 'muito-fácil' | 'fácil' | 'médio' | 'difícil' | 'expert';
  preparationTime: number; // minutos
  skillsRequired: string[];
  equipmentNeeded: string[];
}

export interface DrinkMetadata {
  origin: string;
  history?: string;
  variations: string[];
  category: 'clássico' | 'tropical' | 'digestivo' | 'aperitivo' | 'shot' | 'mocktail' | 'moderno';
  seasonality: 'verão' | 'inverno' | 'outono' | 'primavera' | 'qualquer';
  occasions: string[];
  glassType: string;
  garnish?: string;
  servingSize: number;
}

export interface DrinkProfile {
  id: string;
  name: string;
  nameVariations: string[];
  description: string;
  
  // Receita
  ingredients: IngredientDetail[];
  instructions: string[];
  tips?: string[];
  
  // Análise
  tags: string[];
  flavorProfile: {
    sweet: number; // 1-10
    sour: number;
    bitter: number;
    spicy: number;
    umami: number;
    strength: number; // força alcoólica 1-10
  };
  
  // Metadados
  metadata: DrinkMetadata;
  complexity: DrinkComplexity;
  nutrition: NutritionalInfo;
  
  // Estatísticas
  popularity: number; // 1-100
  averageRating: number; // 1-5
  totalRatings: number;
  createdAt: Date;
  updatedAt: Date;
  
  // Dados do criador
  createdBy?: string;
  isVerified: boolean;
  isFeatured: boolean;
}

export class DrinkModel {
  private static drinks: Map<string, DrinkProfile> = new Map();
  private static drinksByName: Map<string, string> = new Map(); // nome -> id
  
  // Drinks predefinidos famosos
  static initializeDefaultDrinks(): void {
    const defaultDrinks: Omit<DrinkProfile, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Caipirinha',
        nameVariations: ['Caipirinha Brasileira', 'Caipirinha Clássica'],
        description: 'O drink nacional brasileiro, refrescante e autêntico',
        ingredients: [
          {
            name: 'Cachaça',
            amount: '50',
            unit: 'ml',
            category: 'alcohol',
            isOptional: false,
            price: 3.50
          },
          {
            name: 'Limão',
            amount: '1/2',
            unit: 'unidade',
            category: 'fruit',
            isOptional: false,
            price: 0.50
          },
          {
            name: 'Açúcar cristal',
            amount: '2',
            unit: 'colher',
            category: 'other',
            isOptional: false,
            price: 0.10
          },
          {
            name: 'Gelo',
            amount: 'à gosto',
            unit: 'unidade',
            category: 'other',
            isOptional: false,
            price: 0.05
          }
        ],
        instructions: [
          'Corte o limão em pedaços pequenos',
          'Coloque no copo com açúcar',
          'Amasse bem com pilão',
          'Adicione a cachaça',
          'Complete com gelo e misture'
        ],
        tips: [
          'Use limão galego para mais acidez',
          'Não amasse demais para não amargar',
          'Cachaça artesanal faz diferença'
        ],
        tags: ['brasileiro', 'clássico', 'refrescante', 'fácil', 'cachaça'],
        flavorProfile: {
          sweet: 6,
          sour: 8,
          bitter: 2,
          spicy: 1,
          umami: 1,
          strength: 7
        },
        metadata: {
          origin: 'Brasil',
          history: 'Criada no interior de São Paulo no século XIX',
          variations: ['Caipivodka', 'Caipirosca', 'Caipirissima'],
          category: 'clássico',
          seasonality: 'qualquer',
          occasions: ['festa', 'churrasco', 'praia', 'casual'],
          glassType: 'copo baixo',
          garnish: 'rodela de limão',
          servingSize: 1
        },
        complexity: {
          level: 'fácil',
          preparationTime: 3,
          skillsRequired: ['amassar'],
          equipmentNeeded: ['pilão', 'copo baixo']
        },
        nutrition: {
          calories: 180,
          alcohol: 15.2,
          sugar: 12,
          carbs: 14,
          fat: 0,
          protein: 0.1,
          sodium: 2
        },
        popularity: 95,
        averageRating: 4.8,
        totalRatings: 0,
        isVerified: true,
        isFeatured: true
      },
      {
        name: 'Mojito',
        nameVariations: ['Mojito Cubano', 'Mojito Clássico'],
        description: 'Refrescante cocktail cubano com hortelã',
        ingredients: [
          {
            name: 'Rum branco',
            amount: '50',
            unit: 'ml',
            category: 'alcohol',
            isOptional: false,
            price: 4.00
          },
          {
            name: 'Hortelã',
            amount: '10',
            unit: 'folhas',
            category: 'herb',
            isOptional: false,
            price: 0.30
          },
          {
            name: 'Lime',
            amount: '1/2',
            unit: 'unidade',
            category: 'fruit',
            isOptional: false,
            price: 0.40
          },
          {
            name: 'Açúcar',
            amount: '2',
            unit: 'colher',
            category: 'other',
            isOptional: false,
            price: 0.10
          },
          {
            name: 'Água com gás',
            amount: '100',
            unit: 'ml',
            category: 'mixer',
            isOptional: false,
            price: 0.50
          }
        ],
        instructions: [
          'Amasse suavemente a hortelã com açúcar',
          'Adicione o suco de lime',
          'Coloque rum e gelo',
          'Complete com água com gás',
          'Mexa delicadamente'
        ],
        tags: ['cubano', 'refrescante', 'hortelã', 'rum', 'gaseificado'],
        flavorProfile: {
          sweet: 5,
          sour: 7,
          bitter: 2,
          spicy: 1,
          umami: 1,
          strength: 6
        },
        metadata: {
          origin: 'Cuba',
          history: 'Criado em Havana no século XVI',
          variations: ['Virgin Mojito', 'Mojito de Fruta'],
          category: 'clássico',
          seasonality: 'verão',
          occasions: ['festa', 'praia', 'happy hour'],
          glassType: 'copo alto',
          garnish: 'ramo de hortelã',
          servingSize: 1
        },
        complexity: {
          level: 'fácil',
          preparationTime: 4,
          skillsRequired: ['amassar', 'mexer'],
          equipmentNeeded: ['muddler', 'copo alto']
        },
        nutrition: {
          calories: 150,
          alcohol: 12.5,
          sugar: 8,
          carbs: 10,
          fat: 0,
          protein: 0.2,
          sodium: 5
        },
        popularity: 90,
        averageRating: 4.6,
        totalRatings: 0,
        isVerified: true,
        isFeatured: true
      }
    ];
    
    defaultDrinks.forEach(drink => this.addDrink(drink));
  }
  
  // Adicionar novo drink
  static addDrink(drinkData: Omit<DrinkProfile, 'id' | 'createdAt' | 'updatedAt'>): DrinkProfile {
    const drink: DrinkProfile = {
      ...drinkData,
      id: this.generateDrinkId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.drinks.set(drink.id, drink);
    this.drinksByName.set(drink.name.toLowerCase(), drink.id);
    
    // Adicionar variações de nome
    drink.nameVariations.forEach(variation => {
      this.drinksByName.set(variation.toLowerCase(), drink.id);
    });
    
    return drink;
  }
  
  // Buscar drink por ID
  static getDrink(id: string): DrinkProfile | null {
    return this.drinks.get(id) || null;
  }
  
  // Buscar drink por nome
  static getDrinkByName(name: string): DrinkProfile | null {
    const id = this.drinksByName.get(name.toLowerCase());
    return id ? this.getDrink(id) : null;
  }
  
  // Buscar drinks por tag
  static getDrinksByTag(tag: string): DrinkProfile[] {
    return Array.from(this.drinks.values())
      .filter(drink => drink.tags.includes(tag.toLowerCase()));
  }
  
  // Buscar drinks por ingrediente
  static getDrinksByIngredient(ingredient: string): DrinkProfile[] {
    return Array.from(this.drinks.values())
      .filter(drink => 
        drink.ingredients.some(ing => 
          ing.name.toLowerCase().includes(ingredient.toLowerCase())
        )
      );
  }
  
  // Buscar drinks por complexidade
  static getDrinksByComplexity(level: DrinkComplexity['level']): DrinkProfile[] {
    return Array.from(this.drinks.values())
      .filter(drink => drink.complexity.level === level);
  }
  
  // Buscar drinks sem álcool
  static getMocktails(): DrinkProfile[] {
    return Array.from(this.drinks.values())
      .filter(drink => 
        !drink.ingredients.some(ing => ing.category === 'alcohol') ||
        drink.metadata.category === 'mocktail'
      );
  }
  
  // Obter drinks mais populares
  static getPopularDrinks(limit: number = 10): DrinkProfile[] {
    return Array.from(this.drinks.values())
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }
  
  // Obter drinks em destaque
  static getFeaturedDrinks(): DrinkProfile[] {
    return Array.from(this.drinks.values())
      .filter(drink => drink.isFeatured);
  }
  
  // Pesquisa inteligente
  static searchDrinks(query: string, limit: number = 20): DrinkProfile[] {
    const lowerQuery = query.toLowerCase();
    const drinks = Array.from(this.drinks.values());
    
    // Pontuação de relevância
    const scored = drinks.map(drink => {
      let score = 0;
      
      // Nome exato
      if (drink.name.toLowerCase() === lowerQuery) score += 100;
      // Nome contém
      else if (drink.name.toLowerCase().includes(lowerQuery)) score += 50;
      
      // Variações de nome
      drink.nameVariations.forEach(variation => {
        if (variation.toLowerCase().includes(lowerQuery)) score += 30;
      });
      
      // Ingredientes
      drink.ingredients.forEach(ing => {
        if (ing.name.toLowerCase().includes(lowerQuery)) score += 20;
      });
      
      // Tags
      drink.tags.forEach(tag => {
        if (tag.includes(lowerQuery)) score += 15;
      });
      
      // Descrição
      if (drink.description.toLowerCase().includes(lowerQuery)) score += 10;
      
      return { drink, score };
    });
    
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.drink);
  }
  
  // Atualizar rating
  static updateRating(drinkId: string, rating: number): void {
    const drink = this.getDrink(drinkId);
    if (drink) {
      const totalRatings = drink.totalRatings;
      const currentAverage = drink.averageRating;
      
      drink.totalRatings += 1;
      drink.averageRating = ((currentAverage * totalRatings) + rating) / drink.totalRatings;
      drink.updatedAt = new Date();
      
      this.drinks.set(drinkId, drink);
    }
  }
  
  // Calcular preço estimado total
  static calculateTotalPrice(drinkId: string): number {
    const drink = this.getDrink(drinkId);
    if (!drink) return 0;
    
    return drink.ingredients.reduce((total, ing) => {
      return total + (ing.price || 0);
    }, 0);
  }
  
  // Obter estatísticas globais
  static getDrinkStats() {
    const drinks = Array.from(this.drinks.values());
    return {
      totalDrinks: drinks.length,
      averageRating: drinks.reduce((sum, d) => sum + d.averageRating, 0) / drinks.length || 0,
      totalRatings: drinks.reduce((sum, d) => sum + d.totalRatings, 0),
      mostPopular: drinks.sort((a, b) => b.popularity - a.popularity)[0]?.name || '',
      categoryDistribution: this.getCategoryDistribution(drinks),
      complexityDistribution: this.getComplexityDistribution(drinks)
    };
  }
  
  private static getCategoryDistribution(drinks: DrinkProfile[]) {
    const distribution: Record<string, number> = {};
    drinks.forEach(drink => {
      distribution[drink.metadata.category] = (distribution[drink.metadata.category] || 0) + 1;
    });
    return distribution;
  }
  
  private static getComplexityDistribution(drinks: DrinkProfile[]) {
    const distribution: Record<string, number> = {};
    drinks.forEach(drink => {
      distribution[drink.complexity.level] = (distribution[drink.complexity.level] || 0) + 1;
    });
    return distribution;
  }
  
  // Gerar ID único
  private static generateDrinkId(): string {
    return `drink_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Obter todos os drinks (para admin)
  static getAllDrinks(): DrinkProfile[] {
    return Array.from(this.drinks.values());
  }
} 