const fs = require('fs-extra');
const path = require('path');
const swc = require("@swc/core");

const walk = function(dir) {
    var results = [];
    var list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        var stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            /* Recurse into a subdirectory */
            results = results.concat(walk(file));
        } else { 
            /* Is a file */
            results.push(file);
        }
    });
    return results;
}
const main = async () => {
    let copyPromises = [];
    for (const file of walk('./src')) {
        if (file.slice(file.length-2) !== 'ts') {
            // copy sync
            // console.log('./dist/'+file.slice('./src/'.length));

            copyPromises.push(fs.copy(file, './dist/'+file.slice('./src/'.length)));
            continue;
        }
        const processFile = async () => {
            let fileData = await fs.readFile(file);
            let ouput = await swc.transform(fileData.toString(), {
                    // Some options cannot be specified in .swcrc
                    sourceMaps: 'inline',
                    // All options below can be configured via .swcrc
                    jsc: {
                        "loose": true,
                        target: 'gwaijgwapijwga',
                        parser: {
                            syntax: "typescript",
                            decorators: true,
                            tsx: false,
                        },
                        module: {
                            "type": "commonjs",
                        },
                        transform: {}
                    },
                }
            );
            console.log(ouput.code);
            process.exit();
        }
        copyPromises.push(processFile());
    }
    await Promise.all(copyPromises).catch(e => {
        console.error(e);
    })
}

main();