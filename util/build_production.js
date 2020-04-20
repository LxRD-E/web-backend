const fs = require('fs-extra');
const real_fs = require('fs');
const cp = require('child_process');
var Iconv = require('iconv-lite');
// copy dist/

// confirm dist folder exists
try {
    fs.readdirSync('./dist_module/')
}catch{
    console.log('you must create the ./dist_module folder and add a repo to it');
    process.exit(1);
    // does not exist, so make it
}
// make dist folder if not exists
try {
    fs.readdirSync('./dist_module/dist/');
}catch{
    // does not exist, so make it
    fs.mkdirsSync('./dist_module/dist/');
}
// copy over config files
fs.copySync('./package.json', './dist_module/package.json');
fs.copySync('./package-lock.json', './dist_module/package-lock.json');
fs.copySync('./knexfile.js', './dist_module/knexfile.js');
fs.copySync('./.gitignore', './dist_module/.gitignore');
// copy migrations
fs.copySync('./migrations', './dist_module/migrations');
// copy env
fs.copySync('./env', './dist_module/env');
// copy tests
if (!fs.existsSync('./dist_module/tests')) {
    fs.mkdirSync('./dist_module/tests');
}
fs.copySync('./tests','./dist_module/tests');

// copy over dist dir
fs.copySync('./dist/','./dist_module/dist');
// Obfuscate Dist
const JavaScriptObfuscator = require('javascript-obfuscator');
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
for (const file of walk('./dist_module/dist')) {
    if (file.slice(file.length-2) !== 'js') {
        continue;
    }
    // dont obfusucate front-end
    if (file.slice(0,'./dist_module/dist/public/'.length) === './dist_module/dist/public/') {
        continue;
    }
    // idk why but this file breaks it (not too important anyway so we can just skip it)
    if (file === './dist_module/dist/models/v1/game.js') {
        continue;
    }
    console.log('Obfuscating ' + file + '...');
    let fileBuff = fs.readFileSync(file);
    let obj = JavaScriptObfuscator.obfuscate(fileBuff.toString(), {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.4,
        debugProtection: false,
        debugProtectionInterval: false,
        disableConsoleOutput: false,
        domainLock: [],
        identifierNamesGenerator: 'hexadecimal',
        identifiersDictionary: [],
        identifiersPrefix: '',
        inputFileName: '',
        log: false,
        renameGlobals: false,
        reservedNames: [],
        reservedStrings: [],
        rotateStringArray: true,
        seed: 0,
        selfDefending: false,
        shuffleStringArray: true,
        sourceMap: false,
        sourceMapBaseUrl: '',
        sourceMapFileName: '',
        sourceMapMode: 'separate',
        splitStrings: true,
        splitStringsChunkLength: 10,
        stringArray: true,
        stringArrayEncoding: 'base64',
        stringArrayThreshold: 0.75,
        target: 'node',
        transformObjectKeys: false,
        unicodeEscapeSequence: false
    });
    // console.log(obj.getObfuscatedCode());
    let code = `/* Copyright 2019-${new Date().getFullYear()} BlocksHub.net - All rights reserved. */\n\n`+obj.getObfuscatedCode();
    fs.writeFileSync(file, code);
}
// add self xss warning
fs.writeFileSync('./dist_module/dist/public/js/warning.js', `console.log("%cStop!", "color:red; font-size:80px;font-family:sans-serif;");console.log("%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or \\"hack\\", it is a scam and will give them access to your account.", "color:black;font-size:25px;font-family:sans-serif;");`);
// edit gitignore
let ignore = fs.readFileSync('./dist_module/.gitignore').toString();
if (ignore.match(/\/dist\//g)) {
    ignore = ignore.replace(/\/dist\/.+/g, '');

    // idk why but if i try to remove line breaks then git ignores the .gitignore file, so just leave them for now since they dont cause any harm anyway
    // ignore = ignore.replace(/^\s*$(?:\r\n?|\n)/gm, '');
    const newGitIgnore = Iconv.encode(ignore, 'utf8');
    real_fs.writeFileSync('./dist_module/.gitignore', newGitIgnore)
}
try {
    const res = cp.execSync('ssh-agent bash -c \'ssh-add C:\\Users\\buizel\\.ssh\\cid_rsa; cd ./dist_module & git config core.ignorecase false & git -C ./dist_module add . & git -C ./dist_module commit -m "update dist" & git -C ./dist_module push');
    // cp.execSync('ssh-agent bash -c \'ssh-add C:\\Users\\buizel\\.ssh\\cid_rsa; git config core.ignorecase false & git add . & git commit -m "do something" & git push');
    // console.log(res.toString());
    // console.log('deployed.');
}catch(e) {
    console.error(e);
}
// const d = cp.execSync('dir');
// ok