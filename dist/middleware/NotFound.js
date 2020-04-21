"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const Express = require("express");
const HttpError_1 = require("../helpers/HttpError");
let NotFoundMiddleware = class NotFoundMiddleware {
    use(request, response) {
        if (request.accepts('html')) {
            response.status(404).send(HttpError_1.ErrorTemplate('404: Page Not Found', 'The page you tried to visit does not exist. Please go back and try again.')).end();
        }
        else {
            response.status(404).json({ success: false, error: { code: 'NotFound' } });
        }
    }
};
__decorate([
    __param(0, common_1.Req()),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotFoundMiddleware.prototype, "use", null);
NotFoundMiddleware = __decorate([
    common_1.Middleware()
], NotFoundMiddleware);
exports.NotFoundMiddleware = NotFoundMiddleware;
//# sourceMappingURL=NotFound.js.map