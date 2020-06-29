"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const thread_1 = require("../thread");
const sync = {
    resizeImage: async (workerDataParams) => {
        let workerData = workerDataParams || this.workerData;
        const jimp = require('jimp');
        let image = workerData.image;
        let loaded = await jimp.create(Buffer.from(image.data));
        loaded.cover(640, 360);
        loaded.quality(25);
        let newBuffer = await loaded.getBufferAsync(image.contentType);
        return {
            type: image.contentType,
            image: newBuffer,
        };
    },
};
exports.sync = sync;
const async = {
    resizeImage: async (imageData, contentType) => {
        let results = await thread_1.ThreadPool.exec({
            task: sync.resizeImage,
            workerData: {
                image: {
                    data: imageData,
                    contentType: contentType,
                },
            },
        });
        if (!Buffer.isBuffer(results.image)) {
            results.image = Buffer.from(results.image);
        }
        return results;
    },
};
exports.async = async;

