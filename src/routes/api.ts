import express from 'express';
import { UsersController } from '../controllers/api/users';
import { DrinksController } from '../controllers/api/drinks';
import { AnalyticsController } from '../controllers/api/analytics';
import { RecommendationEngine } from '../services/recommendations';
import { AnalyticsService } from '../services/analytics';
import { IntelligentCache } from '../services/cache';

const router = express.Router();

// Middleware para rastreamento de API calls
router.use((req, res, next) => {
  const startTime = Date.now();
  
  // Rastrear inicio da requisição
  AnalyticsService.trackEvent('user_action', 'api', 'request_start', undefined, {
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Interceptar o fim da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    AnalyticsService.trackEvent('performance', 'api', 'response_time', undefined, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime
    });
    
    return originalSend.call(this, data);
  };
  
  next();
});

// Middleware de autenticação simples (para endpoints administrativos)
const adminAuth = (req: express.Request, res: express.Response, next: express.NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  
  // Implementação simplificada - em produção usaria JWT ou OAuth
  if (!apiKey || apiKey !== process.env.ADMIN_API_KEY) {
    res.status(401).json({ error: 'Não autorizado' });
    return;
  }
  
  next();
};

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    version: '1.0.0',
    services: {
      cache: IntelligentCache.getStats().hitRate > 0 ? 'healthy' : 'warning',
      analytics: 'healthy'
    }
  });
});

// ===== ROTAS DE USUÁRIOS =====
router.get('/users', adminAuth, UsersController.getAllUsers);
router.get('/users/:userId', UsersController.getUser);
router.put('/users/:userId', UsersController.updateUser);
router.delete('/users/:userId', adminAuth, UsersController.deleteUser);

// Funcionalidades específicas do usuário
router.get('/users/:userId/recommendations', UsersController.getUserRecommendations);
router.post('/users/:userId/rating', UsersController.addRating);
router.post('/users/:userId/favorites', UsersController.addToFavorites);
router.get('/users/:userId/history', UsersController.getUserHistory);
router.get('/users/:userId/stats', UsersController.getUserStats);

// ===== ROTAS DE DRINKS =====
router.get('/drinks', DrinksController.getAllDrinks);
router.get('/drinks/search', DrinksController.searchDrinks);
router.get('/drinks/popular', DrinksController.getPopularDrinks);
router.get('/drinks/featured', DrinksController.getFeaturedDrinks);
router.get('/drinks/mocktails', DrinksController.getMocktails);
router.get('/drinks/categories', DrinksController.getCategories);
router.get('/drinks/ingredients', DrinksController.getPopularIngredients);
router.get('/drinks/stats', DrinksController.getDrinkStats);

// Rotas específicas de drinks (ordem importa!)
router.get('/drinks/by-ingredient/:ingredient', DrinksController.getDrinksByIngredient);
router.get('/drinks/by-complexity/:level', DrinksController.getDrinksByComplexity);
router.get('/drinks/:drinkId', DrinksController.getDrink);
router.get('/drinks/:drinkId/price', DrinksController.calculateDrinkPrice);

// Rotas administrativas de drinks
router.post('/drinks', adminAuth, DrinksController.createDrink);
router.put('/drinks/:drinkId/rating', DrinksController.updateDrinkRating);

// ===== ROTAS DE ANALYTICS =====
router.get('/analytics/dashboard', adminAuth, AnalyticsController.getDashboard);
router.get('/analytics/users', adminAuth, AnalyticsController.getUserMetrics);
router.get('/analytics/drinks', adminAuth, AnalyticsController.getDrinkMetrics);
router.get('/analytics/performance', adminAuth, AnalyticsController.getPerformanceMetrics);
router.get('/analytics/realtime', adminAuth, AnalyticsController.getRealTimeMetrics);
router.get('/analytics/business', adminAuth, AnalyticsController.getBusinessMetrics);
router.get('/analytics/insights', adminAuth, AnalyticsController.getAdvancedInsights);
router.get('/analytics/cache', adminAuth, AnalyticsController.getCacheAnalytics);
router.post('/analytics/export', adminAuth, AnalyticsController.exportAnalytics);
router.post('/analytics/optimize', adminAuth, AnalyticsController.optimizeSystem);

