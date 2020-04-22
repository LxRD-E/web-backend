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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
let AuthUserFilter = class AuthUserFilter {
    transform(expression, request, response) {
        console.log('transform expression called');
        console.log(expression);
        return request.authUser;
    }
};
AuthUserFilter = __decorate([
    common_1.Filter()
], AuthUserFilter);
exports.AuthUserFilter = AuthUserFilter;
function AuthUser() {
    console.log('paramregistry.decorate');
    return common_1.ParamRegistry.decorate(AuthUserFilter);
}
exports.AuthUser = AuthUser;

