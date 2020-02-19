/**
 * Imports
 */
// Models
import * as model from '../../models/models';
// Autoloads
import controller from '../controller';
import { BodyParams, Locals, UseBeforeEach, UseBefore, Patch, Controller, Get, Err, ModelStrict, PathParams, Post, Use, Res, Required } from '@tsed/common';
import { csrf } from '../../dal/auth';
import { YesAuth } from '../../middleware/Auth';
import { Summary, Returns, Description } from '@tsed/swagger';
import { MultipartFile } from '@tsed/multipartfiles';
import jimp = require('jimp');
import crypto = require('crypto');
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
    public async getCreatedAds(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        let userAds = await this.ad.getUserAds(userInfo.userId);
        return userAds;
    }

    @Get('/random')
    @Summary('Get a semi-random advertisement to display to the user')
    @Description('We do not target advertisments whatsoever. They are purely based off of user bid amounts, i.e, if one user bids 10 primary and another user bids 1, you have a 90% chance of seeing the first ad and a 10% chance of seeing the second ad.')
    @Returns(200, {type: model.ad.Advertisment})
    public async getAdvertisment() {
        let ad: model.ad.Advertisment;
        try {
            ad = await this.ad.getRandomAd();
        }catch(e){
            throw new this.Conflict('NoAdvertismentAvailable');
        }
        // Increment
        await this.ad.incrementAdViewCount(ad.adId);
        // Return
        return ad;
    }

    @Get('/:adId/click')
    @Summary('Click an ad. Redirects to ad location')
    @Returns(200, {type: model.ad.AdClickResponse})
    public async clickAd(
        @PathParams('adId', Number) adId: number,
        @Res() res: Res,
    ) {
        let ad: model.ad.ExpandedAdvertismentDetails;
        try {
            ad = await this.ad.getAdById(adId);
        }catch{
            throw new this.BadRequest('InvalidAdId');
        }
        let url;
        if (ad.adType === model.ad.AdType.CatalogItem) {
            url = `/catalog/`+ad.adRedirectId+'/--';
        }else if (ad.adType === model.ad.AdType.Group) {
            url = `/groups/`+ad.adRedirectId+`/--`;
        }else if (ad.adType === model.ad.AdType.ForumThread) {
            url = `/forum/thread/${ad.adRedirectId}?page=1`;
        }
        // increment
        await this.ad.incrementAdClickCount(adId);
        res.redirect(url);
    }

    @Post('/create')
    @Summary('Create an advertisment.')
    @Description('If group or group item, user must be owner of group. If catalog item, user must be creator')
    @Use(csrf, YesAuth)
    public async createAdvertisment(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @MultipartFile() uploadedFiles: Express.Multer.File[],
        @BodyParams('title', String) title: string = '',
        @Required()
        @BodyParams('adType', Number) adType: number, 
        @Required()
        @BodyParams('adRedirectId', Number) adRedirectId: number,
    ) {
        // Check if created ad recently
        let canMakeAd = await this.ad.canUserCreateAd(userInfo.userId);
        if (!canMakeAd) {
            throw new this.Conflict('Cooldown');
        }
        // Validate files uploaded
        let sortedFiles = await this.catalog.sortFileUploads(uploadedFiles);
        let file: Buffer;
        let mime: 'image/png'|'image/jpeg';
        let fileEnding = '';
        if (!sortedFiles.jpg) {
            if (!sortedFiles.png) {
                throw new this.BadRequest('NoFileSpecified');
            }else{
                mime = 'image/png';
                fileEnding = '.png';
                file = sortedFiles.png as Buffer;
            }
        }else{
            mime = 'image/jpeg';
            fileEnding = '.jpg';
            file = sortedFiles.jpg as Buffer;
        }
        // Read image in jimp
        let imageInfo = await jimp.read(file);
        // Resize (to leaderboard)
        // currently hard-coded for leaderboard, but we may add more types of ads in the future, so update this code accordingly
        await imageInfo.resize(728,90);
        // Grab edited buffer
        let imageData = await imageInfo.getBufferAsync(mime);
        if (!model.ad.AdType[adType]) {
            throw new this.BadRequest('InvalidAdType');
        }
        if (title.length > 256) {
            throw new this.BadRequest('InvalidAdTitle');
        }
        // verify user has permissions to create the advertisment

        // if type is catalog item
        if (adType === model.ad.AdType.CatalogItem) {
            /// grab info (also confirms the id is valid)
            let asset = await this.catalog.getInfo(adRedirectId, ['creatorId','creatorType']);
            // if creator type is user
            if (asset.creatorType === model.catalog.creatorType.User) {
                // if item creator is not authenticated user, return error
                if (asset.creatorId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidPermissions');
                }
            // otherwise if creator type is group
            }else if (asset.creatorType === model.catalog.creatorType.Group) {
                // grab group info
                let groupInfo = await this.group.getInfo(asset.creatorId);
                // if group is locked or authenticated user is not owner, throw error
                if (groupInfo.groupStatus === model.group.groupStatus.locked || groupInfo.groupOwnerUserId !== userInfo.userId) {
                    throw new this.BadRequest('InvalidPermissions');
                }
            // someone probably added a new creatorType and forgot to implement it here. hopefully this will make it to sentry.io logs...
            }else{
                throw new Error('Invalid asset.creatorType for item '+adRedirectId);
            }
        // else if adtype is for a group
        }else if (adType === model.ad.AdType.Group) {
            // grab group info
            let groupInfo = await this.group.getInfo(adRedirectId);
            // if group is locked or authenticated user is not owner, return error
            if (groupInfo.groupStatus === model.group.groupStatus.locked || groupInfo.groupOwnerUserId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
        // else if adtype is for a forum thread
        }else if (adType === model.ad.AdType.ForumThread) {
            // grab thread info
            let threadInfo = await this.forum.getThreadById(adRedirectId);
            // if creator of thread is not authenticated user, deny
            if (threadInfo.userId !== userInfo.userId || threadInfo.threadDeleted !== model.forum.threadDeleted.false) {
                throw new this.BadRequest('InvalidPermissions');
            }
        // someone probably forgot to add the new adType to this code...
        }else{
            throw new Error('Invalid adType: '+adType);
        }

        // generate random name for ad image
        let randomName = crypto.randomBytes(32).toString('hex')+fileEnding;
        // insert data
        // note: we currently hardcode banner (since its the only ad type, but we may add more types in the future. make sure to update this code to fit them!)
        let adId = await this.ad.createAd(userInfo.userId, 'https://cdn.hindigamer.club/thumbnails/'+randomName, title, adType, adRedirectId, model.ad.AdDisplayType.Leaderboard);
        // upload image
        await this.ad.uploadAdImage(randomName, imageData, mime);
        // return success 
        return {
            success: true,
        };
    }

    @Post('/:adId/bid')
    @Summary('Bid money on an advertisment')
    @Description('User must be creator of ad')
    @Use(csrf, YesAuth)
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
        }else{
            if (this.moment(adData.updatedAt).subtract(24, 'hours').isSameOrAfter(this.moment())) {
                canRun = false;
            }else{
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
        }else{
            throw new this.Conflict('NotEnoughCurrency');
        }
        // subtract balance
        await this.economy.subtractFromUserBalance(userInfo.userId, amount, model.economy.currencyType.primary);
        // create transaction
        await this.economy.createTransaction(userInfo.userId, 1, amount, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfAdvertisment, 'Purchase of Advertisment', model.catalog.creatorType.User, model.catalog.creatorType.User);
        // update ad
        await this.ad.placeBidOnAd(adId, amount);
        // return success
        return {
            success: true,
        };
    }
}
