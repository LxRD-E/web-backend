import config from './config';
import * as IORedis from 'ioredis';

let redis: IORedis.Redis;
let exportedFunc: () => IORedis.Redis;
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config.redis.pass || '',
        host: config.redis.host,
        connectTimeout: 1000,
        port: config.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config.redis.pass||'',
    };

    exportedFunc = () => {
        let conn = new IORedis(ioRedisConfig);
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