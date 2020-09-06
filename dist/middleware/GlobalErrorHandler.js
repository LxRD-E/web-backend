"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const HttpError_1 = require("../helpers/HttpError");
const Sentry = require("../helpers/sentry");
const logError = (status, code, path, method) => {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    return console.log('[' + method.toUpperCase() + '] ' + path + ' [' + status.toString() + '] - ' + code);
};
const common_1 = require("@tsed/common");
let MyGEHMiddleware = class MyGEHMiddleware extends common_1.GlobalErrorHandlerMiddleware {
    use(error, request, response) {
        if (error && error.message && error.message === 'LogoutRequired' && request.accepts('html')) {
            logError(302, 'LogoutRequired', request.originalUrl, request.method);
            return response.redirect('/');
        }
        try {
            if (error.name === 'BAD_REQUEST') {
                let fullErrorMessage;
                if (error.errorMessage) {
                    fullErrorMessage = {
                        location: error.requestType,
                        message: error.errorMessage.replace(/\n/g, ' '),
                        code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.SchemaValidationFailed],
                    };
                }
                else {
                    fullErrorMessage = {
                        code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.SchemaValidationFailed],
                    };
                }
                if (error.message && HttpError_1.HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                logError(400, error.message, request.originalUrl, request.method);
                if (request.accepts('json') && !request.accepts('html')) {
                    return response.status(400).json({ success: false, error: fullErrorMessage });
                }
                else {
                    if (process.env.NODE_ENV === 'development') {
                        return response.status(400).set('content-type', 'text/plain').send(error.stack).end();
                    }
                    return response.status(400).json({ success: false, error: fullErrorMessage });
                }
            }
            else if (error.name === 'NOT_FOUND') {
                logError(404, 'NOT_FOUND', request.originalUrl, request.method);
                if (error.message && HttpError_1.HttpErrors[error.message]) {
                    return response.status(404).json({ success: false, error: { code: error.message } });
                }
                return response.status(404).json({ success: false, error: { code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.PageNotFound] } });
            }
            else if (error.name === 'CONFLICT') {
                let fullErrorMessage = {
                    code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.InternalServerError],
                };
                if (error.message && HttpError_1.HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                logError(409, fullErrorMessage.code, request.originalUrl, request.method);
                return response.status(409).json({ success: false, error: fullErrorMessage });
            }
            else if (error.name === 'UNAUTHORIZED') {
                if (error.message === 'AccountBanned') {
                    return response.status(401).json({
                        success: false,
                        error: {
                            code: 'AccountBanned',
                        }
                    });
                }
                let fullErrorMessage = {
                    code: 'LoginRequired',
                };
                if (error.message && HttpError_1.HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                logError(401, fullErrorMessage.code, request.originalUrl, request.method);
                return response.status(401).json({ success: false, error: fullErrorMessage });
            }
            else if (error.name === 'FORBIDDEN') {
                let fullErrorMessage = {
                    code: 'CsrfValidationFailed',
                };
                if (error.message && HttpError_1.HttpErrors[error.message]) {
                    fullErrorMessage.code = error.message;
                }
                return response.status(403).json({ success: false, error: fullErrorMessage });
            }
            else {
                throw error;
            }
        }
        catch (e) {
            console.error(e);
            if (Sentry.isEnabled()) {
                Sentry.Sentry.captureException(e);
            }
        }
        return response.status(500).json({ success: false, message: 'An internal server error has occurred.', error: { code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.InternalServerError] } });
    }
};
__decorate([
    __param(0, common_1.Err()), __param(1, common_1.Req()), __param(2, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Object)
], MyGEHMiddleware.prototype, "use", null);
MyGEHMiddleware = __decorate([
    common_1.OverrideProvider(common_1.GlobalErrorHandlerMiddleware)
], MyGEHMiddleware);
exports.MyGEHMiddleware = MyGEHMiddleware;

