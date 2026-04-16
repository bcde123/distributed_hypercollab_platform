const Redis = require('ioredis');

// Support both a full REDIS_URL (e.g. docker, Railway) and
// individual REDIS_HOST / REDIS_PORT vars (some PaaS environments).
const redisUrl =
    process.env.REDIS_URL ||
    `redis://${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`;

const redisClient = new Redis(redisUrl);

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
});

module.exports = redisClient;