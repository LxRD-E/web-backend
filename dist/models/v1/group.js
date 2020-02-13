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
class groupPermissions {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupPermissions.prototype, "getWall", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupPermissions.prototype, "postWall", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupPermissions.prototype, "getShout", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupPermissions.prototype, "postShout", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupPermissions.prototype, "manage", void 0);
exports.groupPermissions = groupPermissions;
class groupDetails {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupDetails.prototype, "groupId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], groupDetails.prototype, "groupName", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], groupDetails.prototype, "groupDescription", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupDetails.prototype, "groupOwnerUserId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupDetails.prototype, "groupIconCatalogId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupDetails.prototype, "groupMemberCount", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], groupDetails.prototype, "groupStatus", void 0);
exports.groupDetails = groupDetails;
class MultiGetNames {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], MultiGetNames.prototype, "groupId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], MultiGetNames.prototype, "catalogName", void 0);
exports.MultiGetNames = MultiGetNames;
class roleInfo {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], roleInfo.prototype, "roleSetId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], roleInfo.prototype, "name", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], roleInfo.prototype, "description", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], roleInfo.prototype, "groupId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], roleInfo.prototype, "rank", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", groupPermissions)
], roleInfo.prototype, "permissions", void 0);
exports.roleInfo = roleInfo;
var groupStatus;
(function (groupStatus) {
    groupStatus[groupStatus["locked"] = 1] = "locked";
    groupStatus[groupStatus["ok"] = 0] = "ok";
})(groupStatus = exports.groupStatus || (exports.groupStatus = {}));

