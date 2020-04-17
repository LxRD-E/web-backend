const fs = require('fs-extra');
const childProcess = require('child_process');

try {
    // Remove current build
    // fs.removeSync('./dist/');
    let distDir;
    try {
        distDir = fs.readdirSync('./dist/');
    }catch{
        // does not exist, so make it
        fs.mkdirSync('./dist/');
        // re-assign to empty array
        distDir = [];
    }
    // make public dir if not exists
    try {
        fs.readdirSync('./dist/public/')
    }catch{
        // does not exist, so make it
        fs.mkdirSync('./dist/public/');
    }
    // make scripts dir if not exists
    try {
        fs.readdirSync('./dist/scripts/')
    }catch{
        // does not exist, so make it
        fs.mkdirSync('./dist/scripts/');
    }
    for (const file of distDir) {
        if (file === 'public') {continue;}
        fs.removeSync('./dist/'+file);
    }
    // Copy views
    fs.copySync('./src/views', './dist/views');
    // Transpile JS
    console.log('start babel transpile...');
    console.time('babel transpile');
    childProcess.exec('babel src/public/ -d dist/public/ --copy-files --verbose', async (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }else if (stderr) {
            console.log(stderr);
        }else{
            // OK
            console.log('babel build ok');
            console.timeEnd('babel transpile');
        }
    });
    // Transpile the typescript files
    console.log('start typescript transpile...');
    console.time('typescript build');
    childProcess.exec('tsc --build tsconfig.prod.json', async (err, stdout, stderr) => {
        if (err) {
            console.log(err);
        }else if (stderr) {
            console.log(stderr);
        }else{
            // config istanbul ignore
            const ignore = require('istanbul-ignore-ts-__decorate');
            await ignore({folder: '../dist/'});
            console.log('typescript build ok');
            console.timeEnd('typescript build');
        }
    });
} catch (err) {
    console.log(err);
}
