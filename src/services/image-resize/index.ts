import axios from "axios";
import {
    IResizedImage,
    IResizeImageData,
    IImageResponse,
} from './model'

import {ThreadPool} from '../thread';

/**
 * Non-threaded methods. Mostly used internally by worker threads.
 */
const sync = {
    resizeImage: async (workerDataParams?: IResizeImageData): Promise<IResizedImage> =>{
        // @ts-ignore
        let workerData: IResizeImageData = workerDataParams || this.workerData;
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
}

/**
 * Methods that run off of a dynamic thread pool
 */
const async = {
    resizeImage: async (imageData: Uint8Array, contentType: string): Promise<IResizedImage> => {
        let results = await ThreadPool.exec({
            task: sync.resizeImage,
            workerData: {
                image: {
                    data: imageData,
                    contentType: contentType,
                },
            },
        });
        if (!Buffer.isBuffer(results.image)) {
            results.image = Buffer.from(results.image as Uint8Array);
        }
        return results;
    },
}

export {
    async,
    sync,
}