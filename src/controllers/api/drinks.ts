import { Request, Response } from 'express';
import { DrinkModel, DrinkProfile } from '../../models/Drink';
import { AnalyticsService } from '../../services/analytics';
import { IntelligentCache } from '../../services/cache';

export class DrinksController {
  
  // GET /api/drinks - Listar drinks
  static async getAllDrinks(req: Request, res: Response): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        search = '', 
        category = '', 
        complexity = '',
        ingredient = '',
        sort = 'popularity'
      } = req.query;
      
      AnalyticsService.trackEvent('user_action', 'api', 'list_drinks', undefined, {
        page, limit, search, category, complexity, ingredient, sort
      });
      
      let drinks = DrinkModel.getAllDrinks();
      
      // Aplicar busca
      if (search) {
        drinks = DrinkModel.searchDrinks(search as string, 1000);
      }
      
      // Aplicar filtros
      if (category) {
        drinks = drinks.filter(drink => drink.metadata.category === category);
      }
      
      if (complexity) {
        drinks = drinks.filter(drink => drink.complexity.level === complexity);
      }
      
      if (ingredient) {
        drinks = DrinkModel.getDrinksByIngredient(ingredient as string);
      }
      
      // Aplicar ordenação
      switch (sort) {
        case 'popularity':
          drinks.sort((a, b) => b.popularity - a.popularity);
          break;
        case 'rating':
          drinks.sort((a, b) => b.averageRating - a.averageRating);
          break;
        case 'name':
          drinks.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'complexity':
          const complexityOrder = ['muito-fácil', 'fácil', 'médio', 'difícil', 'expert'];
          drinks.sort((a, b) => 
            complexityOrder.indexOf(a.complexity.level) - complexityOrder.indexOf(b.complexity.level)
          );
          break;
      }
      
      // Paginação
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedDrinks = drinks.slice(startIndex, endIndex);
      
      res.json({
        drinks: paginatedDrinks,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: drinks.length,
          totalPages: Math.ceil(drinks.length / limitNum)
        },
        filters: {
          search,
          category,
          complexity,
          ingredient,
          sort,
          appliedFilters: !!(search || category || complexity || ingredient)
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar drinks:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/:drinkId - Obter drink específico
  static async getDrink(req: Request, res: Response): Promise<void> {
    try {
      const { drinkId } = req.params;
      
      // Tentar obter do cache primeiro
      const cachedDrink = IntelligentCache.getCachedDrink(drinkId);
      if (cachedDrink) {
        res.json({ drink: cachedDrink, fromCache: true });
        return;
      }
      
      const drink = DrinkModel.getDrink(drinkId);
      
      if (!drink) {
        res.status(404).json({ error: 'Drink não encontrado' });
        return;
      }
      
      // Cache o resultado
      IntelligentCache.cacheDrink(drinkId, drink);
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_drink', undefined, { drinkId });
      
      res.json({ drink, fromCache: false });
      
    } catch (error) {
      console.error('❌ Erro ao obter drink:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/:drinkId', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/search - Buscar drinks
  static async searchDrinks(req: Request, res: Response): Promise<void> {
    try {
      const { q, limit = 20 } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({ error: 'Parâmetro de busca "q" é obrigatório' });
        return;
      }
      
      // Verificar cache de busca
      const cachedResults = IntelligentCache.getCachedSearchResults(q);
      if (cachedResults) {
        res.json({
          results: cachedResults.slice(0, parseInt(limit as string)),
          query: q,
          fromCache: true
        });
        return;
      }
      
      const results = DrinkModel.searchDrinks(q, parseInt(limit as string));
      
      // Cache os resultados
      IntelligentCache.cacheSearchResults(q, results);
      
      AnalyticsService.trackEvent('user_action', 'api', 'search_drinks', undefined, {
        query: q,
        resultsCount: results.length
      });
      
      res.json({
        results,
        query: q,
        fromCache: false
      });
      
    } catch (error) {
      console.error('❌ Erro ao buscar drinks:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/search', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/popular - Obter drinks populares
  static async getPopularDrinks(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;
      
      const popularDrinks = DrinkModel.getPopularDrinks(parseInt(limit as string));
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_popular_drinks', undefined, {
        limit: parseInt(limit as string)
      });
      
      res.json({
        drinks: popularDrinks,
        count: popularDrinks.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter drinks populares:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/popular', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/featured - Obter drinks em destaque
  static async getFeaturedDrinks(req: Request, res: Response): Promise<void> {
    try {
      const featuredDrinks = DrinkModel.getFeaturedDrinks();
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_featured_drinks');
      
      res.json({
        drinks: featuredDrinks,
        count: featuredDrinks.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter drinks em destaque:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/featured', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/mocktails - Obter drinks sem álcool
  static async getMocktails(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 20 } = req.query;
      
      const mocktails = DrinkModel.getMocktails().slice(0, parseInt(limit as string));
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_mocktails', undefined, {
        limit: parseInt(limit as string)
      });
      
      res.json({
        drinks: mocktails,
        count: mocktails.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter mocktails:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/mocktails', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/by-ingredient/:ingredient - Obter drinks por ingrediente
  static async getDrinksByIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { ingredient } = req.params;
      const { limit = 20 } = req.query;
      
      const drinks = DrinkModel.getDrinksByIngredient(ingredient)
        .slice(0, parseInt(limit as string));
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_drinks_by_ingredient', undefined, {
        ingredient,
        resultsCount: drinks.length
      });
      
      res.json({
        ingredient,
        drinks,
        count: drinks.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter drinks por ingrediente:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/by-ingredient/:ingredient', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/by-complexity/:level - Obter drinks por complexidade
  static async getDrinksByComplexity(req: Request, res: Response): Promise<void> {
    try {
      const { level } = req.params;
      const { limit = 20 } = req.query;
      
      const validLevels = ['muito-fácil', 'fácil', 'médio', 'difícil', 'expert'];
      if (!validLevels.includes(level)) {
        res.status(400).json({ 
          error: 'Nível de complexidade inválido',
          validLevels 
        });
        return;
      }
      
      const drinks = DrinkModel.getDrinksByComplexity(level as any)
        .slice(0, parseInt(limit as string));
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_drinks_by_complexity', undefined, {
        level,
        resultsCount: drinks.length
      });
      
      res.json({
        level,
        drinks,
        count: drinks.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter drinks por complexidade:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/by-complexity/:level', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // POST /api/drinks - Criar novo drink (admin)
  static async createDrink(req: Request, res: Response): Promise<void> {
    try {
      const drinkData = req.body;
      
      // Validação básica
      if (!drinkData.name || !drinkData.ingredients || !drinkData.instructions) {
        res.status(400).json({ 
          error: 'Dados obrigatórios: name, ingredients, instructions' 
        });
        return;
      }
      
      const drink = DrinkModel.addDrink(drinkData);
      
      // Invalidar caches relacionados
      IntelligentCache.invalidateByTags(['drinks']);
      
      AnalyticsService.trackEvent('user_action', 'api', 'create_drink', undefined, {
        drinkId: drink.id,
        name: drink.name
      });
      
      res.status(201).json({
        drink,
        message: 'Drink criado com sucesso'
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar drink:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'POST /api/drinks', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // PUT /api/drinks/:drinkId/rating - Atualizar rating do drink
  static async updateDrinkRating(req: Request, res: Response): Promise<void> {
    try {
      const { drinkId } = req.params;
      const { rating } = req.body;
      
      if (!rating || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Rating deve ser entre 1 e 5' });
        return;
      }
      
      const drink = DrinkModel.getDrink(drinkId);
      if (!drink) {
        res.status(404).json({ error: 'Drink não encontrado' });
        return;
      }
      
      DrinkModel.updateRating(drinkId, rating);
      
      // Invalidar cache
      IntelligentCache.invalidateByTags([`drink:${drinkId}`, 'drinks']);
      
      AnalyticsService.trackEvent('user_action', 'api', 'rate_drink', undefined, {
        drinkId,
        rating
      });
      
      res.json({ message: 'Rating atualizado com sucesso' });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar rating:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'PUT /api/drinks/:drinkId/rating', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/:drinkId/price - Calcular preço do drink
  static async calculateDrinkPrice(req: Request, res: Response): Promise<void> {
    try {
      const { drinkId } = req.params;
      
      const drink = DrinkModel.getDrink(drinkId);
      if (!drink) {
        res.status(404).json({ error: 'Drink não encontrado' });
        return;
      }
      
      const totalPrice = DrinkModel.calculateTotalPrice(drinkId);
      
      const priceBreakdown = drink.ingredients.map(ing => ({
        ingredient: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        price: ing.price || 0
      }));
      
      AnalyticsService.trackEvent('user_action', 'api', 'calculate_price', undefined, {
        drinkId,
        totalPrice
      });
      
      res.json({
        drinkId,
        drinkName: drink.name,
        totalPrice,
        priceBreakdown,
        currency: 'BRL'
      });
      
    } catch (error) {
      console.error('❌ Erro ao calcular preço:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/:drinkId/price', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/categories - Listar categorias disponíveis
  static async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const allDrinks = DrinkModel.getAllDrinks();
      const categories = [...new Set(allDrinks.map(drink => drink.metadata.category))];
      
      const categoriesWithCounts = categories.map(category => ({
        name: category,
        count: allDrinks.filter(drink => drink.metadata.category === category).length
      }));
      
      res.json({
        categories: categoriesWithCounts,
        total: categories.length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter categorias:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/categories', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/ingredients - Listar ingredientes mais populares
  static async getPopularIngredients(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 50 } = req.query;
      
      const allDrinks = DrinkModel.getAllDrinks();
      const ingredientCounts: Record<string, number> = {};
      
      allDrinks.forEach(drink => {
        drink.ingredients.forEach(ing => {
          ingredientCounts[ing.name] = (ingredientCounts[ing.name] || 0) + 1;
        });
      });
      
      const popularIngredients = Object.entries(ingredientCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, parseInt(limit as string));
      
      res.json({
        ingredients: popularIngredients,
        total: Object.keys(ingredientCounts).length
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter ingredientes:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/ingredients', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/drinks/stats - Estatísticas globais dos drinks
  static async getDrinkStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = DrinkModel.getDrinkStats();
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_drink_stats');
      
      res.json({ stats });
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/drinks/stats', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
} 