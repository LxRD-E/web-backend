import config from './config';
import ioRedis = require('ioredis');
/*
const ioRedisConfig = {
    password: config.redis.pass || '',
    host: config.redis.host,
    connectTimeout: 10000,
    port: config.redis.port || 6379,
    enableOfflineQueue: true,
    sentinelPassword: config.redis.pass||'',
};

export default () => {
    let conn = new ioRedis(ioRedisConfig);
    conn.on('error', (ev) => {
        console.log('IORedis Error:');
        console.log(ev);
    });
    return conn;
};
*/
export default (): any => {

}