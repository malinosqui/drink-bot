import { UserModel, UserProfile } from '../models/User';
import { DrinkModel, DrinkProfile } from '../models/Drink';

export interface AnalyticsEvent {
  id: string;
  type: 'user_action' | 'system_event' | 'engagement' | 'performance';
  category: string;
  action: string;
  userId?: string;
  metadata: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
}

export interface UserEngagementMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  averageSessionDuration: number;
  messagesPerSession: number;
  retentionRate: number;
  newUsersToday: number;
}

export interface DrinkMetrics {
  mostRequestedDrinks: Array<{ drink: DrinkProfile; count: number }>;
  mostRatedDrinks: Array<{ drink: DrinkProfile; avgRating: number; totalRatings: number }>;
  trendingIngredients: Array<{ ingredient: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  categoryPopularity: Record<string, number>;
  complexityPreference: Record<string, number>;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  errorRate: number;
  systemUptime: number;
  llmApiCalls: number;
  whatsappApiCalls: number;
  cacheHitRate: number;
}

export interface BusinessMetrics {
  totalUsers: number;
  premiumUsers: number;
  conversionRate: number;
  customerSatisfaction: number;
  averageRecipesPerUser: number;
  userLifetimeValue: number;
}

export interface RealTimeMetrics {
  activeUsers: number;
  currentSessions: number;
  messagesLastHour: number;
  errorLastHour: number;
  topDrinksToday: string[];
}

export class AnalyticsService {
  private static events: AnalyticsEvent[] = [];
  private static sessions: Map<string, { startTime: Date; lastActivity: Date; messageCount: number }> = new Map();
  private static dailyStats: Map<string, any> = new Map();
  
  // Registrar evento
  static trackEvent(
    type: AnalyticsEvent['type'],
    category: string,
    action: string,
    userId?: string,
    metadata: Record<string, any> = {},
    sessionId?: string
  ): void {
    const event: AnalyticsEvent = {
      id: this.generateEventId(),
      type,
      category,
      action,
      userId,
      metadata,
      timestamp: new Date(),
      sessionId
    };
    
    this.events.push(event);
    
    // Manter apenas eventos dos últimos 30 dias
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.events = this.events.filter(e => e.timestamp > thirtyDaysAgo);
    
    // Atualizar estatísticas em tempo real
    this.updateRealTimeStats(event);
    
    console.log(`📊 Analytics: ${category}.${action}`, { userId, metadata });
  }
  
  // Rastrear ação do usuário
  static trackUserAction(action: string, userId: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('user_action', 'user', action, userId, metadata);
  }
  
  // Rastrear engajamento
  static trackEngagement(action: string, userId: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('engagement', 'engagement', action, userId, metadata);
  }
  
  // Rastrear evento do sistema
  static trackSystemEvent(action: string, metadata: Record<string, any> = {}): void {
    this.trackEvent('system_event', 'system', action, undefined, metadata);
  }
  
  // Iniciar sessão
  static startSession(userId: string, sessionId: string): void {
    this.sessions.set(sessionId, {
      startTime: new Date(),
      lastActivity: new Date(),
      messageCount: 0
    });
    
    this.trackEvent('user_action', 'session', 'start', userId, {}, sessionId);
  }
  
  // Atualizar atividade da sessão
  static updateSessionActivity(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
      session.messageCount++;
    }
  }
  
