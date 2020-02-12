import config from './config';
import ioRedis = require('ioredis');
const ioRedisConfig = {
    password: config.redis.pass || '',
    host: config.redis.host,
    connectTimeout: 10000,
    port: config.redis.port || 6379,
    enableOfflineQueue: true,
    sentinelPassword: config.redis.pass||'',
};
console.log(ioRedisConfig)
const redis = new ioRedis(ioRedisConfig);
redis.on('error', (ev) => {
    console.log('IORedis Error:');
    console.log(ev);
});

export default redis;
