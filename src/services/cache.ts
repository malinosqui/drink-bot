import { AnalyticsService } from './analytics';

export interface CacheEntry {
  key: string;
  value: any;
  expiresAt: Date;
  createdAt: Date;
  accessCount: number;
  lastAccessed: Date;
  tags: string[];
  size: number; // em bytes
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  topKeys: Array<{ key: string; hits: number }>;
}

export interface CacheConfig {
  maxSize: number; // tamanho máximo em MB
  maxEntries: number;
  defaultTtl: number; // TTL padrão em segundos
  cleanupInterval: number; // intervalo de limpeza em ms
}

export class IntelligentCache {
  private static cache: Map<string, CacheEntry> = new Map();
  private static stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalRequests: 0
  };
  
  private static config: CacheConfig = {
    maxSize: 100, // 100MB
    maxEntries: 10000,
    defaultTtl: 3600, // 1 hora
    cleanupInterval: 300000 // 5 minutos
  };
  
  private static cleanupTimer: NodeJS.Timeout | null = null;
  
  // Inicializar o cache
  static initialize(config?: Partial<CacheConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Iniciar limpeza automática
    this.startCleanupTimer();
    
    console.log('🚀 Cache inteligente inicializado:', this.config);
  }
  
  // Obter valor do cache
  static get<T>(key: string, tags?: string[]): T | null {
    this.stats.totalRequests++;
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      AnalyticsService.trackEvent('performance', 'cache', 'miss', undefined, { key });
      return null;
    }
    
    // Verificar expiração
    if (entry.expiresAt < new Date()) {
      this.cache.delete(key);
      this.stats.misses++;
      AnalyticsService.trackEvent('performance', 'cache', 'expired', undefined, { key });
      return null;
    }
    
    // Verificar tags para invalidação seletiva
    if (tags && tags.length > 0) {
      const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
      if (!hasMatchingTag) {
        this.stats.misses++;
        return null;
      }
    }
    
    // Atualizar estatísticas de acesso
    entry.accessCount++;
    entry.lastAccessed = new Date();
    
    this.stats.hits++;
    AnalyticsService.trackEvent('performance', 'cache', 'hit', undefined, { key });
    
    return entry.value as T;
  }
  
  // Definir valor no cache
  static set(
    key: string, 
    value: any, 
    ttlSeconds?: number, 
    tags: string[] = []
  ): void {
    const ttl = ttlSeconds || this.config.defaultTtl;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const size = this.calculateSize(value);
    
    const entry: CacheEntry = {
      key,
      value,
      expiresAt,
      createdAt: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
      tags,
      size
    };
    
    // Verificar limites antes de adicionar
    if (this.shouldEvict(size)) {
      this.evictEntries(size);
    }
    
    this.cache.set(key, entry);
    
    AnalyticsService.trackEvent('performance', 'cache', 'set', undefined, {
      key,
      size,
      ttl,
      tags
    });
  }
  
  // Remover do cache
  static delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      AnalyticsService.trackEvent('performance', 'cache', 'delete', undefined, { key });
    }
    
    return deleted;
  }
  
  // Invalidar por tags
  static invalidateByTags(tags: string[]): number {
    let invalidated = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      const hasMatchingTag = tags.some(tag => entry.tags.includes(tag));
      if (hasMatchingTag) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    AnalyticsService.trackEvent('performance', 'cache', 'invalidate_by_tags', undefined, {
      tags,
      invalidated
    });
    
    return invalidated;
  }
  
  // Invalidar por padrão de chave
  static invalidateByPattern(pattern: RegExp): number {
    let invalidated = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        invalidated++;
      }
    }
    
    AnalyticsService.trackEvent('performance', 'cache', 'invalidate_by_pattern', undefined, {
      pattern: pattern.toString(),
      invalidated
    });
    
    return invalidated;
  }
  
  // Cache com função (memoização)
  static async remember<T>(
    key: string,
    factory: () => Promise<T> | T,
    ttlSeconds?: number,
    tags: string[] = []
  ): Promise<T> {
    // Tentar obter do cache primeiro
    const cached = this.get<T>(key, tags);
    if (cached !== null) {
      return cached;
    }
    
    // Gerar valor se não estiver em cache
    const value = await factory();
    this.set(key, value, ttlSeconds, tags);
    
    return value;
  }
  
  // Cache para resultados de funções síncronas
  static memoize<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => TReturn,
    keyGenerator?: (...args: TArgs) => string,
    ttlSeconds?: number,
    tags?: string[]
  ): (...args: TArgs) => TReturn {
    return (...args: TArgs): TReturn => {
      const key = keyGenerator ? keyGenerator(...args) : `memoize_${fn.name}_${JSON.stringify(args)}`;
      
      const cached = this.get<TReturn>(key, tags);
      if (cached !== null) {
        return cached;
      }
      
      const result = fn(...args);
      this.set(key, result, ttlSeconds, tags);
      
      return result;
    };
  }
  
  // Cache para resultados de funções assíncronas
  static memoizeAsync<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    keyGenerator?: (...args: TArgs) => string,
    ttlSeconds?: number,
    tags?: string[]
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      const key = keyGenerator ? keyGenerator(...args) : `memoize_async_${fn.name}_${JSON.stringify(args)}`;
      
      return this.remember(key, () => fn(...args), ttlSeconds, tags);
    };
  }
  
  // Verificar se deve fazer eviction
  private static shouldEvict(newEntrySize: number): boolean {
    const currentSize = this.getCurrentSize();
    const maxSizeBytes = this.config.maxSize * 1024 * 1024; // MB para bytes
    
    return (
      this.cache.size >= this.config.maxEntries ||
      currentSize + newEntrySize > maxSizeBytes
    );
  }
  
  // Fazer eviction de entradas
  private static evictEntries(requiredSpace: number): void {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    let currentSize = this.getCurrentSize();
    let evicted = 0;
    
    // Estratégia LFU (Least Frequently Used) + LRU (Least Recently Used)
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, entry }))
      .sort((a, b) => {
        // Primeiro por frequência de acesso
        if (a.entry.accessCount !== b.entry.accessCount) {
          return a.entry.accessCount - b.entry.accessCount;
        }
        // Depois por tempo de último acesso
        return a.entry.lastAccessed.getTime() - b.entry.lastAccessed.getTime();
      });
    
    for (const { key, entry } of entries) {
      if (currentSize + requiredSpace <= maxSizeBytes && this.cache.size < this.config.maxEntries) {
        break;
      }
      
      this.cache.delete(key);
      currentSize -= entry.size;
      evicted++;
      this.stats.evictions++;
    }
    
    if (evicted > 0) {
      AnalyticsService.trackEvent('performance', 'cache', 'eviction', undefined, {
        evicted,
        reason: 'size_limit'
      });
    }
  }
  
  // Calcular tamanho aproximado de um valor
  private static calculateSize(value: any): number {
    const jsonString = JSON.stringify(value);
    return Buffer.byteLength(jsonString, 'utf8');
  }
  
  // Obter tamanho atual do cache
  private static getCurrentSize(): number {
    let totalSize = 0;
    for (const entry of this.cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }
  
  // Limpeza automática de entradas expiradas
  private static cleanupExpired(): void {
    const now = new Date();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      AnalyticsService.trackEvent('performance', 'cache', 'cleanup', undefined, {
        cleaned
      });
    }
  }
  
  // Iniciar timer de limpeza
  private static startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired();
    }, this.config.cleanupInterval);
  }
  
  // Parar timer de limpeza
  static stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
  
  // Obter estatísticas
  static getStats(): CacheStats {
    const hitRate = this.stats.totalRequests > 0 
      ? (this.stats.hits / this.stats.totalRequests) * 100 
      : 0;
    
    const missRate = 100 - hitRate;
    
    // Top keys por acesso
    const topKeys = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.accessCount }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.getCurrentSize(),
      hitRate,
      missRate,
      evictions: this.stats.evictions,
      topKeys
    };
  }
  
  // Limpar cache completamente
  static clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    
    AnalyticsService.trackEvent('performance', 'cache', 'clear', undefined, {
      entriesCleared: size
    });
  }
  
  // Obter informações detalhadas
  static getInfo() {
    return {
      config: this.config,
      stats: this.getStats(),
      detailed: {
        totalRequests: this.stats.totalRequests,
        hits: this.stats.hits,
        misses: this.stats.misses,
        evictions: this.stats.evictions,
        currentSizeMB: (this.getCurrentSize() / 1024 / 1024).toFixed(2),
        maxSizeMB: this.config.maxSize,
        utilizationPercent: (this.cache.size / this.config.maxEntries * 100).toFixed(1)
      }
    };
  }
  
  // Cache específico para recomendações
  static cacheRecommendations(userId: string, recommendations: any[], ttlSeconds: number = 1800): void {
    this.set(`recommendations:${userId}`, recommendations, ttlSeconds, ['recommendations', `user:${userId}`]);
  }
  
  static getCachedRecommendations(userId: string): any[] | null {
    return this.get(`recommendations:${userId}`, ['recommendations']);
  }
  
  // Cache específico para drinks
  static cacheDrink(drinkId: string, drink: any, ttlSeconds: number = 7200): void {
    this.set(`drink:${drinkId}`, drink, ttlSeconds, ['drinks', `drink:${drinkId}`]);
  }
  
  static getCachedDrink(drinkId: string): any | null {
    return this.get(`drink:${drinkId}`, ['drinks']);
  }
  
  // Cache para perfis de usuário
  static cacheUserProfile(userId: string, profile: any, ttlSeconds: number = 3600): void {
    this.set(`user:${userId}`, profile, ttlSeconds, ['users', `user:${userId}`]);
  }
  
  static getCachedUserProfile(userId: string): any | null {
    return this.get(`user:${userId}`, ['users']);
  }
  
  // Cache para resultados de busca
  static cacheSearchResults(query: string, results: any[], ttlSeconds: number = 900): void {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    this.set(key, results, ttlSeconds, ['search']);
  }
  
  static getCachedSearchResults(query: string): any[] | null {
    const key = `search:${Buffer.from(query).toString('base64')}`;
    return this.get(key, ['search']);
  }
  
  // Pré-carregar dados importantes
  static async preload(): Promise<void> {
    console.log('🔄 Pré-carregando dados no cache...');
    
    // Pré-carregar drinks populares, dados do sistema, etc.
    // Este método seria chamado durante a inicialização
    
    AnalyticsService.trackEvent('performance', 'cache', 'preload', undefined, {
      timestamp: new Date()
    });
  }
  
  // Otimizar cache baseado em padrões de uso
  static optimize(): void {
    const stats = this.getStats();
    
    // Se hit rate estiver baixo, aumentar TTL
    if (stats.hitRate < 50) {
      console.log('📊 Cache: Hit rate baixo, otimizando TTLs...');
      // Lógica de otimização
    }
    
    // Se há muitas evictions, considerar aumentar tamanho
    if (stats.evictions > 100) {
      console.log('🚨 Cache: Muitas evictions detectadas');
    }
    
    AnalyticsService.trackEvent('performance', 'cache', 'optimize', undefined, {
      hitRate: stats.hitRate,
      evictions: stats.evictions
    });
  }
} 