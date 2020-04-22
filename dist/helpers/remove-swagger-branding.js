"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const fs = require("fs");
exports.default = () => {
    let pathToSwagger = path.join(__dirname, '../../node_modules/@tsed/swagger/views/index.ejs');
    if (!fs.existsSync(pathToSwagger)) {
        console.warn('swagger view, index.ejs, does not exist, so it will not be edited. check to see if lib was updated.');
    }
    else {
        let fileData = fs.readFileSync(pathToSwagger).toString();
        fileData = fileData
            .replace(/<link rel="icon" type="image\/png" href=".\/favicon-32x32.png" sizes="32x32"\/>/g, '<link rel="icon" type="image/png" sizes="32x32" href="/img/favicon.png">')
            .replace(/<link rel="icon" type="image\/png" href=".\/favicon-16x16.png" sizes="16x16"\/>/g, '')
            .replace(/<title>(.+)<\/title>/g, '<title>BlocksHub API</title>');
        fs.writeFileSync(pathToSwagger, fileData);
    }
};

