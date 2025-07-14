import { Request, Response } from 'express';
import { AnalyticsService } from '../../services/analytics';
import { UserModel } from '../../models/User';
import { DrinkModel } from '../../models/Drink';
import { IntelligentCache } from '../../services/cache';

export class AnalyticsController {
  
  // GET /api/analytics/dashboard - Dashboard completo
  static async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Tentar obter do cache primeiro
      const cacheKey = 'analytics:dashboard';
      const cachedDashboard = IntelligentCache.get(cacheKey);
      
      if (cachedDashboard) {
        res.json({
          dashboard: cachedDashboard,
          fromCache: true,
          timestamp: new Date()
        });
        return;
      }
      
      // Gerar dashboard completo
      const dashboard = {
        overview: {
          userEngagement: AnalyticsService.getUserEngagementMetrics(),
          drinkMetrics: AnalyticsService.getDrinkMetrics(),
          performance: AnalyticsService.getPerformanceMetrics(),
          business: AnalyticsService.getBusinessMetrics(),
          realTime: AnalyticsService.getRealTimeMetrics()
        },
        insights: AnalyticsService.getAdvancedInsights(),
        systemInfo: {
          uptime: process.uptime() / 3600, // horas
          memoryUsage: process.memoryUsage(),
          nodeVersion: process.version,
          cacheInfo: IntelligentCache.getInfo()
        },
        generatedAt: new Date()
      };
      
      // Cache por 5 minutos
      IntelligentCache.set(cacheKey, dashboard, 300, ['analytics']);
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_dashboard');
      
