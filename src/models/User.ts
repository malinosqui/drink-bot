export interface DrinkPreference {
  id: string;
  type: 'alcohol_level' | 'flavor_profile' | 'occasion' | 'ingredient' | 'technique';
  value: string;
  weight: number; // 1-10, peso da preferência
  createdAt: Date;
}

export interface DrinkRating {
  drinkId: string;
  drinkName: string;
  rating: number; // 1-5 estrelas
  review?: string;
  tags: string[];
  createdAt: Date;
}

export interface DrinkHistory {
  drinkId: string;
  drinkName: string;
  ingredients: string[];
  askedAt: Date;
  source: 'chat' | 'recommendation' | 'daily' | 'search';
  rating?: number;
}

export interface UserStats {
  totalDrinksAsked: number;
  favoriteAlcoholType: string;
  mostUsedIngredients: string[];
  averageRating: number;
  weeklyActivity: number[];
  preferredTime: 'morning' | 'afternoon' | 'evening' | 'night';
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface UserProfile {
  id: string;
  phoneNumber: string;
  name: string;
  nickname?: string;
  avatar?: string;
  
  // Preferências básicas
  preferences: DrinkPreference[];
  favoriteIngredients: string[];
  dislikedIngredients: string[];
  alcoholTolerance: 'none' | 'low' | 'medium' | 'high';
  preferredComplexity: 'simple' | 'medium' | 'complex';
  
  // Histórico e atividade
  drinkHistory: DrinkHistory[];
  favoriteRecipes: string[];
  ratings: DrinkRating[];
  
  // Configurações
  language: 'pt-BR' | 'en' | 'es';
  timezone: string;
  notificationsEnabled: boolean;
  dailyDrinkReminder: boolean;
  
  // Estatísticas
  stats: UserStats;
  
  // Metadados
  createdAt: Date;
  lastActiveAt: Date;
  isVip: boolean;
  subscription?: 'basic' | 'premium' | 'pro';
}

export class UserModel {
  private static users: Map<string, UserProfile> = new Map();
  
  // Criar novo usuário
  static createUser(phoneNumber: string, name: string): UserProfile {
    const user: UserProfile = {
      id: this.generateUserId(),
      phoneNumber,
      name,
      preferences: [],
      favoriteIngredients: [],
      dislikedIngredients: [],
      alcoholTolerance: 'medium',
      preferredComplexity: 'medium',
      drinkHistory: [],
      favoriteRecipes: [],
      ratings: [],
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notificationsEnabled: true,
      dailyDrinkReminder: false,
      stats: {
        totalDrinksAsked: 0,
        favoriteAlcoholType: '',
        mostUsedIngredients: [],
        averageRating: 0,
        weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
        preferredTime: 'evening',
        experienceLevel: 'beginner'
      },
      createdAt: new Date(),
      lastActiveAt: new Date(),
      isVip: false
    };
    
    this.users.set(phoneNumber, user);
    return user;
  }
  
  // Buscar usuário
  static getUser(phoneNumber: string): UserProfile | null {
    return this.users.get(phoneNumber) || null;
  }
  
  // Buscar ou criar usuário
  static getOrCreateUser(phoneNumber: string, name: string): UserProfile {
    let user = this.getUser(phoneNumber);
    if (!user) {
      user = this.createUser(phoneNumber, name);
    }
    user.lastActiveAt = new Date();
    return user;
  }
  
  // Atualizar preferências do usuário
  static updatePreferences(phoneNumber: string, preferences: Partial<UserProfile>): void {
    const user = this.getUser(phoneNumber);
    if (user) {
      Object.assign(user, preferences);
      this.users.set(phoneNumber, user);
    }
  }
  
  // Adicionar drink ao histórico
  static addToHistory(phoneNumber: string, drink: Omit<DrinkHistory, 'askedAt'>): void {
    const user = this.getUser(phoneNumber);
    if (user) {
      user.drinkHistory.unshift({
        ...drink,
        askedAt: new Date()
      });
      
      // Manter apenas os últimos 100 drinks
      if (user.drinkHistory.length > 100) {
        user.drinkHistory = user.drinkHistory.slice(0, 100);
      }
      
      // Atualizar estatísticas
      this.updateStats(user);
      this.users.set(phoneNumber, user);
    }
  }
  
  // Adicionar rating
  static addRating(phoneNumber: string, rating: Omit<DrinkRating, 'createdAt'>): void {
    const user = this.getUser(phoneNumber);
    if (user) {
      user.ratings.unshift({
        ...rating,
        createdAt: new Date()
      });
      
      // Atualizar estatísticas
      this.updateStats(user);
      this.users.set(phoneNumber, user);
    }
  }
  
  // Adicionar aos favoritos
  static addToFavorites(phoneNumber: string, drinkId: string): void {
    const user = this.getUser(phoneNumber);
    if (user && !user.favoriteRecipes.includes(drinkId)) {
      user.favoriteRecipes.push(drinkId);
      this.users.set(phoneNumber, user);
    }
  }
  
  // Atualizar estatísticas do usuário
  private static updateStats(user: UserProfile): void {
    user.stats.totalDrinksAsked = user.drinkHistory.length;
    
    // Calcular rating médio
    if (user.ratings.length > 0) {
      user.stats.averageRating = user.ratings.reduce((sum, r) => sum + r.rating, 0) / user.ratings.length;
    }
    
    // Encontrar ingredientes mais usados
    const ingredientCount: Record<string, number> = {};
    user.drinkHistory.forEach(drink => {
      drink.ingredients.forEach(ingredient => {
        ingredientCount[ingredient] = (ingredientCount[ingredient] || 0) + 1;
      });
    });
    
    user.stats.mostUsedIngredients = Object.entries(ingredientCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([ingredient]) => ingredient);
    
    // Atualizar nível de experiência
    if (user.stats.totalDrinksAsked < 5) {
      user.stats.experienceLevel = 'beginner';
    } else if (user.stats.totalDrinksAsked < 20) {
      user.stats.experienceLevel = 'intermediate';
    } else if (user.stats.totalDrinksAsked < 50) {
      user.stats.experienceLevel = 'advanced';
    } else {
      user.stats.experienceLevel = 'expert';
    }
    
    // Atualizar atividade semanal
    const today = new Date().getDay();
    user.stats.weeklyActivity[today] += 1;
  }
  
  // Gerar ID único
  private static generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Obter todos os usuários (para admin)
  static getAllUsers(): UserProfile[] {
    return Array.from(this.users.values());
  }
  
  // Estatísticas globais
  static getGlobalStats() {
    const users = this.getAllUsers();
    return {
      totalUsers: users.length,
      activeUsers: users.filter(u => {
        const daysSinceLastActive = (Date.now() - u.lastActiveAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastActive <= 7;
      }).length,
      totalDrinksAsked: users.reduce((sum, u) => sum + u.stats.totalDrinksAsked, 0),
      averageRating: users.reduce((sum, u) => sum + u.stats.averageRating, 0) / users.length || 0,
      vipUsers: users.filter(u => u.isVip).length
    };
  }
} 