"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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

