/**
 * Imports
 */

import Config from '../helpers/config';
// Setup Parse
const options = Config.redis;

import redis = require('redis')
import session = require('express-session')

let RedisStore = require('connect-redis')(session)

const redisConfig = {
    password: Config.redis.pass || '',
    host: Config.redis.host,
    port: Config.redis.port || 6379,
    enable_offline_queue: true,
    auth_pass: Config.redis.pass || '',
    no_ready_check: true,
};
let redisClient = redis.createClient(redisConfig)
redisClient.unref()
redisClient.on('error', (e) => {
    console.log('Redis Error');
    console.log(e);
})
let store = new RedisStore({ client: redisClient })


/**
 * App is the Express App, but the type can't actually be defined so it has to be left as "any"
 */
export const parser = session({
    name: 'blockshub-session',
    secret: Config.session.secret,
    resave: false,
    store: store,
    saveUninitialized: true,
    cookie: {
        secure: Config.session.secure,
        // (about) 1 year
        maxAge: (86400 * 30 * 12) * 1000,
        sameSite: 'lax',
        domain: Config.session.domain || '.blockshub.hh',
    },
});
export default parser;