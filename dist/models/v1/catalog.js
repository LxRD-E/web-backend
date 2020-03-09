"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var category;
(function (category) {
    category[category["Hat"] = 1] = "Hat";
    category[category["Shirt"] = 2] = "Shirt";
    category[category["Pants"] = 3] = "Pants";
    category[category["Faces"] = 4] = "Faces";
    category[category["Gear"] = 5] = "Gear";
    category[category["Shoes"] = 6] = "Shoes";
    category[category["TShirt"] = 7] = "TShirt";
    category[category["GroupIcon"] = 8] = "GroupIcon";
    category[category["Head"] = 9] = "Head";
})(category = exports.category || (exports.category = {}));
var assetType;
(function (assetType) {
    assetType[assetType["Texture"] = 0] = "Texture";
    assetType[assetType["OBJ"] = 1] = "OBJ";
    assetType[assetType["MTL"] = 2] = "MTL";
})(assetType = exports.assetType || (exports.assetType = {}));
var collectible;
(function (collectible) {
    collectible[collectible["true"] = 1] = "true";
    collectible[collectible["false"] = 0] = "false";
})(collectible = exports.collectible || (exports.collectible = {}));
var isForSale;
(function (isForSale) {
    isForSale[isForSale["true"] = 1] = "true";
    isForSale[isForSale["false"] = 0] = "false";
})(isForSale = exports.isForSale || (exports.isForSale = {}));
var moderatorStatus;
(function (moderatorStatus) {
    moderatorStatus[moderatorStatus["Ready"] = 0] = "Ready";
    moderatorStatus[moderatorStatus["Pending"] = 1] = "Pending";
    moderatorStatus[moderatorStatus["Moderated"] = 2] = "Moderated";
})(moderatorStatus = exports.moderatorStatus || (exports.moderatorStatus = {}));
var searchCategory;
(function (searchCategory) {
    searchCategory[searchCategory["Featured"] = 10] = "Featured";
    searchCategory[searchCategory["Any"] = 11] = "Any";
    searchCategory[searchCategory["Collectibles"] = 20] = "Collectibles";
})(searchCategory = exports.searchCategory || (exports.searchCategory = {}));
var creatorType;
(function (creatorType) {
    creatorType[creatorType["User"] = 0] = "User";
    creatorType[creatorType["Group"] = 1] = "Group";
})(creatorType = exports.creatorType || (exports.creatorType = {}));
class LowestPriceCollectibleItems {
}
exports.LowestPriceCollectibleItems = LowestPriceCollectibleItems;

