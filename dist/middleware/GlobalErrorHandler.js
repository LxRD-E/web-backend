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
const common_1 = require("@tsed/common");
let MyGEHMiddleware = class MyGEHMiddleware extends common_1.GlobalErrorHandlerMiddleware {
    use(error, request, response) {
        if (error && error.message && error.message === 'LogoutRequired' && request.accepts('html')) {
            return response.redirect('/');
        }
        try {
            console.error(error);
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
                if (request.accepts('json') && !request.accepts('html')) {
                    return response.status(400).json({ success: false, error: fullErrorMessage });
                }
                else {
                    return response.status(400).send(HttpError_1.ErrorTemplate('400: Bad Request', 'You or your browser sent an invalid request.')).end();
                }
            }
            else if (error.name === 'NOT_FOUND') {
                if (request.accepts('html')) {
                    return response.status(404).send(HttpError_1.ErrorTemplate('404: Not Found', 'The page you tried to view does not seem to exist.')).end();
                }
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
                return response.status(409).json({ success: false, error: fullErrorMessage });
            }
            else if (error.name === 'UNAUTHORIZED') {
                if (request.accepts('html')) {
                    response.redirect('/login');
                }
                else if (request.accepts('json')) {
                    let fullErrorMessage = {
                        code: 'LoginRequired',
                    };
                    if (error.message && HttpError_1.HttpErrors[error.message]) {
                        fullErrorMessage.code = error.message;
                    }
                    return response.status(401).json({ success: false, error: fullErrorMessage });
                }
                else {
                    return response.status(415).json({ success: false, error: { code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.InvalidAcceptHeader] } });
                }
            }
            else if (error.name === 'FORBIDDEN') {
                if (request.accepts('json')) {
                    let fullErrorMessage = {
                        code: 'CsrfValidationFailed',
                    };
                    if (error.message && HttpError_1.HttpErrors[error.message]) {
                        fullErrorMessage.code = error.message;
                    }
                    return response.status(403).json({ success: false, error: fullErrorMessage });
                }
                else {
                    return response.status(415).json({ success: false, error: { code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.InvalidAcceptHeader] } });
                }
            }
        }
        catch (e) {
            console.log(e);
        }
        if (request.accepts('json') && !request.accepts('html')) {
            return response.status(500).json({ success: false, message: 'An internal server error has ocurred.', error: { code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.InternalServerError] } });
        }
        if (request.accepts('html')) {
            return response.status(500).send(HttpError_1.ErrorTemplate('500: Internal Server Error', 'Hindi Gamer Club seems to be experiencing some issues right now. Please try again later.')).end();
        }
        else {
            return response.status(415).json({ success: false, error: { code: HttpError_1.HttpErrors[HttpError_1.HttpErrors.InvalidAcceptHeader] } });
        }
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