// ===== ROTAS DE RECOMENDAÇÕES =====
router.post('/recommendations', async (req, res): Promise<void> => {
  try {
    const { userId, context, availableIngredients, maxComplexity, limit = 10 } = req.body;
    
    if (!userId) {
      res.status(400).json({ error: 'userId é obrigatório' });
      return;
    }
    
    const criteria = {
      userId,
      context,
      availableIngredients,
      maxComplexity,
      limit
    };
    
    const recommendations = RecommendationEngine.getPersonalizedRecommendations(criteria);
    const insights = RecommendationEngine.getRecommendationInsights(userId);
    
    AnalyticsService.trackEvent('user_action', 'api', 'get_recommendations', userId, {
      context,
      criteriaProvided: Object.keys(criteria).length
    });
    
    res.json({
      recommendations,
      insights,
      criteria,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter recomendações:', error);
    AnalyticsService.trackSystemEvent('error', { endpoint: 'POST /api/recommendations', error: (error as Error).message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.get('/recommendations/explain/:drinkId/:userId', async (req, res) => {
  try {
    const { drinkId, userId } = req.params;
    
    const explanation = RecommendationEngine.explainRecommendation(drinkId, userId);
    
    AnalyticsService.trackEvent('user_action', 'api', 'explain_recommendation', userId, { drinkId });
    
    res.json({
      explanation,
      drinkId,
      userId,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Erro ao explicar recomendação:', error);
    AnalyticsService.trackSystemEvent('error', { endpoint: '/api/recommendations/explain', error: (error as Error).message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE CACHE =====
router.get('/cache/stats', adminAuth, (req, res) => {
  try {
    const stats = IntelligentCache.getStats();
    const info = IntelligentCache.getInfo();
    
    res.json({
      stats,
      info,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Erro ao obter stats do cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/cache/clear', adminAuth, (req, res) => {
  try {
    const { tags } = req.body;
    
    let cleared = 0;
    if (tags && Array.isArray(tags)) {
      cleared = IntelligentCache.invalidateByTags(tags);
    } else {
      IntelligentCache.clear();
      cleared = -1; // Indica limpeza completa
    }
    
    AnalyticsService.trackEvent('system_event', 'cache', 'manual_clear', undefined, { tags, cleared });
    
    res.json({
      message: cleared === -1 ? 'Cache limpo completamente' : `${cleared} entradas removidas`,
      cleared,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE SISTEMA =====
router.get('/system/status', adminAuth, (req, res) => {
  try {
    const status = {
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version
      },
      services: {
        cache: IntelligentCache.getInfo(),
        analytics: AnalyticsService.getCompleteReport()
      },
      timestamp: new Date()
    };
    
    res.json(status);
    
  } catch (error) {
    console.error('❌ Erro ao obter status do sistema:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE BUSCA GLOBAL =====
router.get('/search', async (req, res): Promise<void> => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    
    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório' });
      return;
    }
    
    const results: any = {
      query: q,
      total: 0,
      timestamp: new Date()
    };
    
    if (type === 'all' || type === 'drinks') {
      const { DrinkModel } = await import('../models/Drink');
      const drinks = DrinkModel.searchDrinks(q, parseInt(limit as string));
      results.drinks = drinks;
      results.total += drinks.length;
    }
    
    if (type === 'all' || type === 'users') {
      const { UserModel } = await import('../models/User');
      const users = UserModel.getAllUsers()
        .filter(user => 
          user.name.toLowerCase().includes(q.toLowerCase()) ||
          user.phoneNumber.includes(q)
        )
        .slice(0, parseInt(limit as string));
      results.users = users;
      results.total += users.length;
    }
    
    AnalyticsService.trackEvent('user_action', 'api', 'global_search', undefined, {
      query: q,
      type,
      resultsCount: results.total
    });
    
    res.json(results);
    
  } catch (error) {
    console.error('❌ Erro na busca global:', error);
    AnalyticsService.trackSystemEvent('error', { endpoint: '/api/search', error: (error as Error).message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== ROTAS DE DESCOBERTA =====
router.get('/discover', async (req, res) => {
  try {
    const { category, mood, occasion, ingredients } = req.query;
    
    const { DrinkModel } = await import('../models/Drink');
    let drinks = DrinkModel.getAllDrinks();
    
    // Aplicar filtros de descoberta
    if (category) {
      drinks = drinks.filter(drink => drink.metadata.category === category);
    }
    
    if (occasion) {
      drinks = drinks.filter(drink => 
        drink.metadata.occasions.includes(occasion as string)
      );
    }
    
    if (ingredients) {
      const ingredientList = (ingredients as string).split(',');
      drinks = drinks.filter(drink =>
        ingredientList.some(ing =>
          drink.ingredients.some(dIng => 
            dIng.name.toLowerCase().includes(ing.toLowerCase())
          )
        )
      );
    }
    
    // Embaralhar e limitar resultados
    const shuffled = drinks.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    AnalyticsService.trackEvent('user_action', 'api', 'discover', undefined, {
      filters: { category, mood, occasion, ingredients },
      resultsCount: shuffled.length
    });
    
    res.json({
      drinks: shuffled,
      filters: { category, mood, occasion, ingredients },
      count: shuffled.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('❌ Erro na descoberta:', error);
    AnalyticsService.trackSystemEvent('error', { endpoint: '/api/discover', error: (error as Error).message });
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ===== MIDDLEWARE DE ERRO =====
router.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Erro na API:', err);
  
  AnalyticsService.trackSystemEvent('error', {
    endpoint: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });
  
  res.status(500).json({
    error: 'Erro interno do servidor',
    timestamp: new Date(),
    requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  });
});

export default router; 