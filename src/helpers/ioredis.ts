import config from './config';
import ioRedis = require('ioredis');
const redis = new ioRedis(config.redis);

export default redis;
