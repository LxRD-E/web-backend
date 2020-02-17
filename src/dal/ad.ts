/**
 * Imports
 */
import _ = require('lodash');
import redis from '../helpers/ioredis_pubsub'
import axios from 'axios';
import * as Thumbnail from '../models/v1/thumnails';
import * as Avatar from '../models/v1/avatar';

import * as Users from '../models/v1/user';
import * as Catalog from '../models/v1/catalog';

import config from '../helpers/config';

import _init from './_init';
/**
 * Advertisment DAL
 */
export default class AdDAL extends _init {

    /**
     * Get a semi-random ad. Will prefer ads with higher bid
     * @throws {e.message.NoAdvertismentsAvailable} - No advertisment was available
     */
    public async getRandomAd(): Promise<any> {
        let randomAds = await this.knex('user_ads').select('id as adId','bid_amount as bidAmount','catalogasset_id as catalogAssetId','updated_at as updatedAt').where('updated_at','>=', this.knexTime());
        if (randomAds.length === 0) {
            throw new Error('NoAdvertismentsAvailable');
        }
        // weighted random (lol this is so bad performance wise, but I hope someone can improve it in the future :D)
        let randomAdsArr = [];
        for (const ad of randomAds) {
            let bid = ad.bitAmount;
            let curBid = 0;
            while (curBid <= bid) {
                randomAdsArr.push(ad);
                curBid++;
            }
        }
        return _.sample(randomAds);
    }

    public async incrementAdViewCount(adId: number): Promise<void> {
        await this.knex.raw(`UPDATE user_ads SET total_views = total_views + 1 WHERE user_ads.id = ?`, [adId]);
        await this.knex.raw(`UPDATE user_ads SET views = views + 1 WHERE user_ads.id = ?`, [adId]);
    }

    public async incrementAdClickCount(adId: number): Promise<void> {
        await this.knex.raw(`UPDATE user_ads SET total_clicks = total_clicks + 1 WHERE user_ads.id = ?`, [adId]);
        await this.knex.raw(`UPDATE user_ads SET clicks = clicks + 1 WHERE user_ads.id = ?`, [adId]);
    }
}

