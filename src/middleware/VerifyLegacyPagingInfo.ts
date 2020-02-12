import { Request, Response } from "@tsed/common";
import { NextFunction } from "express";
import util = require('util');
import crypto = require('crypto');

export const VerifyPagingInfo = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.query['limit']) {
        req.query['limit'] = parseInt(req.query['limit']);
        if (!Number.isInteger(req.query['limit']) || req.query['limit'] <= 0 || req.query['limit'] > 100) {
            req.query['limit'] = 48;
        }
    }
    if (req.query['offset']) {
        req.query['offset'] = parseInt(req.query['offset']);
        if (!Number.isInteger(req.query['offset']) || req.query['offset'] < 0) {
            req.query['offset'] = 0;
        }
    }
    // Next
    next();
}