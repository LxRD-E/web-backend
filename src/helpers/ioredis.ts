import config from './config';
import ioRedis = require('ioredis');
const ioRedisConfig = {
    password: config.redis.pass || '',
    host: config.redis.host,
    connectTimeout: 10000,
    port: config.redis.port || 6379,
};
const redis = new ioRedis(ioRedisConfig);

export default redis;
