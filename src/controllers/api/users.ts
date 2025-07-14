import { Request, Response } from 'express';
import { UserModel, UserProfile } from '../../models/User';
import { RecommendationEngine } from '../../services/recommendations';
import { AnalyticsService } from '../../services/analytics';
import { IntelligentCache } from '../../services/cache';

export class UsersController {
  
  // GET /api/users - Listar usuários (admin)
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search = '', filter = 'all' } = req.query;
      
      AnalyticsService.trackEvent('user_action', 'api', 'list_users', undefined, {
        page, limit, search, filter
      });
      
      const users = UserModel.getAllUsers();
      let filteredUsers = users;
      
      // Aplicar busca
      if (search) {
        const searchTerm = (search as string).toLowerCase();
        filteredUsers = users.filter(user => 
          user.name.toLowerCase().includes(searchTerm) ||
          user.phoneNumber.includes(searchTerm)
        );
      }
      
      // Aplicar filtros
      if (filter !== 'all') {
        switch (filter) {
          case 'active':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            filteredUsers = filteredUsers.filter(u => u.lastActiveAt > weekAgo);
            break;
          case 'premium':
            filteredUsers = filteredUsers.filter(u => u.subscription && u.subscription !== 'basic');
            break;
          case 'vip':
            filteredUsers = filteredUsers.filter(u => u.isVip);
            break;
        }
      }
      
      // Paginação
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
      
      // Remover dados sensíveis
      const sanitizedUsers = paginatedUsers.map(user => ({
        id: user.id,
        name: user.name,
        phoneNumber: user.phoneNumber.replace(/(\d{2})(\d{5})(\d{4})/, '+55 ($1) $2-$3'),
        stats: user.stats,
        isVip: user.isVip,
        subscription: user.subscription,
        createdAt: user.createdAt,
        lastActiveAt: user.lastActiveAt
      }));
      
      res.json({
        users: sanitizedUsers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: filteredUsers.length,
          totalPages: Math.ceil(filteredUsers.length / limitNum)
        },
        filters: {
          search,
          filter,
          appliedFilters: filteredUsers.length !== users.length
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/users', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/users/:userId - Obter usuário específico
  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      // Tentar obter do cache primeiro
      const cachedUser = IntelligentCache.getCachedUserProfile(userId);
      if (cachedUser) {
        res.json({ user: cachedUser, fromCache: true });
        return;
      }
      
      const user = UserModel.getUser(userId);
      
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_user', userId, { userId });
      
      // Cache o resultado
      IntelligentCache.cacheUserProfile(userId, user);
      
      res.json({ user, fromCache: false });
      
    } catch (error) {
      console.error('❌ Erro ao obter usuário:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/users/:userId', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // PUT /api/users/:userId - Atualizar usuário
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      // Validar dados de entrada
      const allowedUpdates = [
        'name', 'nickname', 'favoriteIngredients', 'dislikedIngredients',
        'alcoholTolerance', 'preferredComplexity', 'language', 'timezone',
        'notificationsEnabled', 'dailyDrinkReminder'
      ];
      
      const updateData: Partial<UserProfile> = {};
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updateData[key as keyof UserProfile] = updates[key];
        }
      }
      
      UserModel.updatePreferences(userId, updateData);
      
      // Invalidar cache
      IntelligentCache.invalidateByTags([`user:${userId}`]);
      
      AnalyticsService.trackEvent('user_action', 'api', 'update_user', userId, {
        updatedFields: Object.keys(updateData)
      });
      
      const updatedUser = UserModel.getUser(userId);
      res.json({ user: updatedUser, message: 'Usuário atualizado com sucesso' });
      
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'PUT /api/users/:userId', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/users/:userId/recommendations - Obter recomendações
  static async getUserRecommendations(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 10, context, occasion, maxComplexity } = req.query;
      
      // Verificar cache primeiro
      const cachedRecommendations = IntelligentCache.getCachedRecommendations(userId);
      if (cachedRecommendations) {
        res.json({
          recommendations: cachedRecommendations.slice(0, parseInt(limit as string)),
          fromCache: true
        });
        return;
      }
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      const criteria = {
        userId,
        context: context as any,
        occasion: occasion as string,
        maxComplexity: maxComplexity as any,
        limit: parseInt(limit as string)
      };
      
      const recommendations = RecommendationEngine.getPersonalizedRecommendations(criteria);
      
      // Cache as recomendações
      IntelligentCache.cacheRecommendations(userId, recommendations);
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_recommendations', userId, {
        criteriaCount: Object.keys(criteria).length,
        recommendationsCount: recommendations.length
      });
      
      res.json({
        recommendations: recommendations.slice(0, parseInt(limit as string)),
        fromCache: false,
        insights: RecommendationEngine.getRecommendationInsights(userId)
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter recomendações:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/users/:userId/recommendations', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // POST /api/users/:userId/rating - Adicionar avaliação
  static async addRating(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { drinkId, drinkName, rating, review, tags = [] } = req.body;
      
      if (!drinkId || !drinkName || !rating || rating < 1 || rating > 5) {
        res.status(400).json({ error: 'Dados inválidos para avaliação' });
        return;
      }
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      UserModel.addRating(userId, {
        drinkId,
        drinkName,
        rating,
        review,
        tags
      });
      
      // Invalidar caches relacionados
      IntelligentCache.invalidateByTags([`user:${userId}`, 'recommendations']);
      
      AnalyticsService.trackEvent('user_action', 'api', 'add_rating', userId, {
        drinkId,
        rating,
        hasReview: !!review
      });
      
      res.json({ message: 'Avaliação adicionada com sucesso' });
      
    } catch (error) {
      console.error('❌ Erro ao adicionar avaliação:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'POST /api/users/:userId/rating', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // POST /api/users/:userId/favorites - Adicionar aos favoritos
  static async addToFavorites(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { drinkId } = req.body;
      
      if (!drinkId) {
        res.status(400).json({ error: 'drinkId é obrigatório' });
        return;
      }
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      UserModel.addToFavorites(userId, drinkId);
      
      // Invalidar cache
      IntelligentCache.invalidateByTags([`user:${userId}`]);
      
      AnalyticsService.trackEvent('user_action', 'api', 'add_favorite', userId, { drinkId });
      
      res.json({ message: 'Adicionado aos favoritos' });
      
    } catch (error) {
      console.error('❌ Erro ao adicionar favorito:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'POST /api/users/:userId/favorites', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/users/:userId/history - Obter histórico
  static async getUserHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      
      const paginatedHistory = user.drinkHistory.slice(startIndex, endIndex);
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_history', userId, {
        page: pageNum,
        limit: limitNum
      });
      
      res.json({
        history: paginatedHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: user.drinkHistory.length,
          totalPages: Math.ceil(user.drinkHistory.length / limitNum)
        }
      });
      
    } catch (error) {
      console.error('❌ Erro ao obter histórico:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/users/:userId/history', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // GET /api/users/:userId/stats - Obter estatísticas do usuário
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      // Estatísticas avançadas
      const stats = {
        ...user.stats,
        totalFavorites: user.favoriteRecipes.length,
        totalRatings: user.ratings.length,
        joinedDaysAgo: Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        lastActiveHours: Math.floor((Date.now() - user.lastActiveAt.getTime()) / (1000 * 60 * 60)),
        profileCompleteness: this.calculateProfileCompleteness(user),
        engagementLevel: this.calculateEngagementLevel(user)
      };
      
      AnalyticsService.trackEvent('user_action', 'api', 'get_stats', userId);
      
      res.json({ stats });
      
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: '/api/users/:userId/stats', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // DELETE /api/users/:userId - Deletar usuário (admin)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const user = UserModel.getUser(userId);
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }
      
      // Aqui implementaria a lógica de exclusão real
      // Por enquanto, apenas marcamos como inativo
      
      AnalyticsService.trackEvent('user_action', 'api', 'delete_user', userId);
      
      res.json({ message: 'Usuário removido com sucesso' });
      
    } catch (error) {
      console.error('❌ Erro ao deletar usuário:', error);
      AnalyticsService.trackSystemEvent('error', { endpoint: 'DELETE /api/users/:userId', error: (error as Error).message });
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
  
  // Métodos auxiliares
  private static calculateProfileCompleteness(user: UserProfile): number {
    let completeness = 0;
    const maxScore = 100;
    
    // Nome e telefone (básico) - 20%
    if (user.name && user.phoneNumber) completeness += 20;
    
    // Preferências - 30%
    if (user.favoriteIngredients.length > 0) completeness += 15;
    if (user.dislikedIngredients.length > 0) completeness += 10;
    if (user.alcoholTolerance !== 'medium') completeness += 5; // Configurado
    
    // Atividade - 30%
    if (user.drinkHistory.length > 0) completeness += 15;
    if (user.ratings.length > 0) completeness += 15;
    
    // Configurações - 20%
    if (user.nickname) completeness += 5;
    if (user.language !== 'pt-BR') completeness += 5; // Configurado manualmente
    if (user.notificationsEnabled !== true) completeness += 5; // Configurado
    if (user.timezone !== 'America/Sao_Paulo') completeness += 5; // Configurado
    
    return Math.min(completeness, maxScore);
  }
  
  private static calculateEngagementLevel(user: UserProfile): 'low' | 'medium' | 'high' | 'expert' {
    const score = user.stats.totalDrinksAsked * 2 + 
                  user.ratings.length * 3 + 
                  user.favoriteRecipes.length * 1;
    
    if (score < 10) return 'low';
    if (score < 30) return 'medium';
    if (score < 60) return 'high';
    return 'expert';
  }
} 