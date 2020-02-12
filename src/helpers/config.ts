import {readFileSync} from 'fs';
import {join} from 'path';
const configString = JSON.parse(readFileSync(join(__dirname, '../../config.json')).toString());
const configJson = Object.freeze(configString);
export default configJson;