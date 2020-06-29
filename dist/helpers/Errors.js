"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_httpexceptions_1 = require("ts-httpexceptions");
const HttpError_1 = require("./HttpError");
class TSErrorsBase {
    constructor() {
        this.NotFound = ts_httpexceptions_1.NotFound;
        this.BadRequest = ts_httpexceptions_1.BadRequest;
        this.Conflict = ts_httpexceptions_1.Conflict;
        this.Unauthorized = ts_httpexceptions_1.Unauthorized;
        this.ServiceUnavailable = ts_httpexceptions_1.ServiceUnvailable;
        this.errors = HttpError_1.HttpErrors;
    }
}
exports.default = TSErrorsBase;

