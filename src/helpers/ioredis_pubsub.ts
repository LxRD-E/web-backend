import config from './config';
import ioRedis = require('ioredis');
const ioRedisConfig = {
    password: config.redis.pass,
    host: config.redis.host,
    connectTimeout: 10000,
};

export default () => {
    return new ioRedis(ioRedisConfig);
};
