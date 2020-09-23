import * as any from './v1/any';
import * as auth from './v1/auth';
import * as avatar from './v1/avatar';
import * as billing from './v1/billing';
import * as catalog from './v1/catalog';
import * as chat from './v1/chat';
import * as economy from './v1/economy';
import * as forum from './v1/forum';
import * as game from './v1/game';
import * as group from './v1/group';
import * as mod from './v1/moderation';
import * as notification from './v1/notification';
import * as settings from './v1/settings';
import * as staff from './v1/staff';
import * as thumbnails from './v1/thumnails';
import * as user from './v1/user';
import * as ad from './v1/ad';
import * as support from './v1/support';
import * as feed from './v1/feed';
import * as reportAbuse from './v1/report-abuse';
import * as currencyExchange from './v1/currency-exchange';
import * as dataPersistence from './v1/data-persistence';
import * as userReferral from './v1/user-referral';
import * as tradeAds from './v1/trade-ads';
import { Required } from '@tsed/common';
import { Example } from '@tsed/swagger';

class _errorData {
    @Required()
    @Example('InternalServerError')
    code: string;
}

export class Error {
    @Required()
    @Example(false)
    success: boolean = false;
    @Required()
    error: _errorData;
}

export class UserSession {
    @Required()
    'userId': number;
    @Required()
    'username': string;
    @Required()
    'passwordChanged': number;
    @Required()
    'banned': user.banned;
    @Required()
    'theme': user.theme;
    @Required()
    'primaryBalance': number;
    @Required()
    'secondaryBalance': number;
    @Required()
    'staff': user.staff;
    @Required()
    'dailyAward': string;
}


export { any, auth, avatar, billing, catalog, chat, economy, forum, game, group, mod, notification, settings, staff, thumbnails, user, ad, support, feed, reportAbuse, currencyExchange, dataPersistence, userReferral, tradeAds }