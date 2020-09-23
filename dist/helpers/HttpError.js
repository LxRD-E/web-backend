"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HttpErrors;
(function (HttpErrors) {
    HttpErrors[HttpErrors["InternalServerError"] = 0] = "InternalServerError";
    HttpErrors[HttpErrors["InvalidAcceptHeader"] = 1] = "InvalidAcceptHeader";
    HttpErrors[HttpErrors["SchemaValidationFailed"] = 2] = "SchemaValidationFailed";
    HttpErrors[HttpErrors["InvalidPagingCursor"] = 3] = "InvalidPagingCursor";
    HttpErrors[HttpErrors["InvalidPagingLimit"] = 4] = "InvalidPagingLimit";
    HttpErrors[HttpErrors["InvalidPagingOffset"] = 5] = "InvalidPagingOffset";
    HttpErrors[HttpErrors["PageNotFound"] = 6] = "PageNotFound";
    HttpErrors[HttpErrors["LogoutRequired"] = 7] = "LogoutRequired";
    HttpErrors[HttpErrors["InvalidUsernameOrPassword"] = 8] = "InvalidUsernameOrPassword";
    HttpErrors[HttpErrors["LoginRequired"] = 9] = "LoginRequired";
    HttpErrors[HttpErrors["CSRFValidationFailed"] = 10] = "CSRFValidationFailed";
    HttpErrors[HttpErrors["InvalidBirthDate"] = 11] = "InvalidBirthDate";
    HttpErrors[HttpErrors["InvalidUsername"] = 12] = "InvalidUsername";
    HttpErrors[HttpErrors["InvalidPassword"] = 13] = "InvalidPassword";
    HttpErrors[HttpErrors["UsernameConstraint1Space1Period1Underscore"] = 14] = "UsernameConstraint1Space1Period1Underscore";
    HttpErrors[HttpErrors["UsernameConstriantCannotEndOrStartWithSpace"] = 15] = "UsernameConstriantCannotEndOrStartWithSpace";
    HttpErrors[HttpErrors["UsernameConstraintInvalidCharacters"] = 16] = "UsernameConstraintInvalidCharacters";
    HttpErrors[HttpErrors["UsernameConstraintTooLong"] = 17] = "UsernameConstraintTooLong";
    HttpErrors[HttpErrors["UsernameConstrintTooShort"] = 18] = "UsernameConstrintTooShort";
    HttpErrors[HttpErrors["OneAccountPerIP"] = 19] = "OneAccountPerIP";
    HttpErrors[HttpErrors["InvalidSort"] = 20] = "InvalidSort";
    HttpErrors[HttpErrors["TooManyIds"] = 21] = "TooManyIds";
    HttpErrors[HttpErrors["InvalidIds"] = 22] = "InvalidIds";
    HttpErrors[HttpErrors["CannotSendRequest"] = 23] = "CannotSendRequest";
    HttpErrors[HttpErrors["NoPendingRequest"] = 24] = "NoPendingRequest";
    HttpErrors[HttpErrors["InvalidPrice"] = 25] = "InvalidPrice";
    HttpErrors[HttpErrors["CannotBeSold"] = 26] = "CannotBeSold";
    HttpErrors[HttpErrors["InvalidTradeType"] = 27] = "InvalidTradeType";
    HttpErrors[HttpErrors["TooManyPendingTrades"] = 28] = "TooManyPendingTrades";
    HttpErrors[HttpErrors["InvalidItemsSpecified"] = 29] = "InvalidItemsSpecified";
    HttpErrors[HttpErrors["CannotTradeWithUser"] = 30] = "CannotTradeWithUser";
    HttpErrors[HttpErrors["NotEnoughCurrency"] = 31] = "NotEnoughCurrency";
    HttpErrors[HttpErrors["InvalidAmount"] = 32] = "InvalidAmount";
    HttpErrors[HttpErrors["InvalidCurrency"] = 33] = "InvalidCurrency";
    HttpErrors[HttpErrors["InvalidCatalogId"] = 34] = "InvalidCatalogId";
    HttpErrors[HttpErrors["NoLongerForSale"] = 35] = "NoLongerForSale";
    HttpErrors[HttpErrors["SellerHasChanged"] = 36] = "SellerHasChanged";
    HttpErrors[HttpErrors["PriceHasChanged"] = 37] = "PriceHasChanged";
    HttpErrors[HttpErrors["CurrencyHasChanged"] = 38] = "CurrencyHasChanged";
    HttpErrors[HttpErrors["AlreadyOwns"] = 39] = "AlreadyOwns";
    HttpErrors[HttpErrors["InvalidCurrencySpecified"] = 40] = "InvalidCurrencySpecified";
    HttpErrors[HttpErrors["ItemStillForSale"] = 41] = "ItemStillForSale";
    HttpErrors[HttpErrors["InvalidUserInventoryId"] = 42] = "InvalidUserInventoryId";
    HttpErrors[HttpErrors["ItemNoLongerForSale"] = 43] = "ItemNoLongerForSale";
    HttpErrors[HttpErrors["InvalidUserId"] = 44] = "InvalidUserId";
    HttpErrors[HttpErrors["InvalidTradeId"] = 45] = "InvalidTradeId";
    HttpErrors[HttpErrors["InvalidPartnerId"] = 46] = "InvalidPartnerId";
    HttpErrors[HttpErrors["OneOrMoreItemsNotAvailable"] = 47] = "OneOrMoreItemsNotAvailable";
    HttpErrors[HttpErrors["InvalidCatalogIds"] = 48] = "InvalidCatalogIds";
    HttpErrors[HttpErrors["AvatarCooldown"] = 49] = "AvatarCooldown";
    HttpErrors[HttpErrors["NoUpdates"] = 50] = "NoUpdates";
    HttpErrors[HttpErrors["InvalidCurrencyProductId"] = 51] = "InvalidCurrencyProductId";
    HttpErrors[HttpErrors["EmailVerificationRequired"] = 52] = "EmailVerificationRequired";
    HttpErrors[HttpErrors["BlurbTooLarge"] = 53] = "BlurbTooLarge";
    HttpErrors[HttpErrors["InvalidOldPassword"] = 54] = "InvalidOldPassword";
    HttpErrors[HttpErrors["InalidPassword"] = 55] = "InalidPassword";
    HttpErrors[HttpErrors["InvalidCode"] = 56] = "InvalidCode";
    HttpErrors[HttpErrors["FloodCheck"] = 57] = "FloodCheck";
    HttpErrors[HttpErrors["InvalidEmail"] = 58] = "InvalidEmail";
    HttpErrors[HttpErrors["InvalidTheme"] = 59] = "InvalidTheme";
    HttpErrors[HttpErrors["InvalidOption"] = 60] = "InvalidOption";
    HttpErrors[HttpErrors["CaptchaValidationFailed"] = 61] = "CaptchaValidationFailed";
    HttpErrors[HttpErrors["InvalidGroupId"] = 62] = "InvalidGroupId";
    HttpErrors[HttpErrors["InvalidRolesetId"] = 63] = "InvalidRolesetId";
    HttpErrors[HttpErrors["InvalidGroupPermissions"] = 64] = "InvalidGroupPermissions";
    HttpErrors[HttpErrors["InvalidWallPost"] = 65] = "InvalidWallPost";
    HttpErrors[HttpErrors["AlreadyGroupMember"] = 66] = "AlreadyGroupMember";
    HttpErrors[HttpErrors["TooManyGroups"] = 67] = "TooManyGroups";
    HttpErrors[HttpErrors["InvalidGroupRank"] = 68] = "InvalidGroupRank";
    HttpErrors[HttpErrors["InvalidRolesetName"] = 69] = "InvalidRolesetName";
    HttpErrors[HttpErrors["InvalidRolesetDescription"] = 70] = "InvalidRolesetDescription";
    HttpErrors[HttpErrors["InvalidRolesetPermissions"] = 71] = "InvalidRolesetPermissions";
    HttpErrors[HttpErrors["RankIdIsTaken"] = 72] = "RankIdIsTaken";
    HttpErrors[HttpErrors["TooManyRolesets"] = 73] = "TooManyRolesets";
    HttpErrors[HttpErrors["RolesetHasMembers"] = 74] = "RolesetHasMembers";
    HttpErrors[HttpErrors["CannotDeleteFirstRoleInGroup"] = 75] = "CannotDeleteFirstRoleInGroup";
    HttpErrors[HttpErrors["UserNotInGroup"] = 76] = "UserNotInGroup";
    HttpErrors[HttpErrors["CannotRankUser"] = 77] = "CannotRankUser";
    HttpErrors[HttpErrors["ShoutCooldown"] = 78] = "ShoutCooldown";
    HttpErrors[HttpErrors["InvalidFileType"] = 79] = "InvalidFileType";
    HttpErrors[HttpErrors["InvalidGroupName"] = 80] = "InvalidGroupName";
    HttpErrors[HttpErrors["InvalidGroupDescription"] = 81] = "InvalidGroupDescription";
    HttpErrors[HttpErrors["GroupNameTaken"] = 82] = "GroupNameTaken";
    HttpErrors[HttpErrors["InvalidReason"] = 83] = "InvalidReason";
    HttpErrors[HttpErrors["InvalidLengthType"] = 84] = "InvalidLengthType";
    HttpErrors[HttpErrors["InvalidPrivateReason"] = 85] = "InvalidPrivateReason";
    HttpErrors[HttpErrors["ConstraintIfDeletedUserMustAlsoBeTerminated"] = 86] = "ConstraintIfDeletedUserMustAlsoBeTerminated";
    HttpErrors[HttpErrors["CommentTooLarge"] = 87] = "CommentTooLarge";
    HttpErrors[HttpErrors["InvalidCurrencyAmount"] = 88] = "InvalidCurrencyAmount";
    HttpErrors[HttpErrors["InvalidCatalogIdOrState"] = 89] = "InvalidCatalogIdOrState";
    HttpErrors[HttpErrors["InvalidBannerText"] = 90] = "InvalidBannerText";
    HttpErrors[HttpErrors["InvalidRank"] = 91] = "InvalidRank";
    HttpErrors[HttpErrors["RankCannotBeAboveCurrentUser"] = 92] = "RankCannotBeAboveCurrentUser";
    HttpErrors[HttpErrors["InvalidSubCategoryId"] = 93] = "InvalidSubCategoryId";
    HttpErrors[HttpErrors["InvalidTitle"] = 94] = "InvalidTitle";
    HttpErrors[HttpErrors["InvalidBody"] = 95] = "InvalidBody";
    HttpErrors[HttpErrors["ThreadLocked"] = 96] = "ThreadLocked";
    HttpErrors[HttpErrors["InvalidPinnedState"] = 97] = "InvalidPinnedState";
    HttpErrors[HttpErrors["InvalidLockedState"] = 98] = "InvalidLockedState";
    HttpErrors[HttpErrors["InvalidPostId"] = 99] = "InvalidPostId";
    HttpErrors[HttpErrors["InvalidCatalogName"] = 100] = "InvalidCatalogName";
    HttpErrors[HttpErrors["InvalidModerationStatus"] = 101] = "InvalidModerationStatus";
    HttpErrors[HttpErrors["InvalidCatalogDescription"] = 102] = "InvalidCatalogDescription";
    HttpErrors[HttpErrors["InvalidIsForSaleOption"] = 103] = "InvalidIsForSaleOption";
    HttpErrors[HttpErrors["ConstraintPriceTooHigh"] = 104] = "ConstraintPriceTooHigh";
    HttpErrors[HttpErrors["InvalidCollectibleState"] = 105] = "InvalidCollectibleState";
    HttpErrors[HttpErrors["InvalidComment"] = 106] = "InvalidComment";
    HttpErrors[HttpErrors["NoFileSpecified"] = 107] = "NoFileSpecified";
    HttpErrors[HttpErrors["InvalidOBJSpecified"] = 108] = "InvalidOBJSpecified";
    HttpErrors[HttpErrors["InvalidMTLSpecified"] = 109] = "InvalidMTLSpecified";
    HttpErrors[HttpErrors["InvalidRGBArray"] = 110] = "InvalidRGBArray";
    HttpErrors[HttpErrors["InvalidTokenOrSecret"] = 111] = "InvalidTokenOrSecret";
    HttpErrors[HttpErrors["TwoFactorAlreadyEnabled"] = 112] = "TwoFactorAlreadyEnabled";
    HttpErrors[HttpErrors["TooManyRequests"] = 113] = "TooManyRequests";
    HttpErrors[HttpErrors["InvalidTwoFactorCode"] = 114] = "InvalidTwoFactorCode";
    HttpErrors[HttpErrors["TwoStepVerificationRequired"] = 115] = "TwoStepVerificationRequired";
    HttpErrors[HttpErrors["TwoStepRequiredVerificationFailed"] = 116] = "TwoStepRequiredVerificationFailed";
    HttpErrors[HttpErrors["NoAdvertisementAvailable"] = 117] = "NoAdvertisementAvailable";
    HttpErrors[HttpErrors["InvalidAdId"] = 118] = "InvalidAdId";
    HttpErrors[HttpErrors["InvalidAdType"] = 119] = "InvalidAdType";
    HttpErrors[HttpErrors["InvalidAdTitle"] = 120] = "InvalidAdTitle";
    HttpErrors[HttpErrors["ModerationStatusConflict"] = 121] = "ModerationStatusConflict";
    HttpErrors[HttpErrors["InvalidPermissions"] = 122] = "InvalidPermissions";
    HttpErrors[HttpErrors["TicketStatusDoesNotAllowReply"] = 123] = "TicketStatusDoesNotAllowReply";
    HttpErrors[HttpErrors["InvalidGameId"] = 124] = "InvalidGameId";
    HttpErrors[HttpErrors["InvalidGameState"] = 125] = "InvalidGameState";
    HttpErrors[HttpErrors["InvalidScriptId"] = 126] = "InvalidScriptId";
    HttpErrors[HttpErrors["TooManyScripts"] = 127] = "TooManyScripts";
    HttpErrors[HttpErrors["InvalidMaxPlayers"] = 128] = "InvalidMaxPlayers";
    HttpErrors[HttpErrors["InvalidNameOrDescription"] = 129] = "InvalidNameOrDescription";
    HttpErrors[HttpErrors["TooManyGames"] = 130] = "TooManyGames";
    HttpErrors[HttpErrors["TwoFactorCodeExpired"] = 131] = "TwoFactorCodeExpired";
    HttpErrors[HttpErrors["TwoFactorNotRequired"] = 132] = "TwoFactorNotRequired";
    HttpErrors[HttpErrors["InvalidAdDisplayType"] = 133] = "InvalidAdDisplayType";
    HttpErrors[HttpErrors["AuthenticationServiceConstraintHTTPSRequired"] = 134] = "AuthenticationServiceConstraintHTTPSRequired";
    HttpErrors[HttpErrors["AuthenticationServiceBlacklisted"] = 135] = "AuthenticationServiceBlacklisted";
    HttpErrors[HttpErrors["InvalidReturnUrl"] = 136] = "InvalidReturnUrl";
    HttpErrors[HttpErrors["InvalidApprovalStatus"] = 137] = "InvalidApprovalStatus";
    HttpErrors[HttpErrors["GroupJoinRequestPending"] = 138] = "GroupJoinRequestPending";
    HttpErrors[HttpErrors["InvalidJoinRequest"] = 139] = "InvalidJoinRequest";
    HttpErrors[HttpErrors["UserAlreadyInGroup"] = 140] = "UserAlreadyInGroup";
    HttpErrors[HttpErrors["Cooldown"] = 141] = "Cooldown";
    HttpErrors[HttpErrors["InvalidStatus"] = 142] = "InvalidStatus";
    HttpErrors[HttpErrors["RankAlreadyExists"] = 143] = "RankAlreadyExists";
    HttpErrors[HttpErrors["InvalidGenre"] = 144] = "InvalidGenre";
    HttpErrors[HttpErrors["ConstraintEmailVerificationRequired"] = 145] = "ConstraintEmailVerificationRequired";
    HttpErrors[HttpErrors["EmailAlreadyInUse"] = 146] = "EmailAlreadyInUse";
    HttpErrors[HttpErrors["MaximumOutfitsReached"] = 147] = "MaximumOutfitsReached";
    HttpErrors[HttpErrors["AvatarRenderRequired"] = 148] = "AvatarRenderRequired";
    HttpErrors[HttpErrors["InvalidOutfitId"] = 149] = "InvalidOutfitId";
    HttpErrors[HttpErrors["InvalidStatusId"] = 150] = "InvalidStatusId";
    HttpErrors[HttpErrors["InvalidReactionType"] = 151] = "InvalidReactionType";
    HttpErrors[HttpErrors["AlreadyReactedToStatus"] = 152] = "AlreadyReactedToStatus";
    HttpErrors[HttpErrors["NotReactedToStatus"] = 153] = "NotReactedToStatus";
    HttpErrors[HttpErrors["InvalidGroupStatus"] = 154] = "InvalidGroupStatus";
    HttpErrors[HttpErrors["InvalidReportReason"] = 155] = "InvalidReportReason";
    HttpErrors[HttpErrors["SearchQueryTooLarge"] = 156] = "SearchQueryTooLarge";
    HttpErrors[HttpErrors["NoEmailAttached"] = 157] = "NoEmailAttached";
    HttpErrors[HttpErrors["EmailAlreadyVerified"] = 158] = "EmailAlreadyVerified";
    HttpErrors[HttpErrors["InvalidCreatorType"] = 159] = "InvalidCreatorType";
    HttpErrors[HttpErrors["UserCannotBeTradedWith"] = 160] = "UserCannotBeTradedWith";
    HttpErrors[HttpErrors["InvalidCommentId"] = 161] = "InvalidCommentId";
    HttpErrors[HttpErrors["ItemCannotBeDeleted"] = 162] = "ItemCannotBeDeleted";
    HttpErrors[HttpErrors["NotEnoughPrimaryCurrencyForOffer"] = 163] = "NotEnoughPrimaryCurrencyForOffer";
    HttpErrors[HttpErrors["TradeCannotBeCompleted"] = 164] = "TradeCannotBeCompleted";
    HttpErrors[HttpErrors["GameDeveloperPermissionsRequired"] = 165] = "GameDeveloperPermissionsRequired";
    HttpErrors[HttpErrors["CannotPurchaseOwnedPosition"] = 166] = "CannotPurchaseOwnedPosition";
    HttpErrors[HttpErrors["NotEnoughInPositionBalance"] = 167] = "NotEnoughInPositionBalance";
    HttpErrors[HttpErrors["PurchaseAmountTooLow"] = 168] = "PurchaseAmountTooLow";
    HttpErrors[HttpErrors["ReachedMaximumOpenPositions"] = 169] = "ReachedMaximumOpenPositions";
    HttpErrors[HttpErrors["RateTooSmall"] = 170] = "RateTooSmall";
    HttpErrors[HttpErrors["RateTooLarge"] = 171] = "RateTooLarge";
    HttpErrors[HttpErrors["UserIsNotOwnerOfPosition"] = 172] = "UserIsNotOwnerOfPosition";
    HttpErrors[HttpErrors["PositionAlreadyClosed"] = 173] = "PositionAlreadyClosed";
    HttpErrors[HttpErrors["BalanceTooSmall"] = 174] = "BalanceTooSmall";
    HttpErrors[HttpErrors["InvalidPurchaseAmount"] = 175] = "InvalidPurchaseAmount";
    HttpErrors[HttpErrors["PositionNoLongerAvailable"] = 176] = "PositionNoLongerAvailable";
    HttpErrors[HttpErrors["InvalidReferralId"] = 177] = "InvalidReferralId";
    HttpErrors[HttpErrors["ReferralAlreadyExists"] = 178] = "ReferralAlreadyExists";
    HttpErrors[HttpErrors["NotFound"] = 179] = "NotFound";
    HttpErrors[HttpErrors["NotEnabled"] = 180] = "NotEnabled";
})(HttpErrors = exports.HttpErrors || (exports.HttpErrors = {}));
const Any_1 = require("../middleware/Any");
exports.ErrorTemplate = (title, body) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-lb-origin" content="${Any_1.lbOrigin}">
    <title>${title} - BlocksHub</title>
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,600,700,900" rel="stylesheet">
    <style>
        html {
            background: linear-gradient(90deg, rgba(71,195,91,1) 0%, rgba(71,195,91,0.85) 100%)!important;
        }
        body,html {
            margin: 0;
            padding: 0;
            font-family: 'Montserrat', sans-serif;
        }
        .content {
            padding-left: 1rem;
            padding-right: 1rem;
            padding-top: 2rem;
            max-width: 700px;
            display: block;
            margin: 0 auto;
            color: white;
        }
        .content > p {
            font-weight: 400;
            font-size: 1rem;
        }
        .content > h1 {
            font-weight: 200;
            font-size: 6rem;
            margin-bottom: 0;
        }
        @media only screen and (max-width: 800px) {
            .content > h1 {
                font-size: 3rem;
            }
        }
    </style>
    </head>
    <body>
        <div class="content">
            <h1>Error ${title}</h1>
            <p>${body}</p>
        </div>
    </body>
    </html>`.replace(/\n/g, '').replace(/  /g, '');
};

