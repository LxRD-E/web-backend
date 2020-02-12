/**
 * Imports
 */

/**
 * Convert a potential NaN to a valid offset. If the offset is invalid, 0 will be returned. Otherwise, the number is returned.
 * @param offset Essentially any
 */
export const filterOffset = (offset: string|number|null|undefined): number => {
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
}

/**
 * Filter a limit so that it returns a valid value. Defaults to 25 if invalid limit is provided
 * @param limit Essentially any
 */
export const filterLimit = (limit: string|number|null|undefined): number => {
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
}

/**
 * Generic ID filter for filtering unsigned ints, such as Catalog IDs or User IDs. Throws if invalid
 * @param req Request
 * @param id ID
 */
export const filterId = (id: string|number|null|undefined): number|boolean => {
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
}

/**
 * Filter a DESC or ASC sort
 * @param order DESC | ASC | Undefined
 */
export const filterSort = (order: string|undefined): 'asc'|'desc' => {
    if (order && order.toLowerCase() === "desc") {
        return "desc";
    }
    return "asc";
}

/**
 * URL-Encode a String
 * @param string String to Encode
 */
export const urlEncode = (string: string|undefined): string => {
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
}

/**
 * Filter RGB
 */
export const filterRGB = (array: Array<number>): Array<number>|boolean => {
    if (array && typeof array === "object") {
        if (array.length > 3) {
            return false;
        }
        let OK = true;
        array.forEach((num: unknown, index: number, arrayObj) => {
            if (typeof num !== "number") {
                OK = false;
            }else{
                if (num > 255 || num < 0) {
                    OK = false;
                }else{
                    arrayObj[index] = num/255;
                }
            }
        });
        if (!OK) {
            return false;
        }
        return array;
    }else{
        return false;
    }
}
/**
 * Add Commas to Number
 */
export const numberWithCommas = (x: number): string => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}