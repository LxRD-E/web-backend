/**
 * Sentry Error Logging
 */
import * as Sentry from './helpers/sentry';
if (process.env.NODE_ENV === 'production') {
    Sentry.init();
}
console.log('[info] staging enabled:', process.env.IS_STAGING === '1');
import * as Express from "express";
import { ServerLoader, ServerSettings } from "@tsed/common";
import "@tsed/ajv"; // import ajv ts.ed module
import "@tsed/swagger"; // import swagger Ts.ED module
import Path = require("path");

// @ts-ignore
import responseTime = require('response-time');
import './events/setup';

import * as cons from 'consolidate';
import { NotFoundMiddleware } from "./middleware/NotFound";
import logger from './helpers/Logger';
import removeSwaggerBranding from './helpers/remove-swagger-branding';
// start middleware
import session from './start/session';
import ws from './start/websockets';
import Any, { generateCspWithNonce } from './middleware/Any';
import multer = require('multer');
import { NextFunction } from "express";
removeSwaggerBranding();
// If production
if (process.env.NODE_ENV === 'production') {
    // Init custom logger (redirects console.log to ./out.log so that we can tail logs)
    logger();
}
let multerMemStore = multer.memoryStorage();


// @ts-ignore
/*
require('blocked-at')((time: any, stack: any) => {
    console.log(`Blocked for ${time}ms, operation started here:`, stack)
}, {
    trimFalsePositives: false,
    threshold: 100,
})
*/

@ServerSettings({
    rootDir: Path.resolve(__dirname),
    viewsDir: "${rootDir}/views",
    acceptMimes: ["application/json"],
    mount: {
        "/api/v2/": "${rootDir}/controllers/v2/*.ts",
        "/api/v1/": "${rootDir}/controllers/v1/*.ts",
    },
    port: process.env.PORT || 3000,
    componentsScan: [
        "${rootDir}/middleware/**/*.ts",
        "${rootDir}/services/**/*.ts",
        "${rootDir}/converters/**/*.ts"
    ],
    swagger: [
        {
            path: "/docs",
            showExplorer: false,
            cssPath: '${rootDir}/public/css/swagger.css',
            jsPath: '${rootDir}/public/js/swagger.js',
            operationIdFormat: 'BlocksHub.%c.%m',
        },
    ],
    logger: {
        logStart: false,
        logEnd: false,
        logRequest: false,
        disableRoutesSummary: true,
    },
    validationModelStrict: false,
    multer: {
        // see multer options
        storage: multerMemStore,
        files: 10,
    },
    httpsPort: false,
})
export class Server extends ServerLoader {
    public $onInit(): void {
        this.set("views", this.settings.get("viewsDir"));
        this.set('view engine', 'vash');
        this.engine("vash", cons.vash);
    }
    /**
     * This method let you configure the middleware required by your application to work.
     * @returns {Server}
     */
    public $beforeRoutesInit(): void | Promise<any> {

        const cookieParser = require('cookie-parser'),
            bodyParser = require('body-parser'),
            compress = require('compression'),
            methodOverride = require('method-override');

        // Disable x-powered-by
        this.expressApp.disable('x-powered-by');
        // Setup x-response-time
        this.use(responseTime({
            suffix: false
        }));
        // Dev env specific setup
        if (process.env.NODE_ENV === 'development') {
            this
                // Serve static on dev only (we use nginx for static serve in production)
                .use(Express.static(Path.join(__dirname, './public/')))
            // We also use morgan in dev (only)
            // .use(morgan('dev'))
        }
        const validHosts = [
            "https://play.blockshub.net",
            "https://www.blockshub.net",
            "https://blockshub.net",
            "http://localhost",
            "http://www.blockshub.hh",
            "http://play.blockshub.hh",
            "http://api.blockshub.hh",
        ]
        this.expressApp.use((req, res, next) => {
            let origin = req.header('origin');
            if (typeof origin === 'string') {
                for (let host of validHosts) {
                    let originToCheck = origin;
                    let secondColon = origin.indexOf(':', origin.indexOf(':') + 1);
                    if (secondColon) {
                        let originWithoutPort = origin.slice(0, secondColon);
                        if (originWithoutPort === 'http' || originWithoutPort === 'https') {
                            continue;
                        } else {
                            originToCheck = originWithoutPort;
                        }
                    }
                    if (originToCheck === host) {
                        const allowedHeaders = 'x-csrf-token, x-environment, x-lb-origin, content-type';
                        res.header('Access-Control-Allow-Origin', origin);
                        res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, DELETE, OPTIONS');
                        res.header('Access-Control-Allow-Credentials', 'true');
                        res.header('Access-Control-Expose-Headers', allowedHeaders);
                        res.header('Access-Control-Allow-Headers', allowedHeaders);
                        break;
                    }
                }
            }
            if (req.method === 'OPTIONS') {
                res.status(200).end();
            } else {
                next();
            }
        });
        // Setup sessions
        this.set('trust proxy', 1) // trust first proxy
        this.use((req: Request, res: Response, next: NextFunction) => {
            let toSkip = [
                /\/api\/v1\/game\/(\d+)\/map/g,
                /\/api\/v1\/game\/(\d+)\/scripts/g,
                /\/api\/v1\/game\/client.js/g,
            ];
            for (const skip of toSkip) {
                if (req.url.slice(0, req.url.indexOf('?')).match(skip)) {
                    console.log('skip due to match', skip);
                    return next();
                }
            }
            // @ts-ignore
            return session(req, res, next);
        });
        /*
        // internal debug
        this.use((req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
            let start = new Date().getTime();
            req.on('end', () => {
                console.log('On end');
                let end = new Date().getTime();
                console.log('['+req.method+'] '+req.url+' '+(end-start)+'ms');
            });
            next();
        });

         */
        // Setup websocket servers
        ws();
        // Setup any() middleware
        this.use(Any);


        /*
        this.use(async (req: Express.Request, res: Express.Response, next: Express.NextFunction) => {
            console.time('request_'+req.id);
            await Any(req, res, next);
            console.timeEnd('request_'+req.id);
        })
         */
        // Setup generateCspWithNonce() middleware
        this.use(generateCspWithNonce)
        // Setup Middleware
        this
            // .use(GlobalAcceptMimesMiddleware)
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
                extended: true
            }))
    }

    public $afterRoutesInit() {
        this.use(NotFoundMiddleware);
    }

    public $onReady() {
        console.log('Server started...');
    }

    public $onServerInitError(err: Error) {
        console.error(err);
    }
}

new Server().start();
