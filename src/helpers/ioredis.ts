import config from './config';
import IORedis = require('ioredis');

let redis: IORedis.Redis;
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config.redis.pass || '',
        host: config.redis.host,
        connectTimeout: 10000,
        port: config.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config.redis.pass||'',
    };
    redis = new IORedis(ioRedisConfig);
    redis.on('error', (ev) => {
        console.log('IORedis Error:');
        console.log(ev);
        redis = new IORedis(ioRedisConfig);
    });
    console.log('REDIS was setup!');
}

export default redis;
