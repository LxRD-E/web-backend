/**
 * Imports
 */

import os = require('os');
import redis from '../helpers/ioredis';

import * as model from '../models/models';
import _init from './_init';

class StaffDAL extends _init {
    /**
     * Ban a User
     */
    public async insertBan(userId: number, reason: string, privateReason: string, unbanDate: string, isTerminated: model.user.banType, actorUserId: number): Promise<void> {
        await this.knex('user_moderation').insert({
            'userid': userId,
            'reason': reason,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'until_unbanned': this.moment(unbanDate).format('YYYY-MM-DD HH:mm:ss'),
            'is_terminated': isTerminated,
            'private_reason': privateReason,
            'actor_userid': actorUserId,
        });
    }
    /**
     * Get a user's Moderation History
     * @param userId 
     */
    public async getModerationHistory(userId: number): Promise<model.staff.UserModerationHistory[]> {
        const history = await this.knex('user_moderation').select('userid as userId','reason','date','until_unbanned as untilUnbanned','is_terminated as isTerminated','private_reason as privateReason', 'actor_userid as actorUserId').where({'userid':userId}).limit(100).orderBy('id','desc');
        return history;
    }
    /**
     * Record a Staff Member banning or Unbanning a user
     * @param userId 
     * @param userIdAffected 
     * @param banned 
     */
    public async recordBan(userId: number, userIdAffected: number, banned: model.user.banned): Promise<void> {
        await this.knex('moderation_ban').insert({
            'userid': userId,
            'userid_modified': userIdAffected,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'type': banned,
        });
    }
    /**
     * Get Comments for a UserID made by staff
     * @param userId 
     */
    public async getUserComments(userId: number, offset: number, limit: number): Promise<model.staff.UserComment[]> {
        const comments = await this.knex('user_staff_comments').select([
            'id as userCommentId',
            'user_id as userId',
            'staff_userid as staffUserId',
            'created_at as createdAt',
            'comment',
        ]).where({
            'user_id': userId,
        }).orderBy('id', 'desc').limit(limit).offset(offset);
        return comments;
    }

    /**
     * Create Staff Comment
     * @param userId 
     * @param staffUserId 
     * @param comment 
     */
    public async createComment(userId: number, staffUserId: number, comment: string): Promise<void> {
        await this.knex('user_staff_comments').insert({
            'user_id': userId,
            'staff_userid': staffUserId,
            'comment': comment,
        });
    }
    /**
     * Get the Server's Info
     */
    public async getServerStatus(): Promise<model.staff.SystemUsageStats> {
        // const cpus = os.cpus();
        const totalMemory = os.totalmem();
        const freemem = os.freemem();
        const memUsage = process.memoryUsage();

        const totalSystemUsedMemory = totalMemory - freemem;
        return {
            'system': {
                'memory': {
                    'gigabytes': {
                        'total': totalMemory / 1e+9,
                        'free': freemem / 1e+9,
                        'used': totalSystemUsedMemory / 1e+9,
                    },
                    'percentUsed': parseFloat((totalSystemUsedMemory / totalMemory * 100).toFixed(3)),
                },
                // 'cpu': cpus,
                'hostname': os.hostname(),
            },
            'node': {
                'memory': {
                    'gigabytes': {
                        'total': memUsage.heapTotal / 1e+9,
                        'used': memUsage.heapUsed / 1e+9,
                    },
                    'percentUsed': parseFloat((memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(3)),
                },
                'mysql': {
                    'pendingCreates': this.knex.client.pool.numPendingCreates(),
                    'numUsed': this.knex.client.pool.numUsed(),
                    'numFree': this.knex.client.pool.numFree(),
                    'numPendingAcquires': this.knex.client.pool.numPendingAcquires(),
                }
            },
        };
    }

    /**
     * Record the fact that an item was given to a user
     * @param userId 
     * @param userIdAffected 
     * @param catalogId 
     * @param userInventoryId 
     */
    public async recordGive(userId: number, userIdAffected: number, catalogId: number, userInventoryId: number): Promise<void> {
        await this.knex('moderation_give').insert({
            'userid': userId,
            'userid_to': userIdAffected,
            'catalog_id': catalogId,
            'inventory_id': userInventoryId,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Record Currency was Given to a user
     * @param userId 
     * @param userIdAffected 
     * @param amount 
     * @param currency 
     */
    public async recordGiveCurrency(userId: number, userIdAffected: number, amount: number, currency: number): Promise<void> {
        await this.knex('moderation_currency').insert({
            'userid': userId,
            'userid_affected': userIdAffected,
            'amount': amount,
            'currency': currency,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Get Multiple Thumbnails of Catalog Items from their ID
     * @param ids Array of Catalog IDs
     */
    public async multiGetThumbnailsFromIdsIgnoreModeration(ids: Array<number>): Promise<Array<model.catalog.ThumbnailResponse>> {
        const query = this.knex('thumbnails').select('thumbnails.url','thumbnails.reference_id as catalogId').innerJoin('catalog','catalog.id','thumbnails.reference_id').limit(25);
        ids.forEach((id) => {
            query.orWhere({'thumbnails.reference_id':id,'thumbnails.type':'catalog'});
        });
        const thumbnails = await query;
        return thumbnails as Array<model.catalog.ThumbnailResponse>;
    }

    /**
     * Get Items Awaiting Moderation
     */
    public async getItems(): Promise<any> {
        let fullArr = [];
        const info = await this.knex("catalog").select("catalog.id as catalogId","catalog.name as catalogName","catalog.price", "catalog.currency","catalog.creator as userId","catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(25).orderBy('id', 'desc').where({'catalog.is_pending': model.catalog.moderatorStatus.Pending});
        for (const item of info) {
            item['type'] = 'CatalogItem';
            fullArr.push(item);
        }
        let pendingAds = await this.knex('user_ads').select('id as adId','user_id as userId','image_url as imageUrl','title').where({'moderation_status': model.ad.ModerationStatus.Pending});
        for (const ad of pendingAds) {
            ad['type'] = 'Advertisment';
            fullArr.push(ad);
        }
        return fullArr;
    }

    /**
     * Update item's moderation status
     * @param catalogId 
     * @param state 
     */
    public async updateItemStatus(catalogId: number, state: model.catalog.moderatorStatus): Promise<void> {
        await this.knex('catalog').update({'is_pending': state}).where({'catalog.id':catalogId});
    }

    /**
     * Update site banner text
     * @param bannerText 
     */
    public async updateBannerText(bannerText: string): Promise<void> {
        await redis.set('siteWideBannerDisplay', bannerText);
    }

    /**
     * Get banner text
     */
    public async getBannerText(): Promise<string|null> {
        const banner = await redis.get('siteWideBannerDisplay');
        return banner;
    }

    /**
     * Search Staff
     * @param offset 
     */
    public async search(offset: number): Promise<model.user.UserInfo[]> {
        const results = await this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).offset(offset).orderBy('id', 'asc').where('user_staff', '>=', model.user.staff.Mod);
        return results;
    }

    public async updateAdState(adId: number, state: number): Promise<void> {
        await this.knex('user_ads').update({'moderation_status': state}).where({'id': adId}).limit(1);
    }
}

export default StaffDAL;
