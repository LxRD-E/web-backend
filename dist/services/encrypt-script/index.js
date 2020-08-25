"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const thread_1 = require("../thread");
const game_1 = require("../../models/v1/game");
const sync = {
    encryptAndObfuscateScript: (script) => {
        script = script || this.workerData.script;
        let scriptSystemOptions = this.workerData.scriptOptions;
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
        }
        const obfuscated = jsObfuse.obfuscate(src, scriptSystemOptions);
        return new SimpleCrypto(scriptGameKey).encrypt(obfuscated.getObfuscatedCode());
    },
};
exports.sync = sync;
const async = {
    encryptAndObfuscateScript: async (script) => {
        return await thread_1.ThreadPool.exec({
            task: sync.encryptAndObfuscateScript,
            workerData: {
                script,
                scriptOptions: game_1.scriptOptions,
                GAME_KEY: game_1.GAME_KEY,
            },
        });
    },
};
exports.async = async;

