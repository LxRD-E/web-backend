"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
let loggerInitialized = false;
exports.default = () => {
    if (loggerInitialized) {
        console.warn('[warning] logger initialize called twice. this is not allowed');
        return;
    }
    loggerInitialized = true;
    let logFilePath = require('path').join(__dirname, '../out.log');
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '');
    }
    let fileStream = fs.createWriteStream(logFilePath);
    let streamWritable = true;
    setInterval(() => {
        let stats = fs.statSync(logFilePath);
        let fileSizeInBytes = stats["size"];
        let fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
        if (fileSizeInMegabytes > 1024) {
            console.warn('over 1gb. deleting log file...');
            streamWritable = false;
            try {
                try {
                    fileStream.destroy();
                }
                catch (e) {
                    console.log(e);
                }
                setTimeout(() => {
                    fs.unlinkSync(logFilePath);
                    fs.writeFileSync(logFilePath, '');
                    fileStream = fs.createWriteStream(logFilePath);
                    streamWritable = true;
                }, 500);
            }
            catch (e) {
                console.error('warning: could not delete log file.', e);
            }
        }
    }, 3600);
    console.log = (...args) => {
        if (!streamWritable) {
            return;
        }
        let itemsToWrite = '';
        for (const item of args) {
            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'bigint' || typeof item === 'boolean') {
                itemsToWrite += ' ' + item;
            }
            else if (typeof item === 'object') {
                let encodedItem = JSON.stringify(item);
                itemsToWrite += ' ' + encodedItem;
            }
            else {
                console.warn('invalid type passed to console.log: ' + typeof item);
            }
        }
        fileStream.write(itemsToWrite + '\n', (err) => {
            if (!err) {
                return;
            }
            console.error(err);
        });
    };
};
//# sourceMappingURL=Logger.js.map