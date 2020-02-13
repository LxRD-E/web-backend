"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterOffset = (offset) => {
    if (offset === null || offset === undefined) {
        return 0;
    }
    if (typeof offset !== "number") {
        offset = parseInt(offset, 10);
    }
    if (isNaN(offset)) {
        return 0;
    }
    if (offset < 0) {
        return 0;
    }
    return offset;
};
exports.filterLimit = (limit) => {
    if (limit === null || limit === undefined) {
        return 25;
    }
    if (typeof limit !== "number") {
        limit = parseInt(limit, 10);
    }
    if (isNaN(limit)) {
        return 25;
    }
    if (limit < 0 || limit > 25) {
        return 25;
    }
    return limit;
};
exports.filterId = (id) => {
    if (id === null || id === undefined) {
        return false;
    }
    if (typeof id !== "number") {
        id = parseInt(id, 10);
    }
    if (id < 1 || id > 4294967295) {
        return false;
    }
    if (isNaN(id)) {
        return false;
    }
    return id;
};
exports.filterSort = (order) => {
    if (order && order.toLowerCase() === "desc") {
        return "desc";
    }
    return "asc";
};
exports.urlEncode = (string) => {
    if (!string) {
        return "unnamed";
    }
    string = string.replace(/\s| /g, '-');
    string = string.replace(/[^a-zA-Z\d-]+/g, '');
    string = string.replace(/--/g, '-');
    if (!string) {
        return "unnamed";
    }
    return string;
};
exports.filterRGB = (array) => {
    if (array && typeof array === "object") {
        if (array.length > 3) {
            return false;
        }
        let OK = true;
        array.forEach((num, index, arrayObj) => {
            if (typeof num !== "number") {
                OK = false;
            }
            else {
                if (num > 255 || num < 0) {
                    OK = false;
                }
                else {
                    arrayObj[index] = num / 255;
                }
            }
        });
        if (!OK) {
            return false;
        }
        return array;
    }
    else {
        return false;
    }
};
exports.numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

