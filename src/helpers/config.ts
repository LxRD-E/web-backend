import {readFileSync} from 'fs';
import {join} from 'path';
import Crypto = require("crypto");
const secretEncryptionKey = process.env['SECRET_ENCRYPTION_KEY'];
const secretEncryptionIV = process.env['SECRET_ENCRYPTION_IV'];

interface IWebsiteConfiguration {
    baseUrl: {
        play: string;
        www: string;
        api: string;
    }
    [x: string]: any;
}

let configJson: IWebsiteConfiguration = {
    encryptionKeys: {},
    coinpayments: {},
    baseUrl: {
        play: "https://play.blockshub.net",
        www: "https://www.blockshub.net",
        api: "https://api.blockshub.net"
    }
};

const decrypt = (encryptedString: string, key: string, iv?: Buffer|string): string => {
    // for legacy purposes
    // todo: remove
    if (typeof iv !== 'string' && typeof iv !== 'object') {
        console.warn('[warning] no iv specified for auth.decrypt(), using default of NULL');
        iv = Buffer.from('0'.repeat(32), 'hex');
    }
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
}

console.log('process.env.node_env check');
if (process.env.NODE_ENV !== 'test') {
    if (!secretEncryptionKey || !secretEncryptionIV) {
        console.error('No decryption key or iv was specified in env: SECRET_ENCRYPTION_KEY, SECRET_ENCRYPTION_IV. Exiting with code 1.');
        process.exit(1);
    }
    // generate proper path to config, read file, decrypt file, json.parse file
    const configString = JSON.parse(decrypt(readFileSync(join(__dirname, '../../config.json')).toString(), secretEncryptionKey, secretEncryptionIV));

    // trying to connect directly to "127.0.0.1" causes timeout issues (that auto-resolve after a re-connect attempt)...
    if (configString.redis.host === '127.0.0.1') {
        configString.redis.host = 'localhost';
    }
    // duplicate original object
    configJson = Object.freeze(configString);
}else{
    console.warn('[warning] empty config ')
}
// export default duplicated object
export default configJson;