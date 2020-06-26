/**
 * Imports
 */
import * as model from '../models/models';
import _init from './_init';

/**
 * Data Persistence Data Access Layer (for games)
 */
export default class DataPersistenceDAL extends _init {
    /**
     * Set a value for the {gameId} data persistence key.
     * @param gameId
     * @param key
     * @param value If undefined or null or empty string, key will be deleted
     */
    public async set(gameId: number, key: string, value?: string|number|boolean|undefined|null): Promise<void> {
        const fullKey = 'dp_game_'+gameId.toString()+'_'+key;
        if (value === null || value === '' || typeof value === "undefined") {
            // Delete key
            await this.redis.del(fullKey);
        }else{
            // Set key
            await this.redis.set(fullKey, JSON.stringify({
                type: typeof value,
                value: value,
            }));
        }
    }

    /**
     * Get a data persistence value by key
     * @param gameId
     * @param key
     */
    public async get(gameId: number, key: string): Promise<string|number|boolean|undefined|null> {
        const fullKey = 'dp_game_'+gameId.toString()+'_'+key;
        let results = await this.redis.get(fullKey);
        if (!results || results === '') {
            return undefined;
        }
        let decodedResults = JSON.parse(results) as {type: string; value: unknown};
        if (decodedResults.type === 'string') {
            return decodedResults.value as string;
        }else if (decodedResults.type === 'number') {
            return decodedResults.value as number;
        }else if (decodedResults.type === 'boolean') {
            return decodedResults.value as boolean;
        }else{
            throw new Error('Unrecognized type passed in key');
        }
    }
}
