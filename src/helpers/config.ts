import {readFileSync} from 'fs';
import {join} from 'path';
import { decrypt } from '../dal/auth';
const secretEncryptionKey = process.env['SECRET_ENCRYPTION_KEY'];
const secretEncryptionIV = process.env['SECRET_ENCRYPTION_IV'];
if (!secretEncryptionKey || !secretEncryptionIV) {
    console.error('No decryption key or iv was specified in env: SECRET_ENCRYPTION_KEY, SECRET_ENCRYPTION_IV. Exiting with code 1.');
    process.exit(1);
}
// generate proper path to config, read file, decrypt file, json.parse file
const configString = JSON.parse(decrypt(readFileSync(join(__dirname, '../../config.json')).toString(), secretEncryptionKey, secretEncryptionIV));
// duplicate original object
const configJson = JSON.parse(JSON.stringify(configString));
// export default duplicated object
export default configJson;