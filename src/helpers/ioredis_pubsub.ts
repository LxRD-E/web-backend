import config from './config';
import ioRedis = require('ioredis');

export default () => {
    return new ioRedis(config.redis);
};
