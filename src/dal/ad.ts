/**
 * Imports
 */
import _ = require('lodash');
import axios from 'axios';
import * as model from '../models/models';
import aws = require('aws-sdk');
import config from '../helpers/config';
import _init from './_init';
/**
 * Advertisement DAL
 */
export default class AdDAL extends _init {

    /**
     * Get a semi-random ad. Will prefer ads with higher bid. This will increment the ad view count
     * @throws {e.message.NoAdvertismentsAvailable} - No advertisement was available
     */
    public async getRandomAd(adDisplayType: model.ad.AdType): Promise<model.ad.Advertisement> {
        let modelToUse = new model.ad.Advertisement();
        await this.knex.transaction(async (trx) => {
            let randomAds = await trx('user_ads')
                .select('id as adId','bid_amount as bidAmount','updated_at as updatedAt','image_url as imageUrl','title')
                .where('updated_at','>=', this.knexTime(this.moment().subtract(24, 'hours')))
                .andWhere('moderation_status','=',model.ad.ModerationStatus.Approved)
                .andWhere('bid_amount','>',0)
                .andWhere('ad_displaytype', '=',adDisplayType)
                .forUpdate('user_ads');
            if (randomAds.length === 0) {
                throw new Error('NoAdvertismentsAvailable');
            }
            // weighted random (lol this is so bad performance wise, but I hope someone can improve it in the future :D)
            let randomAdsArr = [];
            for (const ad of randomAds) {
                let bid = ad.bidAmount;
                let curBid = 0;
                while (curBid <= bid) {
                    randomAdsArr.push(ad);
                    curBid++;
                }
            }
            let adChosen: model.ad.Advertisement = _.sample(randomAdsArr);
            modelToUse.adId = adChosen.adId;
            modelToUse.imageUrl = adChosen.imageUrl;
            modelToUse.title = adChosen.title;

            // increment
            await trx('user_ads').increment('views').increment('total_views').where({'id': adChosen.adId}).forUpdate('user_ads');
            // commit
            await trx.commit();
            // return ad model
            return modelToUse;
        });
        return modelToUse;
    }

    /**
     * 
     * @param adId 
     */
    public async getAdById(adId: number): Promise<model.ad.ExpandedAdvertisementDetails> {
        let ad = await this.knex('user_ads')
        .select('ad_type as adType', 'ad_redirectid as adRedirectId')
        .where('updated_at','>=', this.knexTime(this.moment().subtract(24, 'hours')))
        .andWhere('id', '=', adId);
        if (!ad[0]) {
            throw new Error('InvalidAdId');
        }
        return ad[0];
    }

    public async getFullAdInfoById(adId: number): Promise<model.ad.FullAdvertisementDetails> {
        let data = await this.knex('user_ads')
        .select('id as adId','image_url as imageUrl','title','ad_type as adType','ad_redirectid as adRedirectId','moderation_status as moderationStatus','user_id as userId','created_at as createdAt','updated_at as updatedAt','bid_amount as bidAmount','total_bid_amount as totalBidAmount','created_at as createdAt','updated_at as updatedAt').limit(1).where({'id': adId});
        if (!data[0]) {
            throw new Error('InvalidAdId');
        }
        if (data[0].totalBidAmount === 0) {
            data[0]['hasRunBefore'] = false;
        }else{
            data[0]['hasRunBefore'] = true;
        }
        return data[0];
    }

    public async getUserAds(userId: number): Promise<model.ad.FullAdvertisementDetails[]> {
        let data = await this.knex('user_ads')
        .select('id as adId','image_url as imageUrl','title','ad_type as adType','ad_redirectid as adRedirectId','moderation_status as moderationStatus','user_id as userId','created_at as createdAt','updated_at as updatedAt','bid_amount as bidAmount','total_bid_amount as totalBidAmount','created_at as createdAt','updated_at as updatedAt','views','clicks','total_views as totalViews','total_clicks as totalClicks', 'ad_displaytype as adDisplayType').where({'user_id': userId});
        for (const ad of data) {
            if (ad['moderationStatus'] !== model.ad.ModerationStatus.Approved) {
                ad['imageUrl'] = null;
            }
            if (ad.totalBidAmount === 0) {
                ad['hasRunBefore'] = false;
            }else{
                ad['hasRunBefore'] = true;
            }
        }
        return data;
    }

    /**
     * Create an advertisment
     * @param userId 
     * @param imageUrl 
     * @param title 
     * @param adType 
     * @param adRedirectId 
     * @param adDisplayType 
     */
    public async createAd(userId: number, imageUrl: string, title: string, adType: model.ad.AdType, adRedirectId: number, adDisplayType: model.ad.AdDisplayType): Promise<number> {
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

    /**
     * Check if cooldown is preventing user from creating an advertisment
     * @param userId 
     */
    public async canUserCreateAd(userId: number): Promise<boolean> {
        let latestAdArr = await this.knex('user_ads').select('id','created_at').where({'user_id': userId}).limit(1).orderBy('id','desc');
        let latestAd = latestAdArr[0];
        if (!latestAd) {
            return true;
        }
        if (this.moment(latestAd.created_at).subtract(5,'minutes').isSameOrAfter(this.moment())) {
            return false;
        }
        return true;
    }

    public uploadGeneralThumbnail(fileKey: string, adBuffer: Buffer, contentType: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.putObject({
                Bucket: config.aws.buckets.thumbnails,
                Key: fileKey,
                Body: adBuffer,
                ACL: 'public-read',
                ContentType: contentType,
                CacheControl: 'public, max-age=31536000',
            }, function (err, data) {
                if (err) {
                    console.error(err);
                    reject(err)
                } else {
                    console.log(data);
                    resolve();
                }
            });
        });
    }

    public async placeBidOnAd(adId: number, amount: number): Promise<void> {
        // set bid amount
        await this.knex('user_ads').update({'bid_amount': amount, 'updated_at': this.knexTime(),'views':0,'clicks':0}).where({'id': adId});
        // update total bid on ad
        await this.knex.raw(`UPDATE user_ads SET total_bid_amount = total_bid_amount + ? WHERE user_ads.id = ?`, [amount, adId]);
    }

    /**
     * @deprecated - Please use transactions instead
     * @param adId 
     */
    public async incrementAdViewCount(adId: number): Promise<void> {
        await this.knex.raw(`UPDATE user_ads SET total_views = total_views + 1 WHERE user_ads.id = ?`, [adId]);
        await this.knex.raw(`UPDATE user_ads SET views = views + 1 WHERE user_ads.id = ?`, [adId]);
    }

    /**
     * @deprecated - Please use transactions instead
     * @param adId 
     */
    public async incrementAdClickCount(adId: number): Promise<void> {
        await this.knex.raw(`UPDATE user_ads SET total_clicks = total_clicks + 1 WHERE user_ads.id = ?`, [adId]);
        await this.knex.raw(`UPDATE user_ads SET clicks = clicks + 1 WHERE user_ads.id = ?`, [adId]);
    }
}

