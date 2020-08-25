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
class ModerationAction {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationAction.prototype, "id", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationAction.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], ModerationAction.prototype, "reason", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], ModerationAction.prototype, "date", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Object)
], ModerationAction.prototype, "untilUnbanned", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ModerationAction.prototype, "terminated", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], ModerationAction.prototype, "unlock", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Boolean)
], ModerationAction.prototype, "isEligibleForAppeal", void 0);
exports.ModerationAction = ModerationAction;
var terminated;
(function (terminated) {
    terminated[terminated["true"] = 1] = "true";
    terminated[terminated["false"] = 0] = "false";
})(terminated = exports.terminated || (exports.terminated = {}));

