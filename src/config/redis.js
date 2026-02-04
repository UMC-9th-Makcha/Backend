import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redis.on('connect', () => {
  console.log('Redis 연결 성공');
});

redis.on('error', (err) => {
  console.error('Redis 연결 에러:', err);
});

export default redis;