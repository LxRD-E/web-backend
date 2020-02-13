"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const os = require("os");
const delay = util.promisify(setTimeout);
const axios_1 = require("axios");
const config_1 = require("../helpers/config");
const webhook = config_1.default.webhooks.reports;
const awaitingRequests = [];
(async () => {
    while (true) {
        let index = 0;
        for (let req of awaitingRequests) {
            if (req && req.length >= 2000) {
                req = req.slice(0, 1900);
            }
            await axios_1.default.post(webhook, { 'content': '[' + os.hostname() + '] ' + req });
            await delay(2500);
            awaitingRequests.splice(index);
            index++;
        }
        await delay(1000);
    }
})();
exports.default = (str) => {
    awaitingRequests.push(str);
};

