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
var postDeleted;
(function (postDeleted) {
    postDeleted[postDeleted["false"] = 0] = "false";
    postDeleted[postDeleted["true"] = 1] = "true";
    postDeleted[postDeleted["moderated"] = 2] = "moderated";
})(postDeleted = exports.postDeleted || (exports.postDeleted = {}));
var threadDeleted;
(function (threadDeleted) {
    threadDeleted[threadDeleted["false"] = 0] = "false";
    threadDeleted[threadDeleted["true"] = 1] = "true";
    threadDeleted[threadDeleted["moderated"] = 2] = "moderated";
})(threadDeleted = exports.threadDeleted || (exports.threadDeleted = {}));
var threadLocked;
(function (threadLocked) {
    threadLocked[threadLocked["false"] = 0] = "false";
    threadLocked[threadLocked["true"] = 1] = "true";
})(threadLocked = exports.threadLocked || (exports.threadLocked = {}));
var threadPinned;
(function (threadPinned) {
    threadPinned[threadPinned["false"] = 0] = "false";
    threadPinned[threadPinned["true"] = 1] = "true";
})(threadPinned = exports.threadPinned || (exports.threadPinned = {}));
class PostSnippet {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], PostSnippet.prototype, "threadId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], PostSnippet.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], PostSnippet.prototype, "dateCreated", void 0);
exports.PostSnippet = PostSnippet;
class ForumThreadsAndPostsCount {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ForumThreadsAndPostsCount.prototype, "threads", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], ForumThreadsAndPostsCount.prototype, "posts", void 0);
exports.ForumThreadsAndPostsCount = ForumThreadsAndPostsCount;
class Thread {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "threadId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "categoryId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "subCategoryId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], Thread.prototype, "title", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], Thread.prototype, "dateCreated", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], Thread.prototype, "dateEdited", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "threadLocked", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "threadDeleted", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], Thread.prototype, "threadPinned", void 0);
exports.Thread = Thread;

