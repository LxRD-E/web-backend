/**
 * Imports
 */
// Models
import * as model from '../../models/models';
// Autoloads
import controller from '../controller';
import { BodyParams, Controller, Get, Locals, PathParams, Post, Required, Res, Status, Use } from '@tsed/common';
import { csrf } from '../../dal/auth';
import { YesAuth } from '../../middleware/Auth';
import { Description, Returns, ReturnsArray, Summary } from '@tsed/swagger';
import { MultipartFile } from '@tsed/multipartfiles';
import jimp = require('jimp');
import crypto = require('crypto');
import config from '../../helpers/config';

/**
 * Ad Controller
 */
@Controller('/ad')
export default class AdController extends controller {

    constructor() {
        super();
    }

    @Get('/my/created-ads')
    @Summary('Get created ads by authenticated user')
    @Use(YesAuth)
    @ReturnsArray(200, { type: model.ad.FullAdvertisementDetails })
    public async getCreatedAds(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        return await this.ad.getUserAds(userInfo.userId);
    }

    @Get('/random/:adDisplayType')
    @Summary('Get a semi-random advertisement to display to the user')
    @Description('Advertisements are not targeted to comply with COPPA. Ads are purely based off of user bid amounts, i.e, if one user bids 10 primary and another user bids 1, you have a 90% chance of seeing the first ad and a 10% chance of seeing the second ad.')
    @Returns(200, { type: model.ad.Advertisement })
    @Returns(409, { type: model.Error, description: 'NoAdvertisementAvailable: Account status does not permit advertisement, or no ads are available to display to the user\n' })
    @Returns(400, { type: model.Error, description: 'InvalidAdDisplayType: AdDisplayId is invalid\n' })
    public async getAdvertisement(
        @Description('The type of ad to grab')
        @PathParams('adDisplayType', Number) adDisplayType: number,
    ) {
        if (!model.ad.AdDisplayType[adDisplayType]) {
            throw new this.BadRequest('InvalidAdDisplayType');
        }
        let ad: model.ad.Advertisement;
        try {
            ad = await this.ad.getRandomAd(adDisplayType);
        } catch (e) {
            throw new this.Conflict('NoAdvertisementAvailable');
        }
        // Return
        return ad;
    }

    @Get('/:adId/click')
    @Summary('Click an ad. Redirects to ad location')
    @Returns(302, { description: 'See header value: location\n' })
    @Status(302)
    @Returns(400, { type: model.Error, description: 'InvalidAdId: adId is not currently running or is invalid\n' })
    public async clickAd(
        @PathParams('adId', Number) adId: number,
        @Res() res: Res,
    ) {
        let ad: model.ad.ExpandedAdvertisementDetails;
        try {
            ad = await this.ad.getAdById(adId);
        } catch{
            throw new this.BadRequest('InvalidAdId');
        }
        let url;
        if (ad.adType === model.ad.AdType.CatalogItem) {
            url = `/catalog/` + ad.adRedirectId + '/--';
        } else if (ad.adType === model.ad.AdType.Group) {
            url = `/groups/` + ad.adRedirectId + `/--`;
        } else if (ad.adType === model.ad.AdType.ForumThread) {
            url = `/forum/thread/${ad.adRedirectId}?page=1`;
        }
        if (!url) {
            throw new this.BadRequest('InvalidAdId');
        }
        // increment
        await this.ad.incrementAdClickCount(adId);
        res.redirect(config.baseUrl.www + url);
    }

