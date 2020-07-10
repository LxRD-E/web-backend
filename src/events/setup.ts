import * as fs from 'fs';
import {join} from 'path';
import handler from './user-referral/handler';

/*
const base = join(__dirname,'./');
console.log(base);
const dir = fs.readdirSync(base);
for (const file of dir) {
    let stat = fs.statSync(base+file);
    if (stat.isDirectory()) {
        let fileName = 'handler.ts';
        let index = fs.existsSync(base+file+'/handler.ts');
        if (!index) {
            index = fs.existsSync(base+file+'/handler.js');
            fileName = 'handler.js';
        }
        if (!index) {
            continue;
        }
        const fullPath = join(base,file,fileName);
        console.log('including',fullPath)
        require(fullPath);
    }
}
 */