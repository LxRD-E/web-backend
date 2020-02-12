/**
 * Imports
 */

import Config from '../helpers/config';
// Setup Parse
const options = Config.redis;

import redis = require('redis')
import session = require('express-session')
let RedisStore = require('connect-redis')(session)

let redisClient = redis.createClient(options)
redisClient.unref()
redisClient.on('error', console.log)
let store = new RedisStore({ client: redisClient })


/**
 * App is the Express App, but the type can't actually be defined so it has to be left as "any"
 */
export const parser = session({
    name: 'rbxsession',
    secret: Config.session.secret,
    resave: false,
    store: store,
    saveUninitialized: true,
    cookie: {
        secure: Config.session.secure,
        maxAge: 86400 * 1000 * 30 * 12,
        sameSite: 'lax',
    },
});
export default parser;