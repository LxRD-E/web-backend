// this is to log errors with scripts. it automatically spaces out all requests so that the webhook doesn't get spammed
import util = require('util');
import os = require('os');
const delay = util.promisify(setTimeout);
import axios from 'axios';
import config from '../helpers/config';

const webhook = config.webhooks.reports;
const awaitingRequests: string[] = [];

(async() => {
    while (true) {
        let index = 0;
        for (let req of awaitingRequests) {
            if (req && req.length >= 2000) {
                req = req.slice(0,1900);
            }
            // send request
            await axios.post(webhook, {'content':'['+os.hostname()+'] '+req});
            // delay
            await delay(2500);
            // delete
            awaitingRequests.splice(index);
            index ++;
        }
        // delay again
        await delay(1000);
    }
})();

/**
 * Register a new webhook call
 */
export default (str: string): void => {
    awaitingRequests.push(str);
}