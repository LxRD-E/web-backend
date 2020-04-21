"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
if (process.env.NODE_ENV === 'production') {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: 'https://dccc8567d5714c75a7b884ffd1d73843@sentry.io/2506252' });
}
console.log('staging enabled:', process.env.IS_STAGING === '1');
const Express = require("express");
const common_1 = require("@tsed/common");
require("@tsed/ajv");
require("@tsed/swagger");
const Path = require("path");
const cons = require("consolidate");
const morgan = require("morgan");
const NotFound_1 = require("./middleware/NotFound");
const Logger_1 = require("./helpers/Logger");
const remove_swagger_branding_1 = require("./helpers/remove-swagger-branding");
const session_1 = require("./start/session");
const websockets_1 = require("./start/websockets");
const Any_1 = require("./middleware/Any");
const multer = require("multer");
remove_swagger_branding_1.default();
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
        this.set('trust proxy', 1);
        this.use(session_1.default);
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
        if (process.env.NODE_ENV === 'development') {
            this
                .use(Express.static(Path.join(__dirname, './public/')))
                .use(morgan('dev'));
        }
        return null;
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
            "/": "${rootDir}/controllers/web/*.ts",
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
        validationModelStrict: true,
        multer: {
            storage: multerMemStore,
            files: 10,
        },
    })
], Server);
exports.Server = Server;
new Server().start();
//# sourceMappingURL=server.js.map