  // Finalizar sessão
  static endSession(sessionId: string, userId?: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const duration = new Date().getTime() - session.startTime.getTime();
      
      this.trackEvent('user_action', 'session', 'end', userId, {
        duration: duration,
        messageCount: session.messageCount
      }, sessionId);
      
      this.sessions.delete(sessionId);
    }
  }
  
  // Obter métricas de engajamento do usuário
  static getUserEngagementMetrics(): UserEngagementMetrics {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const allUsers = UserModel.getAllUsers();
    
    const dailyActive = allUsers.filter(u => u.lastActiveAt > oneDayAgo).length;
    const weeklyActive = allUsers.filter(u => u.lastActiveAt > oneWeekAgo).length;
    const monthlyActive = allUsers.filter(u => u.lastActiveAt > oneMonthAgo).length;
    
    const newUsersToday = allUsers.filter(u => u.createdAt > oneDayAgo).length;
    
    // Calcular duração média de sessão
    const recentSessions = this.events.filter(e => 
      e.category === 'session' && e.action === 'end' && e.timestamp > oneWeekAgo
    );
    
    const avgSessionDuration = recentSessions.length > 0 
      ? recentSessions.reduce((sum, e) => sum + (e.metadata.duration || 0), 0) / recentSessions.length
      : 0;
    
    const avgMessagesPerSession = recentSessions.length > 0
      ? recentSessions.reduce((sum, e) => sum + (e.metadata.messageCount || 0), 0) / recentSessions.length
      : 0;
    
    // Taxa de retenção (usuários que voltaram nos últimos 7 dias)
    const newUsersLastWeek = allUsers.filter(u => 
      u.createdAt > oneWeekAgo && u.createdAt <= oneDayAgo
    );
    const returnedUsers = newUsersLastWeek.filter(u => u.lastActiveAt > oneDayAgo);
    const retentionRate = newUsersLastWeek.length > 0 
      ? (returnedUsers.length / newUsersLastWeek.length) * 100
      : 0;
    
    return {
      dailyActiveUsers: dailyActive,
      weeklyActiveUsers: weeklyActive,
      monthlyActiveUsers: monthlyActive,
      averageSessionDuration: avgSessionDuration / 1000 / 60, // em minutos
      messagesPerSession: avgMessagesPerSession,
      retentionRate,
      newUsersToday
    };
  }
  
  // Obter métricas de drinks
  static getDrinkMetrics(): DrinkMetrics {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // Drinks mais solicitados
    const drinkRequests = this.events.filter(e => 
      e.category === 'user' && e.action === 'drink_requested' && e.timestamp > oneWeekAgo
    );
    
    const requestCounts: Record<string, number> = {};
    drinkRequests.forEach(e => {
      const drinkId = e.metadata.drinkId;
      if (drinkId) {
        requestCounts[drinkId] = (requestCounts[drinkId] || 0) + 1;
      }
    });
    
    const mostRequested = Object.entries(requestCounts)
      .map(([drinkId, count]) => ({
        drink: DrinkModel.getDrink(drinkId)!,
        count
      }))
      .filter(item => item.drink)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Drinks mais bem avaliados
    const allDrinks = DrinkModel.getAllDrinks();
    const mostRated = allDrinks
      .filter(drink => drink.totalRatings > 0)
      .map(drink => ({
        drink,
        avgRating: drink.averageRating,
        totalRatings: drink.totalRatings
      }))
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10);
    
    // Ingredientes em alta
    const ingredientCounts: Record<string, number> = {};
    drinkRequests.forEach(e => {
      const ingredients = e.metadata.ingredients || [];
      ingredients.forEach((ing: string) => {
        ingredientCounts[ing] = (ingredientCounts[ing] || 0) + 1;
      });
    });
    
    const trendingIngredients = Object.entries(ingredientCounts)
      .map(([ingredient, count]) => ({
        ingredient,
        count,
        trend: 'stable' as const // Simplificado
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);
    
    // Popularidade por categoria
    const categoryPopularity: Record<string, number> = {};
    mostRequested.forEach(item => {
      const category = item.drink.metadata.category;
      categoryPopularity[category] = (categoryPopularity[category] || 0) + item.count;
    });
    
    // Preferência de complexidade
    const complexityPreference: Record<string, number> = {};
    mostRequested.forEach(item => {
      const complexity = item.drink.complexity.level;
      complexityPreference[complexity] = (complexityPreference[complexity] || 0) + item.count;
    });
    
    return {
      mostRequestedDrinks: mostRequested,
      mostRatedDrinks: mostRated,
      trendingIngredients,
      categoryPopularity,
      complexityPreference
    };
  }
  
  // Obter métricas de performance
  static getPerformanceMetrics(): PerformanceMetrics {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentEvents = this.events.filter(e => e.timestamp > oneHourAgo);
    
    // Response time médio (simulado)
    const responseTimeEvents = recentEvents.filter(e => e.metadata.responseTime);
    const avgResponseTime = responseTimeEvents.length > 0
      ? responseTimeEvents.reduce((sum, e) => sum + e.metadata.responseTime, 0) / responseTimeEvents.length
      : 1200; // ms
    
    // Taxa de erro
    const errorEvents = recentEvents.filter(e => e.type === 'system_event' && e.action === 'error');
    const totalEvents = recentEvents.length;
    const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0;
    
    // Uptime (simulado)
    const systemUptime = process.uptime() / 3600; // horas
    
    // Contagem de API calls
    const llmCalls = recentEvents.filter(e => e.category === 'llm' && e.action === 'api_call').length;
    const whatsappCalls = recentEvents.filter(e => e.category === 'whatsapp' && e.action === 'api_call').length;
    
    // Cache hit rate (simulado)
    const cacheEvents = recentEvents.filter(e => e.category === 'cache');
    const cacheHits = cacheEvents.filter(e => e.action === 'hit').length;
    const cacheHitRate = cacheEvents.length > 0 ? (cacheHits / cacheEvents.length) * 100 : 85;
    
    return {
      averageResponseTime: avgResponseTime,
      errorRate,
      systemUptime,
      llmApiCalls: llmCalls,
      whatsappApiCalls: whatsappCalls,
      cacheHitRate
    };
  }
  
  // Obter métricas de negócio
  static getBusinessMetrics(): BusinessMetrics {
    const users = UserModel.getAllUsers();
    const globalStats = UserModel.getGlobalStats();
    
    const premiumUsers = users.filter(u => u.subscription && u.subscription !== 'basic').length;
    const conversionRate = users.length > 0 ? (premiumUsers / users.length) * 100 : 0;
    
    // Customer satisfaction baseado em ratings
    const allRatings = users.flatMap(u => u.ratings);
    const customerSatisfaction = allRatings.length > 0
      ? (allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length) * 20 // converter para %
      : 80;
    
    const avgRecipesPerUser = users.length > 0
      ? users.reduce((sum, u) => sum + u.drinkHistory.length, 0) / users.length
      : 0;
    
    // LTV simplificado (baseado em atividade)
    const userLTV = users.length > 0
      ? users.reduce((sum, u) => sum + u.stats.totalDrinksAsked * 0.5, 0) / users.length
      : 0;
    
    return {
      totalUsers: globalStats.totalUsers,
      premiumUsers,
      conversionRate,
      customerSatisfaction,
      averageRecipesPerUser: avgRecipesPerUser,
      userLifetimeValue: userLTV
    };
  }
  
  // Obter métricas em tempo real
  static getRealTimeMetrics(): RealTimeMetrics {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    const recentEvents = this.events.filter(e => e.timestamp > oneHourAgo);
    
    const activeUsers = new Set(recentEvents.map(e => e.userId).filter(Boolean)).size;
    const currentSessions = this.sessions.size;
    const messagesLastHour = recentEvents.filter(e => e.action === 'message_sent').length;
    const errorsLastHour = recentEvents.filter(e => e.action === 'error').length;
    
    // Top drinks hoje
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEvents = this.events.filter(e => e.timestamp > today);
    const drinkRequests = todayEvents.filter(e => e.action === 'drink_requested');
    
    const drinkCounts: Record<string, number> = {};
    drinkRequests.forEach(e => {
      const drinkName = e.metadata.drinkName;
      if (drinkName) {
        drinkCounts[drinkName] = (drinkCounts[drinkName] || 0) + 1;
      }
    });
    
    const topDrinksToday = Object.entries(drinkCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([name]) => name);
    
    return {
      activeUsers,
      currentSessions,
      messagesLastHour,
      errorLastHour: errorsLastHour,
      topDrinksToday
    };
  }
  
  // Obter insights avançados
  static getAdvancedInsights() {
    const userMetrics = this.getUserEngagementMetrics();
    const drinkMetrics = this.getDrinkMetrics();
    const performance = this.getPerformanceMetrics();
    
    const insights = [];
    
    // Insights de crescimento
    if (userMetrics.newUsersToday > 5) {
      insights.push({
        type: 'growth',
        title: 'Crescimento Acelerado',
        description: `${userMetrics.newUsersToday} novos usuários hoje - acima da média!`,
        impact: 'positive'
      });
    }
    
    // Insights de engagement
    if (userMetrics.retentionRate > 70) {
      insights.push({
        type: 'engagement',
        title: 'Alta Retenção',
        description: `Taxa de retenção de ${userMetrics.retentionRate.toFixed(1)}% - usuários estão voltando!`,
        impact: 'positive'
      });
    }
    
    // Insights de performance
    if (performance.errorRate > 5) {
      insights.push({
        type: 'performance',
        title: 'Taxa de Erro Alta',
        description: `${performance.errorRate.toFixed(1)}% de erro - necessária atenção`,
        impact: 'negative'
      });
    }
    
    // Insights de produto
    if (drinkMetrics.mostRequestedDrinks.length > 0) {
      const topDrink = drinkMetrics.mostRequestedDrinks[0];
      insights.push({
        type: 'product',
        title: 'Drink em Alta',
        description: `${topDrink.drink.name} foi solicitado ${topDrink.count} vezes esta semana`,
        impact: 'neutral'
      });
    }
    
    return insights;
  }
  
  // Exportar dados para análise externa
  static exportAnalyticsData(startDate: Date, endDate: Date) {
    const filteredEvents = this.events.filter(e => 
      e.timestamp >= startDate && e.timestamp <= endDate
    );
    
    return {
      events: filteredEvents,
      userMetrics: this.getUserEngagementMetrics(),
      drinkMetrics: this.getDrinkMetrics(),
      performanceMetrics: this.getPerformanceMetrics(),
      businessMetrics: this.getBusinessMetrics(),
      exportedAt: new Date(),
      period: { startDate, endDate }
    };
  }
  
  // Atualizar estatísticas em tempo real
  private static updateRealTimeStats(event: AnalyticsEvent): void {
    const today = new Date().toISOString().split('T')[0];
    
    if (!this.dailyStats.has(today)) {
      this.dailyStats.set(today, {
        events: 0,
        users: new Set(),
        drinks: new Set(),
        errors: 0
      });
    }
    
    const stats = this.dailyStats.get(today)!;
    stats.events++;
    
    if (event.userId) {
      stats.users.add(event.userId);
    }
    
    if (event.action === 'drink_requested' && event.metadata.drinkName) {
      stats.drinks.add(event.metadata.drinkName);
    }
    
    if (event.action === 'error') {
      stats.errors++;
    }
  }
  
  // Gerar ID único para evento
  private static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Limpar dados antigos
  static cleanupOldData(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.events = this.events.filter(e => e.timestamp > thirtyDaysAgo);
    
    // Limpar sessões inativas
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.lastActivity < oneHourAgo) {
        this.sessions.delete(sessionId);
      }
    }
    
    console.log('🧹 Analytics: Dados antigos removidos');
  }
  
  // Obter relatório completo
  static getCompleteReport() {
    return {
      timestamp: new Date(),
      userEngagement: this.getUserEngagementMetrics(),
      drinkMetrics: this.getDrinkMetrics(),
      performance: this.getPerformanceMetrics(),
      business: this.getBusinessMetrics(),
      realTime: this.getRealTimeMetrics(),
      insights: this.getAdvancedInsights(),
      systemInfo: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        version: process.version
      }
    };
  }
} 