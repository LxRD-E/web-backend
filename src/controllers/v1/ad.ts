/**
 * Imports
 */
// Models
import * as model from '../../models/models';
// Autoloads
import controller from '../controller';
import { BodyParams, Locals, UseBeforeEach, UseBefore, Patch, Controller, Get, Err, ModelStrict } from '@tsed/common';
import { csrf } from '../../dal/auth';
import { YesAuth } from '../../middleware/Auth';
import { Summary, Returns } from '@tsed/swagger';
/**
 * Ad Controller
 */
@Controller('/ad')
export default class AdController extends controller {

    constructor() {
        super();
    }

    
}
