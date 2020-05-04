import controller from '../../controllers/controller';

export default class Middleware extends controller {
    constructor() {
        super();
    }

    public cache(propName: string, maxCacheTimeInMilliSeconds: number = 30 * 1000) {
        class CacheSetup {
            private readonly maxCacheTimeInInMilliSeconds: number;
            private readonly propName: string;
            constructor(propName: string, maxCacheTimeInMilliSeconds: number) {
                this.maxCacheTimeInInMilliSeconds = maxCacheTimeInMilliSeconds;
                this.propName = propName;
            }
            private CachedData: any[] = [];

            public checkForCache(id: number): any|false {
                const maxCacheTimeInMilliSeconds = this.maxCacheTimeInInMilliSeconds;
                let _newArr = [];
                let success: any = false;
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
            public addToCache(arg: any): void {
                this.CachedData.push(arg);
            }
        }
        return new CacheSetup(propName, maxCacheTimeInMilliSeconds);
    }
}