    @Post('/create')
    @Summary('Create an advertisement.')
    @Description('If group or group item, user must be owner of group. If catalog item, user must be creator')
    @Use(csrf, YesAuth)
    @Returns(200, { description: 'Add Created' })
    @Returns(400, { type: model.Error, description: 'NoFileSpecified: Please specify a body.uploadedFiles\nInvalidAdType: Ad Type is invalid\nInvalidAdTitle: Ad title is invalid, too long, or too short\nInvalidPermissions: You do not have permission to advertise this asset\n' })
    @Returns(409, { type: model.Error, description: 'Cooldown: You cannot create an ad right now\n' })
    public async createAdvertisement(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @Description('File can be a JPG, JPEG, or PNG. We may expand this in the future')
        @MultipartFile() uploadedFiles: Express.Multer.File[],
        @BodyParams('title', String) title: string = '',
        @Required()
        @Description('The type of ad being advertised. 1 = CatalogItem, 2 = Group, 3 = ForumThread')
        @BodyParams('adType', Number) adType: number,
        @Required()
        @Description('The ID of the adType. For instance, if you want to advertise Forum Thread id 28, this value would be 28')
        @BodyParams('adRedirectId', Number) adRedirectId: number,
        @Required()
        @Description('The type of ad to create')
        @BodyParams('adDisplayType', Number) adDisplayType: number,
    ) {
        // Check if adDisplayType is valid
        if (!model.ad.AdDisplayType[adDisplayType]) {
            throw new this.BadRequest('InvalidAdDisplayType');
        }
        // Check if created ad recently
        let canMakeAd = await this.ad.canUserCreateAd(userInfo.userId);
        if (!canMakeAd) {
            throw new this.Conflict('Cooldown');
        }
        // Validate files uploaded
        let sortedFiles = await this.catalog.sortFileUploads(uploadedFiles);
        let file: Buffer;
        let mime: 'image/png' | 'image/jpeg';
        let fileEnding = '';
        if (!sortedFiles.jpg) {
            if (!sortedFiles.png) {
                throw new this.BadRequest('NoFileSpecified');
            } else {
                mime = 'image/png';
                fileEnding = '.png';
                file = sortedFiles.png as Buffer;
            }
        } else {
            mime = 'image/jpeg';
            fileEnding = '.jpg';
            file = sortedFiles.jpg as Buffer;
        }
        // Read image in jimp
        let imageInfo = await jimp.read(file);
        // Resize (to leaderboard)
        // currently hard-coded for leaderboard, but we may add more types of ads in the future, so update this code accordingly
        if (adDisplayType === model.ad.AdDisplayType.Leaderboard) {
            imageInfo.resize(728, 90);
        } else if (adDisplayType === model.ad.AdDisplayType.Skyscraper) {
            imageInfo.resize(160, 600);
        } else {
            throw new Error('Ad type specified (' + adDisplayType + ') is not supported by AdController.createAdvertisement()');;
        }
        // Grab edited buffer
        let imageData = await imageInfo.getBufferAsync(mime);
        if (!model.ad.AdType[adType]) {
            throw new this.BadRequest('InvalidAdType');
        }
        if (title.length > 256) {
            throw new this.BadRequest('InvalidAdTitle');
        }
        // verify user has permissions to create the advertisement

        // if type is catalog item
        if (adType === model.ad.AdType.CatalogItem) {
            /// grab info (also confirms the id is valid)
            let asset = await this.catalog.getInfo(adRedirectId, ['creatorId', 'creatorType']);
            // if creator type is user
            if (asset.creatorType === model.catalog.creatorType.User) {
                // if item creator is not authenticated user, return error
                if (asset.creatorId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidPermissions');
                }
                // otherwise if creator type is group
            } else if (asset.creatorType === model.catalog.creatorType.Group) {
                // grab group info
                let groupInfo = await this.group.getInfo(asset.creatorId);
                // if group is locked or authenticated user is not owner, throw error
                if (groupInfo.groupStatus === model.group.groupStatus.locked || groupInfo.groupOwnerUserId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidPermissions');
                }
                // someone probably added a new creatorType and forgot to implement it here. hopefully this will make it to sentry.io logs...
            } else {
                throw new Error('Invalid asset.creatorType for item ' + adRedirectId);
            }
            // else if adtype is for a group
        } else if (adType === model.ad.AdType.Group) {
            // grab group info
            let groupInfo = await this.group.getInfo(adRedirectId);
            // if group is locked or authenticated user is not owner, return error
            if (groupInfo.groupStatus === model.group.groupStatus.locked || groupInfo.groupOwnerUserId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
            // else if adtype is for a forum thread
        } else if (adType === model.ad.AdType.ForumThread) {
            // grab thread info
            let threadInfo = await this.forum.getThreadById(adRedirectId);
            // if creator of thread is not authenticated user, deny
            if (threadInfo.userId !== userInfo.userId || threadInfo.threadDeleted !== model.forum.threadDeleted.false) {
                throw new this.BadRequest('InvalidPermissions');
            }
            // someone probably forgot to add the new adType to this code...
        } else {
            throw new Error('Invalid adType: ' + adType);
        }

        // generate random name for ad image
        let randomName = crypto.randomBytes(32).toString('hex') + fileEnding;
        // insert data
        let adId = await this.ad.createAd(userInfo.userId, 'https://cdn.blockshub.net/thumbnails/' + randomName, title, adType, adRedirectId, adDisplayType);
        // upload image
        await this.ad.uploadGeneralThumbnail(randomName, imageData, mime);
        // return success 
        return {
            success: true,
        };
    }

    @Post('/:adId/bid')
    @Summary('Bid money on an advertisement')
    @Description('User must be creator of ad')
    @Use(csrf, YesAuth)
    @Returns(400, { type: model.Error, description: 'InvalidCurrencyAmount: Currency Amount must be between 1 and 100,000\nInvalidAdId: adId is invalid or not managed by authenticated user\nModerationStatusConflict: Ad moderation status does not allow it to run\n' })
    @Returns(409, { type: model.Error, description: 'AdAlreadyRunning: This ad cannot be run since it is already running\nNotEnoughCurrency: Authenticated user does not have enough currency for this purchase\n' })
    public async bidAd(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('adId', Number) adId: number,
        @BodyParams('amount', Number) amount: number,
    ) {
        if (amount < 1 || amount > 100000) {
            throw new this.BadRequest('InvalidCurrencyAmount');
        }
        let adData = await this.ad.getFullAdInfoById(adId);
        if (adData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidAdId');
        }
        let canRun = false;
        if (adData.hasRunBefore === false) {
            canRun = true;
        } else {
            if (this.moment(adData.updatedAt).subtract(24, 'hours').isSameOrAfter(this.moment())) {
                canRun = false;
            } else {
                canRun = true;
            }
        }
        if (!canRun) {
            throw new this.Conflict('AdAlreadyRunning');
        }
        if (adData.moderationStatus !== model.ad.ModerationStatus.Approved) {
            throw new this.BadRequest('ModerationStatusConflict');
        }
        // verify user has enough
        let userBal = await this.user.getInfo(userInfo.userId, ['primaryBalance']);
        if (userBal.primaryBalance >= amount) {
            // User is OK
        } else {
            throw new this.Conflict('NotEnoughCurrency');
        }
        // subtract balance
        await this.economy.subtractFromUserBalance(userInfo.userId, amount, model.economy.currencyType.primary);
        // create transaction
        await this.economy.createTransaction(userInfo.userId, 1, amount, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfAdvertisment, 'Purchase of Advertisement', model.catalog.creatorType.User, model.catalog.creatorType.User);
        // update ad
        await this.ad.placeBidOnAd(adId, amount);
        // return success
        return {
            success: true,
        };
    }
}
