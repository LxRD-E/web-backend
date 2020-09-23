import config from './config';
import * as IORedis from 'ioredis';

let redis: IORedis.Redis;
let get = (): IORedis.Redis => {
    return redis;
}
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config.redis.pass || '',
        host: config.redis.host,
        connectTimeout: 1000,
        port: config.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config.redis.pass || '',
    };
    redis = new IORedis(ioRedisConfig);
    redis.on('error', (ev) => {
        console.error('IORedis Error:', ev);
        try {
            redis.disconnect();
        } catch (err) {
            console.error('ioredis disconnect error', err);
        }
        redis = new IORedis(ioRedisConfig);
    });
}
// @ts-ignore
export default redis;
export { get };