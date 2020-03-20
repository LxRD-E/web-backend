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
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
class OGInfoEntry {
}
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], OGInfoEntry.prototype, "thumbnailUrl", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], OGInfoEntry.prototype, "description", void 0);
__decorate([
    common_1.PropertyType(String),
    __metadata("design:type", String)
], OGInfoEntry.prototype, "title", void 0);
class MultiGetOgInfoResponse {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], MultiGetOgInfoResponse.prototype, "statusId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], MultiGetOgInfoResponse.prototype, "url", void 0);
__decorate([
    common_1.Required(),
    swagger_1.Description('Note that all fields here are optional; this can be an empty object'),
    __metadata("design:type", OGInfoEntry)
], MultiGetOgInfoResponse.prototype, "ogInfo", void 0);
exports.MultiGetOgInfoResponse = MultiGetOgInfoResponse;

