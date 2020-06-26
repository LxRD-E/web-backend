"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const model = require("../models/models");
const aws = require("aws-sdk");
const config_1 = require("../helpers/config");
const _init_1 = require("./_init");
class AdDAL extends _init_1.default {
    async getRandomAd(adDisplayType) {
        let modelToUse = new model.ad.Advertisement();
        await this.knex.transaction(async (trx) => {
            let randomAds = await trx('user_ads')
                .select('id as adId', 'bid_amount as bidAmount', 'updated_at as updatedAt', 'image_url as imageUrl', 'title')
                .where('updated_at', '>=', this.knexTime(this.moment().subtract(24, 'hours')))
                .andWhere('moderation_status', '=', model.ad.ModerationStatus.Approved)
                .andWhere('bid_amount', '>', 0)
                .andWhere('ad_displaytype', '=', adDisplayType)
                .forUpdate('user_ads');
            if (randomAds.length === 0) {
                throw new Error('NoAdvertismentsAvailable');
            }
            let randomAdsArr = [];
            for (const ad of randomAds) {
                let bid = ad.bidAmount;
                let curBid = 0;
                while (curBid <= bid) {
                    randomAdsArr.push(ad);
                    curBid++;
                }
            }
            let adChosen = _.sample(randomAdsArr);
            modelToUse.adId = adChosen.adId;
            modelToUse.imageUrl = adChosen.imageUrl;
            modelToUse.title = adChosen.title;
            await trx('user_ads').increment('views').increment('total_views').where({ 'id': adChosen.adId }).forUpdate('user_ads');
            await trx.commit();
            return modelToUse;
        });
        return modelToUse;
    }
    async getAdById(adId) {
        let ad = await this.knex('user_ads')
            .select('ad_type as adType', 'ad_redirectid as adRedirectId')
            .where('updated_at', '>=', this.knexTime(this.moment().subtract(24, 'hours')))
            .andWhere('id', '=', adId);
        if (!ad[0]) {
            throw new Error('InvalidAdId');
        }
        return ad[0];
    }
    async getFullAdInfoById(adId) {
        let data = await this.knex('user_ads')
            .select('id as adId', 'image_url as imageUrl', 'title', 'ad_type as adType', 'ad_redirectid as adRedirectId', 'moderation_status as moderationStatus', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'bid_amount as bidAmount', 'total_bid_amount as totalBidAmount', 'created_at as createdAt', 'updated_at as updatedAt').limit(1).where({ 'id': adId });
        if (!data[0]) {
            throw new Error('InvalidAdId');
        }
        if (data[0].totalBidAmount === 0) {
            data[0]['hasRunBefore'] = false;
        }
        else {
            data[0]['hasRunBefore'] = true;
        }
        return data[0];
    }
    async getUserAds(userId) {
        let data = await this.knex('user_ads')
            .select('id as adId', 'image_url as imageUrl', 'title', 'ad_type as adType', 'ad_redirectid as adRedirectId', 'moderation_status as moderationStatus', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'bid_amount as bidAmount', 'total_bid_amount as totalBidAmount', 'created_at as createdAt', 'updated_at as updatedAt', 'views', 'clicks', 'total_views as totalViews', 'total_clicks as totalClicks', 'ad_displaytype as adDisplayType').where({ 'user_id': userId });
        for (const ad of data) {
            if (ad['moderationStatus'] !== model.ad.ModerationStatus.Approved) {
                ad['imageUrl'] = null;
            }
            if (ad.totalBidAmount === 0) {
                ad['hasRunBefore'] = false;
            }
            else {
                ad['hasRunBefore'] = true;
            }
        }
        return data;
    }
    async createAd(userId, imageUrl, title, adType, adRedirectId, adDisplayType) {
        let resp = await this.knex('user_ads').insert({
            'user_id': userId,
            'image_url': imageUrl,
            'title': title,
            'ad_type': adType,
            'ad_redirectid': adRedirectId,
            'ad_displaytype': adDisplayType,
        });
        return resp[0];
    }
    async canUserCreateAd(userId) {
        let latestAdArr = await this.knex('user_ads').select('id', 'created_at').where({ 'user_id': userId }).limit(1).orderBy('id', 'desc');
        let latestAd = latestAdArr[0];
        if (!latestAd) {
            return true;
        }
        if (this.moment(latestAd.created_at).subtract(5, 'minutes').isSameOrAfter(this.moment())) {
            return false;
        }
        return true;
    }
    uploadGeneralThumbnail(fileKey, adBuffer, contentType) {
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.putObject({
                Bucket: config_1.default.aws.buckets.thumbnails,
                Key: fileKey,
                Body: adBuffer,
                ACL: 'public-read',
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000',
            }, function (err, data) {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                else {
                    console.log(data);
                    resolve();
                }
            });
        });
    }
    async placeBidOnAd(adId, amount) {
        await this.knex('user_ads').update({ 'bid_amount': amount, 'updated_at': this.knexTime(), 'views': 0, 'clicks': 0 }).where({ 'id': adId });
        await this.knex.raw(`UPDATE user_ads SET total_bid_amount = total_bid_amount + ? WHERE user_ads.id = ?`, [amount, adId]);
    }
    async incrementAdViewCount(adId) {
        await this.knex.raw(`UPDATE user_ads SET total_views = total_views + 1 WHERE user_ads.id = ?`, [adId]);
        await this.knex.raw(`UPDATE user_ads SET views = views + 1 WHERE user_ads.id = ?`, [adId]);
    }
    async incrementAdClickCount(adId) {
        await this.knex.raw(`UPDATE user_ads SET total_clicks = total_clicks + 1 WHERE user_ads.id = ?`, [adId]);
        await this.knex.raw(`UPDATE user_ads SET clicks = clicks + 1 WHERE user_ads.id = ?`, [adId]);
    }
}
exports.default = AdDAL;

