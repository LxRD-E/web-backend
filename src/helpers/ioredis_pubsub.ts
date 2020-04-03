import config from './config';
import ioRedis = require('ioredis');

let redis: ioRedis.Redis;
let exportedFunc: () => ioRedis.Redis;
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config.redis.pass || '',
        host: config.redis.host,
        connectTimeout: 10000,
        port: config.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config.redis.pass||'',
    };

    exportedFunc = () => {
        let conn = new ioRedis(ioRedisConfig);
        conn.on('error', (ev) => {
            console.log('IORedis Error:');
            console.log(ev);
        });
        return conn;
    };
}else{
    let _testingExportFunc: any = () => {
        console.error('ioredis_pubsub should not be accessed in unit testing. exiting');
        process.exit(1);
    }
    exportedFunc = _testingExportFunc;
}
export default exportedFunc;