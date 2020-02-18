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

export {any, auth, avatar, billing, catalog, chat, economy, forum, game, group, mod, notification, settings, staff, thumbnails, user, ad, support}