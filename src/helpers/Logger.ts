// init logs
export default () => {
    console.log('[warning] external log system has been disabled.');
}
/*
import fs = require('fs');
let loggerInitialized = false;
export default () => {
    if (loggerInitialized) {
        console.warn('[warning] logger initialize called twice. this is not allowed');
        return;
    }
    loggerInitialized = true;
    // Startup Logs
    let logFilePath = require('path').join(__dirname,'../out.log');
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath,'');
    }
    let fileStream = fs.createWriteStream(logFilePath);
    // is the log stream writable? if false, dont try to write to it
    let streamWritable = true;

    // every hour, check to see if the log file is over a gigabyte in size. If it is, delete it
    setInterval(() => {
        let stats = fs.statSync(logFilePath)
        let fileSizeInBytes = stats["size"]
        // convert the file size to megabytes
        let fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
        // if file size is over 1gb
        if (fileSizeInMegabytes > 1024) {
            console.warn('over 1gb. deleting log file...');
            // mark log stream as not writable
            streamWritable = false;
            try {
                try {
                    // destroy write stream
                    fileStream.destroy();
                }catch(e) {
                    // If its in the process of writing something, this might error. not sure, but we can investigate if that becomes and issue
                    console.log(e);
                }
                // if we dont timeout, we get EPERM errors
                // TODO: replace with blocking function
                setTimeout(() => {
                    // destroy the file (i think this isnt required since writeFileSync should do this anyway)
                    fs.unlinkSync(logFilePath);
                    // create a new empty log file
                    fs.writeFileSync(logFilePath, '');
                    // create a new write stream for console.log
                    fileStream = fs.createWriteStream(logFilePath);
                    // mark stream as writable
                    streamWritable = true;
                }, 500)
            }catch(e) {
                // error doing something
                console.error('warning: could not delete log file.', e);
            }
        }
        // hour
    }, 3600);
    console.log = (...args: any[]) => {
        if (!streamWritable) {
            return; // temp; might wanna set up a queue or something eventually
        }
        let itemsToWrite = '';
        for (const item of args) {
            if (typeof item === 'string' || typeof item === 'number' || typeof item === 'bigint' || typeof item === 'boolean') {
                itemsToWrite += ' ' + item;
            }else if (typeof item === 'object') {
                let encodedItem = JSON.stringify(item);
                itemsToWrite += ' '+encodedItem;
            }else{
                console.warn('invalid type passed to console.log: '+typeof item);
            }
        }
        fileStream.write(itemsToWrite+'\n', (err: any) => {
            if (!err) {
                return;
            }
            console.error(err);
        });
    }
}
*/