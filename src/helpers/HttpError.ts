export enum HttpErrors {
    InternalServerError,
    InvalidAcceptHeader,
    SchemaValidationFailed,
    InvalidPagingCursor,
    InvalidPagingLimit,
    InvalidPagingOffset,
    PageNotFound,
    LogoutRequired,
    InvalidUsernameOrPassword,
    LoginRequired,
    CSRFValidationFailed,
    InvalidBirthDate,
    InvalidUsername,
    InvalidPassword,
    UsernameConstraint1Space1Period1Underscore,
    UsernameConstriantCannotEndOrStartWithSpace,
    UsernameConstraintInvalidCharacters,
    UsernameConstriantTooLong,
    UsernameConstrintTooShort,
    OneAccountPerIP,
    InvalidSort,
    TooManyIds,
    InvalidIds,
    CannotSendRequest,
    NoPendingRequest,
    InvalidPrice,
    CannotBeSold,
    InvalidTradeType,
    TooManyPendingTrades,
    InvalidItemsSpecified,
    CannotTradeWithUser,
    NotEnoughCurrency,
    InvalidAmount,
    InvalidCurrency,
    InvalidCatalogId,
    NoLongerForSale,
    SellerHasChanged,
    PriceHasChanged,
    CurrencyHasChanged,
    AlreadyOwns,
    InvalidCurrencySpecified,
    ItemStillForSale,
    InvalidUserInventoryId,
    ItemNoLongerForSale,
    InvalidUserId,
    InvalidTradeId,
    InvalidPartnerId,
    OneOrMoreItemsNotAvailable,
    InvalidCatalogIds,
    AvatarCooldown,
    NoUpdates,
    InvalidCurrencyProductId,
    EmailVerificationRequired,
    BlurbTooLarge,
    InvalidOldPassword,
    InalidPassword,
    InvalidCode,
    FloodCheck,
    InvalidEmail,
    InvalidTheme,
    InvalidOption,
    CaptchaValidationFailed,
    InvalidGroupId,
    InvalidRolesetId,
    InvalidGroupPermissions,
    InvalidWallPost,
    AlreadyGroupMember,
    TooManyGroups,
    InvalidGroupRank,
    InvalidRolesetName,
    InvalidRolesetDescription,
    InvalidRolesetPermissions,
    RankIdIsTaken,
    TooManyRolesets,
    RolesetHasMembers,
    CannotDeleteFirstRoleInGroup,
    UserNotInGroup,
    CannotRankUser,
    ShoutCooldown,
    InvalidFileType,
    InvalidGroupName,
    InvalidGroupDescription,
    GroupNameTaken,
    InvalidReason,
    InvalidLengthType,
    InvalidPrivateReason,
    ConstraintIfDeletedUserMustAlsoBeTerminated,
    CommentTooLarge,
    InvalidCurrencyAmount,
    InvalidCatalogIdOrState,
    InvalidBannerText,
    InvalidRank,
    RankCannotBeAboveCurrentUser,
    InvalidSubCategoryId,
    InvalidTitle,
    InvalidBody,
    ThreadLocked,
    InvalidPinnedState,
    InvalidLockedState,
    InvalidPostId,
    InvalidCatalogName,
    InvalidModerationStatus,
    InvalidCatalogDescription,
    InvalidIsForSaleOption,
    ConstraintPriceTooHigh,
    InvalidCollectibleState,
    InvalidComment,
    NoFileSpecified,
    InvalidOBJSpecified,
    InvalidMTLSpecified,
    InvalidRGBArray,
    InvalidTokenOrSecret,
    TwoFactorAlreadyEnabled,
    TooManyRequests,
    InvalidTwoFactorCode,
    TwoStepVerificationRequired,
    TwoStepRequiredVerificationFailed,
    NoAdvertisementAvailable,
    InvalidAdId,
    InvalidAdType,
    InvalidAdTitle,
    ModerationStatusConflict,
    InvalidPermissions,
    TicketStatusDoesNotAllowReply,
    InvalidGameId,
    InvalidGameState,
    InvalidScriptId,
    TooManyScripts,
    InvalidMaxPlayers,
    InvalidNameOrDescription,
    TooManyGames,
    TwoFactorCodeExpired,
    TwoFactorNotRequired,
    InvalidAdDisplayType,
    AuthenticationServiceConstraintHTTPSRequired,
    AuthenticationServiceBlacklisted,
    InvalidReturnUrl,
};
// @Locals('userInfo') userInfo: model.user.UserInfo,
export const ErrorTemplate = (title: string, body: string): string => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Hindi Gamer Club</title>
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
    </html>`.replace(/\n/g, '');
}
