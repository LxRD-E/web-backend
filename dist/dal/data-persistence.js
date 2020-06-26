"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _init_1 = require("./_init");
class DataPersistenceDAL extends _init_1.default {
    async set(gameId, key, value) {
        const fullKey = 'dp_game_' + gameId.toString() + '_' + key;
        if (value === null || value === '' || typeof value === "undefined") {
            await this.redis.del(fullKey);
        }
        else {
            await this.redis.set(fullKey, JSON.stringify({
                type: typeof value,
                value: value,
            }));
        }
    }
    async get(gameId, key) {
        const fullKey = 'dp_game_' + gameId.toString() + '_' + key;
        let results = await this.redis.get(fullKey);
        if (!results || results === '') {
            return undefined;
        }
        let decodedResults = JSON.parse(results);
        if (decodedResults.type === 'string') {
            return decodedResults.value;
        }
        else if (decodedResults.type === 'number') {
            return decodedResults.value;
        }
        else if (decodedResults.type === 'boolean') {
            return decodedResults.value;
        }
        else {
            throw new Error('Unrecognized type passed in key');
        }
    }
}
exports.default = DataPersistenceDAL;