      res.json({
        dashboard,
        fromCache: false,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter dashboard:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/dashboard', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/users - Métricas de usuários
  static async getUserMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;
      
      const metrics = AnalyticsService.getUserEngagementMetrics();
      const globalStats = UserModel.getGlobalStats();
      
      // Adicionar dados históricos baseados no período
      const additionalData = {
        globalStats,
        period,
        trends: {
          userGrowth: this.calculateUserGrowthTrend(period as string),
          engagementTrend: this.calculateEngagementTrend(period as string),
          retentionTrend: this.calculateRetentionTrend(period as string)
        }
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_user_metrics', undefined, { period });
      
      res.json({
        metrics: { ...metrics, ...additionalData },
        period,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas de usuários:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/users', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/drinks - Métricas de drinks
  static async getDrinkMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '7d' } = req.query;
      
      const metrics = AnalyticsService.getDrinkMetrics();
      const drinkStats = DrinkModel.getDrinkStats();
      
      const enrichedMetrics = {
        ...metrics,
        drinkStats,
        period,
        trends: {
          popularityTrends: this.calculateDrinkPopularityTrends(period as string),
          categoryTrends: this.calculateCategoryTrends(period as string),
          ingredientTrends: this.calculateIngredientTrends(period as string)
        }
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_drink_metrics', undefined, { period });
      
      res.json({
        metrics: enrichedMetrics,
        period,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas de drinks:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/drinks', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/performance - Métricas de performance
  static async getPerformanceMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '1h' } = req.query;
      
      const metrics = AnalyticsService.getPerformanceMetrics();
      const cacheInfo = IntelligentCache.getInfo();
      
      const performanceData = {
        ...metrics,
        cache: cacheInfo,
        period,
        serverHealth: {
          cpuUsage: process.cpuUsage(),
          memoryUsage: process.memoryUsage(),
          uptime: process.uptime(),
          platform: process.platform,
          nodeVersion: process.version
        },
        recommendations: this.generatePerformanceRecommendations(metrics)
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_performance_metrics', undefined, { period });
      
      res.json({
        metrics: performanceData,
        period,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas de performance:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/performance', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/realtime - Métricas em tempo real
  static async getRealTimeMetrics(req: Request, res: Response): Promise<void> {
    try {
      const realTimeData = AnalyticsService.getRealTimeMetrics();
      
      // Adicionar dados em tempo real extras
      const enrichedData = {
        ...realTimeData,
        timestamp: new Date(),
        serverStatus: 'healthy',
        activeSessions: this.getCurrentActiveSessions(),
        systemLoad: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          cpu: process.cpuUsage()
        }
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_realtime_metrics');
      
      res.json({
        realTime: enrichedData,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas em tempo real:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/realtime', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/business - Métricas de negócio
  static async getBusinessMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { period = '30d' } = req.query;
      
      const metrics = AnalyticsService.getBusinessMetrics();
      
      const businessData = {
        ...metrics,
        period,
        revenue: {
          estimated: this.calculateEstimatedRevenue(period as string),
          perUser: this.calculateRevenuePerUser(),
          growth: this.calculateRevenueGrowth(period as string)
        },
        forecasts: {
          userGrowth: this.forecastUserGrowth(),
          engagement: this.forecastEngagement(),
          churn: this.forecastChurn()
        },
        kpis: {
          arpu: this.calculateARPU(), // Average Revenue Per User
          ltv: metrics.userLifetimeValue,
          cac: this.calculateCAC(), // Customer Acquisition Cost
          churnRate: this.calculateChurnRate()
        }
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_business_metrics', undefined, { period });
      
      res.json({
        metrics: businessData,
        period,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter métricas de negócio:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/business', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/insights - Insights avançados
  static async getAdvancedInsights(req: Request, res: Response): Promise<void> {
    try {
      const insights = AnalyticsService.getAdvancedInsights();
      
      const enhancedInsights = {
        automated: insights,
        predictions: {
          userBehavior: this.predictUserBehavior(),
          drinkTrends: this.predictDrinkTrends(),
          seasonalPatterns: this.analyzeSeasonalPatterns()
        },
        recommendations: {
          product: this.generateProductRecommendations(),
          marketing: this.generateMarketingRecommendations(),
          technical: this.generateTechnicalRecommendations()
        },
        alerts: this.generateAlerts()
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_insights');
      
      res.json({
        insights: enhancedInsights,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter insights:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/insights', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // POST /api/analytics/export - Exportar dados
  static async exportAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const { startDate, endDate, format = 'json' } = req.body;
      
      if (!startDate || !endDate) {
        res.status(400).json({ error: 'startDate e endDate são obrigatórios' });
        return;
      }
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      const exportData = AnalyticsService.exportAnalyticsData(start, end);
      
      AnalyticsService.trackEvent('user_action', 'api', 'export_analytics', undefined, {
        startDate: start,
        endDate: end,
        format
      });
      
      if (format === 'csv') {
        // Converter para CSV (implementação simplificada)
        const csvData = this.convertToCSV(exportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=analytics-export.csv');
        res.send(csvData);
      } else {
        res.json({
          export: exportData,
          format,
          timestamp: new Date()
        });
      }
      
    } catch (error) {
      console.error('❌ Erro ao exportar analytics:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'POST /api/analytics/export', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/analytics/cache - Estatísticas do cache
  static async getCacheAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const cacheInfo = IntelligentCache.getInfo();
      const cacheStats = IntelligentCache.getStats();
      
      const cacheAnalytics = {
        ...cacheInfo,
        stats: cacheStats,
        health: this.analyzeCacheHealth(cacheStats),
        recommendations: this.generateCacheRecommendations(cacheStats)
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_cache_analytics');
      
      res.json({
        cache: cacheAnalytics,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter analytics do cache:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/analytics/cache', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // POST /api/analytics/optimize - Otimizar sistema
  static async optimizeSystem(req: Request, res: Response): Promise<void> {
    try {
      const { component } = req.body;
      
      const optimizations = [];
      
      if (!component || component === 'cache') {
        IntelligentCache.optimize();
        optimizations.push('Cache otimizado');
      }
      
      if (!component || component === 'analytics') {
        AnalyticsService.cleanupOldData();
        optimizations.push('Dados antigos do analytics removidos');
      }
      
      AnalyticsService.trackEvent('system_event', 'system', 'optimize', undefined, {
        component,
        optimizations
      });
      
      res.json({
        message: 'Sistema otimizado com sucesso',
        optimizations,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('❌ Erro ao otimizar sistema:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'POST /api/analytics/optimize', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // Métodos auxiliares
  private static calculateUserGrowthTrend(period: string): any {
    // Implementação simplificada
    return {
      percentage: 15.5,
      direction: 'up',
      period
    };
  }
  
  private static calculateEngagementTrend(period: string): any {
    return {
      percentage: 8.2,
      direction: 'up',
      period
    };
  }
  
  private static calculateRetentionTrend(period: string): any {
    return {
      percentage: 12.1,
      direction: 'up',
      period
    };
  }
  
  private static calculateDrinkPopularityTrends(period: string): any {
    return {
      trending: ['Caipirinha', 'Mojito', 'Negroni'],
      declining: ['Cosmopolitan'],
      period
    };
  }
  
  private static calculateCategoryTrends(period: string): any {
    return {
      rising: ['clássico', 'tropical'],
      stable: ['mocktail'],
      period
    };
  }
  
  private static calculateIngredientTrends(period: string): any {
    return {
      trending: ['cachaça', 'hortelã', 'gin'],
      seasonal: ['limão', 'gelo'],
      period
    };
  }
  
  private static generatePerformanceRecommendations(metrics: any): string[] {
    const recommendations = [];
    
    if (metrics.averageResponseTime > 2000) {
      recommendations.push('Considerar otimizar tempo de resposta da API');
    }
    
    if (metrics.errorRate > 5) {
      recommendations.push('Investigar e corrigir taxa de erro elevada');
    }
    
    if (metrics.cacheHitRate < 80) {
      recommendations.push('Melhorar estratégia de cache');
    }
    
    return recommendations;
  }
  
  private static getCurrentActiveSessions(): number {
    // Implementação simplificada
    return Math.floor(Math.random() * 50) + 10;
  }
  
  private static calculateEstimatedRevenue(period: string): number {
    // Implementação simplificada
    return Math.random() * 10000;
  }
  
  private static calculateRevenuePerUser(): number {
    return Math.random() * 50;
  }
  
  private static calculateRevenueGrowth(period: string): number {
    return Math.random() * 20;
  }
  
  private static forecastUserGrowth(): any {
    return {
      nextMonth: 15.5,
      nextQuarter: 45.2,
      confidence: 85
    };
  }
  
  private static forecastEngagement(): any {
    return {
      nextWeek: 8.1,
      nextMonth: 12.5,
      confidence: 78
    };
  }
  
  private static forecastChurn(): any {
    return {
      nextMonth: 3.2,
      nextQuarter: 8.1,
      confidence: 72
    };
  }
  
  private static calculateARPU(): number {
    return Math.random() * 25;
  }
  
  private static calculateCAC(): number {
    return Math.random() * 15;
  }
  
  private static calculateChurnRate(): number {
    return Math.random() * 5;
  }
  
  private static predictUserBehavior(): any {
    return {
      mostLikelyActions: ['ask_drink_recipe', 'rate_drink', 'save_favorite'],
      timePatterns: {
        peakHours: [19, 20, 21],
        peakDays: ['friday', 'saturday', 'sunday']
      }
    };
  }
  
  private static predictDrinkTrends(): any {
    return {
      emerging: ['Sustainable cocktails', 'Low-alcohol drinks'],
      declining: ['Overly complex drinks'],
      seasonal: {
        summer: ['Tropical drinks', 'Frozen cocktails'],
        winter: ['Hot toddies', 'Warm spiced drinks']
      }
    };
  }
  
  private static analyzeSeasonalPatterns(): any {
    return {
      spring: { drinks: ['Floral cocktails'], engagement: 'medium' },
      summer: { drinks: ['Tropical', 'Frozen'], engagement: 'high' },
      autumn: { drinks: ['Spiced cocktails'], engagement: 'medium' },
      winter: { drinks: ['Warm drinks', 'Rich cocktails'], engagement: 'low' }
    };
  }
  
  private static generateProductRecommendations(): string[] {
    return [
      'Adicionar mais drinks sazonais',
      'Criar categoria de drinks rápidos',
      'Implementar sistema de substituição de ingredientes'
    ];
  }
  
  private static generateMarketingRecommendations(): string[] {
    return [
      'Focar em horários de pico (19h-21h)',
      'Promover drinks de fim de semana',
      'Campanhas sazonais para verão'
    ];
  }
  
  private static generateTechnicalRecommendations(): string[] {
    return [
      'Otimizar cache para recomendações',
      'Implementar pré-carregamento de dados populares',
      'Melhorar compressão de respostas'
    ];
  }
  
  private static generateAlerts(): any[] {
    return [
      {
        type: 'warning',
        message: 'Taxa de cache abaixo do ideal',
        severity: 'medium',
        timestamp: new Date()
      }
    ];
  }
  
  private static analyzeCacheHealth(stats: any): string {
    if (stats.hitRate > 90) return 'excellent';
    if (stats.hitRate > 80) return 'good';
    if (stats.hitRate > 60) return 'fair';
    return 'poor';
  }
  
  private static generateCacheRecommendations(stats: any): string[] {
    const recommendations = [];
    
    if (stats.hitRate < 80) {
      recommendations.push('Aumentar TTL para dados estáticos');
    }
    
    if (stats.evictions > 100) {
      recommendations.push('Considerar aumentar tamanho do cache');
    }
    
    return recommendations;
  }
  
  private static convertToCSV(data: any): string {
    // Implementação simplificada de conversão para CSV
    return JSON.stringify(data, null, 2);
  }
} 