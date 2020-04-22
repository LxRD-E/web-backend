"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const controller_1 = require("../../controllers/controller");
class Middleware extends controller_1.default {
    constructor() {
        super();
    }
    cache(propName, maxCacheTimeInMilliSeconds = 30 * 1000) {
        class CacheSetup {
            constructor(propName, maxCacheTimeInMilliSeconds) {
                this.CachedData = [];
                this.maxCacheTimeInInMilliSeconds = maxCacheTimeInMilliSeconds;
                this.propName = propName;
            }
            checkForCache(id) {
                const maxCacheTimeInMilliSeconds = this.maxCacheTimeInInMilliSeconds;
                let _newArr = [];
                let success = false;
                for (const entry of this.CachedData) {
                    if (entry.createdAt + maxCacheTimeInMilliSeconds >= new Date().getTime()) {
                        _newArr.push(entry);
                        if (entry.data[this.propName] === id) {
                            console.log('Cached');
                            success = entry.data;
                        }
                    }
                }
                this.CachedData = _newArr;
                return success;
            }
            addToCache(arg) {
                this.CachedData.push(arg);
            }
        }
        return new CacheSetup(propName, maxCacheTimeInMilliSeconds);
    }
}
exports.default = Middleware;

