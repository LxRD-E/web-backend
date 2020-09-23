"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Sentry = require("./helpers/sentry");
if (process.env.NODE_ENV === 'production') {
    Sentry.init();
}
console.log('[info] staging enabled:', process.env.IS_STAGING === '1');
const Express = require("express");
const common_1 = require("@tsed/common");
require("@tsed/ajv");
require("@tsed/swagger");
const Path = require("path");
const responseTime = require("response-time");
const cons = require("consolidate");
const NotFound_1 = require("./middleware/NotFound");
const Logger_1 = require("./helpers/Logger");
require("./events/setup");
const session_1 = require("./start/session");
const websockets_1 = require("./start/websockets");
const Any_1 = require("./middleware/Any");
const multer = require("multer");
if (process.env.NODE_ENV === 'production') {
    Logger_1.default();
}
let multerMemStore = multer.memoryStorage();
let Server = class Server extends common_1.ServerLoader {
    $onInit() {
        this.set("views", this.settings.get("viewsDir"));
        this.set('view engine', 'vash');
        this.engine("vash", cons.vash);
    }
    $beforeRoutesInit() {
        const cookieParser = require('cookie-parser'), bodyParser = require('body-parser'), compress = require('compression'), methodOverride = require('method-override');
        this.expressApp.disable('x-powered-by');
        this.use(responseTime({
            suffix: false
        }));
        if (process.env.NODE_ENV === 'development') {
            this
                .use(Express.static(Path.join(__dirname, './public/')));
        }
        const validHosts = [
            "https://play.blockshub.net",
            "https://www.blockshub.net",
            "https://blockshub.net",
            "http://localhost",
            "http://www.blockshub.hh",
            "http://play.blockshub.hh",
            "http://api.blockshub.hh",
        ];
        this.expressApp.use((req, res, next) => {
            let origin = req.header('origin');
            if (typeof origin === 'string') {
                for (let host of validHosts) {
                    let originToCheck = origin;
                    let secondColon = origin.indexOf(':', origin.indexOf(':') + 1);
                    if (secondColon !== -1) {
                        let originWithoutPort = origin.slice(0, secondColon);
                        if (originWithoutPort === 'http' || originWithoutPort === 'https') {
                            continue;
                        }
                        else {
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
            }
            else {
                next();
            }
        });
        this.set('trust proxy', 1);
        this.use((req, res, next) => {
            let toSkip = [
                /\/api\/v1\/game\/(\d+)\/map/g,
                /\/api\/v1\/game\/(\d+)\/scripts/g,
                /\/api\/v1\/game\/client.js/g,
            ];
            for (const skip of toSkip) {
                if (req.url.slice(0, req.url.indexOf('?')).match(skip)) {
                    return next();
                }
            }
            return session_1.default(req, res, next);
        });
        websockets_1.default();
        this.use(Any_1.default);
        this.use(Any_1.generateCspWithNonce);
        this
            .use(cookieParser())
            .use(compress({}))
            .use(methodOverride())
            .use(bodyParser.json())
            .use(bodyParser.urlencoded({
            extended: true
        }));
    }
    $afterRoutesInit() {
        this.use(NotFound_1.NotFoundMiddleware);
    }
    $onReady() {
        console.log('Server started...');
    }
    $onServerInitError(err) {
        console.error(err);
    }
};
Server = __decorate([
    common_1.ServerSettings({
        rootDir: Path.resolve(__dirname),
        viewsDir: "${rootDir}/views",
        acceptMimes: ["application/json"],
        mount: {
            "/api/v2/": "${rootDir}/controllers/v2/*.ts",
            "/api/v1/": "${rootDir}/controllers/v1/*.ts",
            '/': '${rootDir}/controllers/default.ts',
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
            storage: multerMemStore,
            files: 10,
        },
        httpsPort: false,
    })
], Server);
exports.Server = Server;
new Server().start();

