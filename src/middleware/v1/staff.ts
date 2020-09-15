import { Locals, Res } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';
import { NextFunction, Request, Response } from "express";

export class StaffValidateLevelOne extends controller {
    public async use(
        @Locals('userInfo') userInfo: model.UserSession,
    ) {
        if (!(userInfo.staff >= 1)) {
            // user is not authorized
            throw new this.BadRequest('InvalidPermissions');
        }
    }
}

const dal = new controller();

export const AddPermissionsToLocals = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let userInfo = res.locals.userInfo;
        if (!userInfo || userInfo.staff === 0) {
            return next();
        }
        // Grab permissions
        userInfo.staffPermissions = await dal.staff.getPermissions(userInfo.userId);
        res.locals.hasPerm = (permission: string): boolean => {
            return userInfo.staff >= 100 || userInfo.staffPermissions.includes(model.staff.Permission[permission as any]);
        }
        next();
    } catch (err) {
        return next(err);
    }
}


export const validate = (level: model.staff.Permission, ...extraLevels: model.staff.Permission[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const session = req.session;
            const userInfo: model.UserSession = Object.assign({}, res.locals.userInfo);
            if (!userInfo) {
                throw new dal.Conflict('InvalidPermissions');
            }
            if (session && session.userdata) {
                if (session.impersonateUserId) {
                    console.log('[info] current session data', session.userdata);
                    let trueUserId = session.userdata.id || session.userdata.userId || session.userdata.userid;
                    const _newRequest = await dal.user.getInfo(trueUserId, ['userId', 'username', 'staff']);
                    userInfo.userId = _newRequest.userId;
                    userInfo.username = _newRequest.username;
                    userInfo.staff = _newRequest.staff;
                }
            }
            if (!level) {
                if (userInfo.staff >= 1) {
                    return next();
                } else {
                    throw new dal.Conflict('InvalidPermissions');
                }
            }
            if (userInfo.staff >= 100) {
                return next(); // auto skip
            }
            const userPermissions = await dal.staff.getPermissions(userInfo.userId)
            if (userPermissions.includes(level)) {
                return next(); // OK
            }

            throw new dal.Conflict('InvalidPermissions');
        } catch (err) {
            return next(err);
        }
    };
    /*
    class ValidateStaffInternal {
        public async use(
            @Locals('userInfo') userInfo?: model.UserSession,
        ) {
            if (!userInfo) {
                throw new Error('bad');
            }
            if (userInfo.staff >= 100) {
                return; // auto skip
            }
            if (!level) {
                if (userInfo.staff >= 1) {
                    return;
                }else{
                    throw new dal.Conflict('InvalidPermissions');
                }
            }
            const userPermissions = await dal.staff.getPermissions(userInfo.userId)
            if (userPermissions.includes(level)) {
                return; // OK
            }

            throw new dal.Conflict('InvalidPermissions');
        }
    }
    return ValidateStaffInternal;

     */
}
