import { UserProfile, UserModel } from '../models/User';
import { DrinkProfile, DrinkModel } from '../models/Drink';

export interface RecommendationCriteria {
  userId: string;
  context?: 'time_of_day' | 'occasion' | 'mood' | 'ingredients' | 'similar_users';
  availableIngredients?: string[];
  excludeIngredients?: string[];
  maxComplexity?: 'muito-fácil' | 'fácil' | 'médio' | 'difícil' | 'expert';
  alcoholPreference?: 'none' | 'low' | 'medium' | 'high';
  occasion?: string;
  limit?: number;
}

export interface RecommendationResult {
  drink: DrinkProfile;
  score: number;
  reasons: string[];
  confidence: number; // 0-1
}

export interface RecommendationInsight {
  type: 'trending' | 'seasonal' | 'personal' | 'discovery' | 'popular';
  title: string;
  description: string;
  drinks: DrinkProfile[];
}

export class RecommendationEngine {
  
  // Obter recomendações personalizadas
  static getPersonalizedRecommendations(criteria: RecommendationCriteria): RecommendationResult[] {
    const user = UserModel.getUser(criteria.userId);
    if (!user) return [];
    
    const allDrinks = DrinkModel.getAllDrinks();
    const scored = allDrinks.map(drink => this.scoreDrinkForUser(drink, user, criteria));
    
    return scored
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, criteria.limit || 10);
  }
  
  // Pontuar drink para usuário específico
  private static scoreDrinkForUser(
    drink: DrinkProfile, 
    user: UserProfile, 
    criteria: RecommendationCriteria
  ): RecommendationResult {
    let score = 0;
    const reasons: string[] = [];
    
    // 1. Análise do histórico do usuário
    const historyScore = this.analyzeUserHistory(drink, user, reasons);
    score += historyScore * 0.3;
    
    // 2. Preferências de sabor
    const flavorScore = this.analyzeFlavorPreferences(drink, user, reasons);
    score += flavorScore * 0.25;
    
    // 3. Nível de experiência
    const experienceScore = this.analyzeExperience(drink, user, reasons);
    score += experienceScore * 0.15;
    
    // 4. Contexto temporal
    const timeScore = this.analyzeTimeContext(drink, reasons);
    score += timeScore * 0.1;
    
    // 5. Ingredientes disponíveis
    const ingredientScore = this.analyzeIngredients(drink, criteria, reasons);
    score += ingredientScore * 0.15;
    
    // 6. Popularidade geral
    const popularityScore = drink.popularity / 100;
    score += popularityScore * 0.05;
    
    // Penalidades
    score = this.applyPenalties(score, drink, user, criteria, reasons);
    
    // Calcular confiança
    const confidence = this.calculateConfidence(user, drink, score);
    
    return {
      drink,
      score: Math.max(0, score),
      reasons,
      confidence
    };
  }
  
  // Analisar histórico do usuário
  private static analyzeUserHistory(drink: DrinkProfile, user: UserProfile, reasons: string[]): number {
    let score = 0;
    
    // Verificar se já bebeu este drink
    const hasTriedBefore = user.drinkHistory.some(h => h.drinkId === drink.id);
    if (hasTriedBefore) {
      const lastRating = user.ratings.find(r => r.drinkId === drink.id);
      if (lastRating && lastRating.rating >= 4) {
        score += 30;
        reasons.push('Você já avaliou este drink positivamente');
      } else {
        score -= 20; // Evitar repetição de drinks mal avaliados
      }
    }
    
    // Analisar ingredientes favoritos
    const favoriteIngredients = user.favoriteIngredients;
    const drinkIngredients = drink.ingredients.map(i => i.name.toLowerCase());
    const matchingFavorites = favoriteIngredients.filter(fav => 
      drinkIngredients.some(ing => ing.includes(fav.toLowerCase()))
    );
    
    if (matchingFavorites.length > 0) {
      score += matchingFavorites.length * 15;
      reasons.push(`Contém seus ingredientes favoritos: ${matchingFavorites.join(', ')}`);
    }
    
    // Evitar ingredientes que não gosta
    const dislikedIngredients = user.dislikedIngredients;
    const hasDislikedIngredient = dislikedIngredients.some(disliked =>
      drinkIngredients.some(ing => ing.includes(disliked.toLowerCase()))
    );
    
    if (hasDislikedIngredient) {
      score -= 40;
      reasons.push('Contém ingredientes que você não gosta');
    }
    
    return score;
  }
  
  // Analisar preferências de sabor
  private static analyzeFlavorPreferences(drink: DrinkProfile, user: UserProfile, reasons: string[]): number {
    let score = 0;
    
    // Baseado no histórico de ratings
    const userRatings = user.ratings;
    if (userRatings.length === 0) return 20; // Score neutro para novos usuários
    
    // Analisar drinks bem avaliados pelo usuário
    const goodRatings = userRatings.filter(r => r.rating >= 4);
    const averageFlavorProfile = this.calculateAverageFlavorProfile(goodRatings);
    
    if (averageFlavorProfile) {
      const similarity = this.calculateFlavorSimilarity(drink.flavorProfile, averageFlavorProfile);
      score += similarity * 50;
      
      if (similarity > 0.7) {
        reasons.push('Perfil de sabor similar aos seus drinks favoritos');
      }
    }
    
    // Considerar tolerância ao álcool
    const alcoholMatch = this.matchAlcoholTolerance(drink, user.alcoholTolerance);
    score += alcoholMatch * 20;
    
    return score;
  }
  
  // Analisar nível de experiência
  private static analyzeExperience(drink: DrinkProfile, user: UserProfile, reasons: string[]): number {
    let score = 0;
    const userLevel = user.stats.experienceLevel;
    const drinkComplexity = drink.complexity.level;
    
    const experienceMap = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    };
    
    const complexityMap = {
      'muito-fácil': 1,
      'fácil': 2,
      'médio': 3,
      'difícil': 4,
      'expert': 5
    };
    
    const userExp = experienceMap[userLevel];
    const drinkComp = complexityMap[drinkComplexity];
    
    if (drinkComp <= userExp + 1) {
      score += 30;
      if (drinkComp === userExp) {
        reasons.push('Complexidade perfeita para seu nível');
      }
    } else {
      score -= 15;
      reasons.push('Pode ser muito complexo para seu nível atual');
    }
    
    return score;
  }
  
  // Analisar contexto temporal
  private static analyzeTimeContext(drink: DrinkProfile, reasons: string[]): number {
    let score = 0;
    const hour = new Date().getHours();
    const season = this.getCurrentSeason();
    
    // Análise por horário
    if (hour >= 6 && hour < 12) {
      // Manhã - preferir drinks mais leves
      if (drink.flavorProfile.strength <= 3) {
        score += 20;
        reasons.push('Perfeito para a manhã');
      }
    } else if (hour >= 12 && hour < 18) {
      // Tarde - drinks refrescantes
      if (drink.tags.includes('refrescante')) {
        score += 15;
        reasons.push('Refrescante para a tarde');
      }
    } else if (hour >= 18 && hour < 22) {
      // Noite - drinks mais elaborados
      if (drink.complexity.level !== 'muito-fácil') {
        score += 10;
        reasons.push('Horário perfeito para drinks elaborados');
      }
    }
    
    // Análise sazonal
    if (drink.metadata.seasonality === season || drink.metadata.seasonality === 'qualquer') {
      score += 15;
      if (drink.metadata.seasonality === season) {
        reasons.push(`Perfeito para o ${season}`);
      }
    }
    
    return score;
  }
  
  // Analisar ingredientes disponíveis
  private static analyzeIngredients(drink: DrinkProfile, criteria: RecommendationCriteria, reasons: string[]): number {
    let score = 0;
    
    if (criteria.availableIngredients && criteria.availableIngredients.length > 0) {
      const drinkIngredients = drink.ingredients.map(i => i.name.toLowerCase());
      const available = criteria.availableIngredients.map(a => a.toLowerCase());
      
      const requiredIngredients = drink.ingredients.filter(i => !i.isOptional);
      const availableRequired = requiredIngredients.filter(req => 
        available.some(av => req.name.toLowerCase().includes(av))
      );
      
      const completeness = availableRequired.length / requiredIngredients.length;
      score += completeness * 40;
      
      if (completeness === 1) {
        reasons.push('Você tem todos os ingredientes necessários');
      } else if (completeness > 0.7) {
        reasons.push('Você tem a maioria dos ingredientes');
      }
    }
    
    if (criteria.excludeIngredients && criteria.excludeIngredients.length > 0) {
      const hasExcluded = drink.ingredients.some(ing =>
        criteria.excludeIngredients!.some(exc => 
          ing.name.toLowerCase().includes(exc.toLowerCase())
        )
      );
      
      if (hasExcluded) {
        score -= 50;
        reasons.push('Contém ingredientes que você quer evitar');
      }
    }
    
    return score;
  }
  
  // Aplicar penalidades
  private static applyPenalties(
    score: number, 
    drink: DrinkProfile, 
    user: UserProfile, 
    criteria: RecommendationCriteria,
    reasons: string[]
  ): number {
    // Penalidade por complexidade excessiva
    if (criteria.maxComplexity) {
      const complexityMap = {
        'muito-fácil': 1,
        'fácil': 2,
        'médio': 3,
        'difícil': 4,
        'expert': 5
      };
      
      if (complexityMap[drink.complexity.level] > complexityMap[criteria.maxComplexity]) {
        score *= 0.3;
        reasons.push('Complexidade acima do desejado');
      }
    }
    
    // Penalidade por preferência de álcool
    if (criteria.alcoholPreference === 'none' && drink.nutrition.alcohol > 0) {
      score *= 0.1;
      reasons.push('Contém álcool');
    }
    
    return score;
  }
  
  // Calcular confiança na recomendação
  private static calculateConfidence(user: UserProfile, drink: DrinkProfile, score: number): number {
    let confidence = 0.5; // Base
    
    // Mais confiança com mais dados do usuário
    if (user.drinkHistory.length > 10) confidence += 0.2;
    if (user.ratings.length > 5) confidence += 0.15;
    if (user.favoriteIngredients.length > 3) confidence += 0.1;
    
    // Confiança baseada no score
    confidence += (score / 100) * 0.05;
    
    return Math.min(1, confidence);
  }
  
  // Calcular perfil de sabor médio
  private static calculateAverageFlavorProfile(ratings: any[]): any {
    if (ratings.length === 0) return null;
    
    // Aqui precisaria buscar os drinks dos ratings
    // Por simplicidade, retornando um perfil padrão
    return {
      sweet: 5,
      sour: 5,
      bitter: 3,
      spicy: 2,
      umami: 1,
      strength: 5
    };
  }
  
  // Calcular similaridade entre perfis de sabor
  private static calculateFlavorSimilarity(profile1: any, profile2: any): number {
    const keys = ['sweet', 'sour', 'bitter', 'spicy', 'umami', 'strength'];
    let totalDiff = 0;
    
    keys.forEach(key => {
      totalDiff += Math.abs(profile1[key] - profile2[key]);
    });
    
    // Normalizar para 0-1 (max diff seria 60)
    return Math.max(0, 1 - (totalDiff / 60));
  }
  
  // Verificar compatibilidade com tolerância ao álcool
  private static matchAlcoholTolerance(drink: DrinkProfile, tolerance: string): number {
    const alcoholLevel = drink.nutrition.alcohol;
    
    switch (tolerance) {
      case 'none': return alcoholLevel === 0 ? 1 : 0;
      case 'low': return alcoholLevel <= 8 ? 1 : 0.3;
      case 'medium': return alcoholLevel <= 15 ? 1 : 0.5;
      case 'high': return 1;
      default: return 0.7;
    }
  }
  
  // Obter estação atual
  private static getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'verão';
    if (month >= 3 && month <= 5) return 'outono';
    if (month >= 6 && month <= 8) return 'inverno';
    return 'primavera';
  }
  
  // Obter insights de recomendação
  static getRecommendationInsights(userId: string): RecommendationInsight[] {
    const user = UserModel.getUser(userId);
    if (!user) return [];
    
    const insights: RecommendationInsight[] = [];
    
    // Drinks trending baseado em atividade recente
    const trendingDrinks = this.getTrendingDrinks();
    if (trendingDrinks.length > 0) {
      insights.push({
        type: 'trending',
        title: 'Em Alta Agora',
        description: 'Drinks que estão fazendo sucesso entre os usuários',
        drinks: trendingDrinks.slice(0, 3)
      });
    }
    
    // Recommendations baseadas em usuários similares
    const similarUserDrinks = this.getSimilarUserRecommendations(userId);
    if (similarUserDrinks.length > 0) {
      insights.push({
        type: 'discovery',
        title: 'Descoberta Personalizada',
        description: 'Baseado em pessoas com gosto similar ao seu',
        drinks: similarUserDrinks.slice(0, 3)
      });
    }
    
    // Drinks sazonais
    const seasonalDrinks = this.getSeasonalDrinks();
    if (seasonalDrinks.length > 0) {
      insights.push({
        type: 'seasonal',
        title: 'Perfeitos para a Estação',
        description: 'Drinks ideais para esta época do ano',
        drinks: seasonalDrinks.slice(0, 3)
      });
    }
    
    return insights;
  }
  
  // Obter drinks em alta
  private static getTrendingDrinks(): DrinkProfile[] {
    // Simulação - na implementação real usaria dados de atividade
    return DrinkModel.getPopularDrinks(10)
      .filter(drink => drink.averageRating >= 4.0);
  }
  
  // Recomendações baseadas em usuários similares
  private static getSimilarUserRecommendations(userId: string): DrinkProfile[] {
    // Implementação simplificada
    // Na versão real, usaria collaborative filtering
    return DrinkModel.getPopularDrinks(5);
  }
  
  // Obter drinks sazonais
  private static getSeasonalDrinks(): DrinkProfile[] {
    const season = this.getCurrentSeason();
    return DrinkModel.getAllDrinks()
      .filter(drink => drink.metadata.seasonality === season)
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5);
  }
  
  // Explicar recomendação (para debugging/transparência)
  static explainRecommendation(drinkId: string, userId: string): string {
    const user = UserModel.getUser(userId);
    const drink = DrinkModel.getDrink(drinkId);
    
    if (!user || !drink) return 'Recomendação não encontrada';
    
    const criteria: RecommendationCriteria = { userId };
    const result = this.scoreDrinkForUser(drink, user, criteria);
    
    return `Pontuação: ${result.score.toFixed(1)}/100
Confiança: ${(result.confidence * 100).toFixed(1)}%

Motivos:
${result.reasons.map(reason => `• ${reason}`).join('\n')}`;
  }
} 