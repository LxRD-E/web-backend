import {ThreadPool} from "../thread";
import {GAME_KEY, scriptOptions} from "../../models/v1/game";

const sync = {
    encryptAndObfuscateScript: (script?: string): string => {
        // @ts-ignore
        script = script || this.workerData.script;
        // @ts-ignore
        let scriptSystemOptions = this.workerData.scriptOptions;
        // @ts-ignore
        let scriptGameKey = this.workerData.GAME_KEY;
        const jsObfuse = require('javascript-obfuscator');
        const SimpleCrypto = require('simple-crypto-js').default;
        let src = `
            (function(scene){
                // Script Goes Here

                ${script}

                // End Script
            })();
            `;
        if (process.env.NODE_ENV === 'development') {
            // return new SimpleCrypto(scriptGameKey).encrypt(src);
        }
        const obfuscated = jsObfuse.obfuscate(src, scriptSystemOptions);
        return new SimpleCrypto(scriptGameKey).encrypt(obfuscated.getObfuscatedCode());
    },
}

const async = {
    encryptAndObfuscateScript: async (script: string): Promise<string> => {
        return await ThreadPool.exec({
            task: sync.encryptAndObfuscateScript,
            workerData: {
                script,
                scriptOptions,
                GAME_KEY,
            },
        });
    },
}

export {
    sync,
    async,
}