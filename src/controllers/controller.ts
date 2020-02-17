// Import DAL
import { NotFound, BadRequest, Conflict, Unauthorized } from 'ts-httpexceptions';
import * as auth from '../dal/auth';
import user from '../dal/user';
import mod from '../dal/moderation';
import group from '../dal/group';
import game from '../dal/game';
import forum from '../dal/forum';
import economy from '../dal/economy';
import chat from '../dal/chat';
import catalog from '../dal/catalog';
import billing from '../dal/billing';
import avatar from '../dal/avatar';
import notification from '../dal/notification';
import settings from '../dal/settings';
import staff from '../dal/staff';
import ad from '../dal/ad';
import { WWWTemplate } from '../models/v2/Www';
import xss = require('xss');
import moment = require('moment');
import {numberWithCommas} from '../helpers/Filter';

/**
 * Standard controller that all other controllers should extend.
 * 
 * Adds dals and some helpers to controller classes
 */
export default class StandardController {
    // HTTP Exceptions
    public NotFound = NotFound;
    public BadRequest = BadRequest;
    public Conflict = Conflict;
    public Unauthorized = Unauthorized;
    // Random Stuff
    public WWWTemplate = WWWTemplate;
    public xss = xss;
    public moment = moment;
    public numberWithCommas = numberWithCommas;
    // DALs
    public auth = auth;
    public user = new user();
    public mod = new mod();
    public group = new group();
    public game = new game();
    public forum = new forum();
    public economy = new economy();
    public chat = new chat();
    public catalog = new catalog();
    public billing = new billing();
    public avatar = new avatar();
    public notification = new notification();
    public settings = new settings();
    public staff = new staff();
    public ad = new ad();
    constructor() {

    }
}
