import config from './config';
import ioRedis = require('ioredis');

let redis: ioRedis.Redis;
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config.redis.pass || '',
        host: config.redis.host,
        connectTimeout: 10000,
        port: config.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config.redis.pass||'',
    };
    redis = new ioRedis(ioRedisConfig);
    redis.on('error', (ev) => {
        console.log('IORedis Error:');
        console.log(ev);
        redis = new ioRedis(ioRedisConfig);
    });
}

export default redis;
