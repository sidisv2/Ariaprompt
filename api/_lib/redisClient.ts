import Redis from 'ioredis';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    const url = process.env.REDIS_URL || process.env.RAILWAY_REDIS_URL || process.env.REDIS_PUBLIC_URL;
    if (!url) {
      throw new Error('REDIS_URL no está configurada en las variables de entorno.');
    }
    redisClient = new Redis(url, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
      connectTimeout: 5000,
    });

    redisClient.on('error', (err) => {
      console.error('[redisClient] Error de conexión Redis:', err);
    });
  }
  return redisClient;
}
