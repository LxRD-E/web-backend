/**
 * Sentry Error Logging
 */
if (process.env.NODE_ENV === 'production') {
    const Sentry = require('@sentry/node');
    Sentry.init({ dsn: 'https://dccc8567d5714c75a7b884ffd1d73843@sentry.io/2506252' });
}
console.log('staging enabled:', process.env.IS_STAGING === '1');
import * as Express from "express";
import { ServerLoader, ServerSettings } from "@tsed/common";
import "@tsed/ajv"; // import ajv ts.ed module
import "@tsed/swagger"; // import swagger Ts.ED module
import Path = require("path");
import cons = require('consolidate');
import morgan = require('morgan');
import {NotFoundMiddleware} from "./middleware/NotFound";
import logger from './helpers/Logger';
import removeSwaggerBranding from './helpers/remove-swagger-branding';
// start middleware
import session from './start/session';
import ws from './start/websockets';
import Any, {generateCspWithNonce} from './middleware/Any';
import multer = require('multer');
removeSwaggerBranding();
// If production
if (process.env.NODE_ENV === 'production') {
    // Init custom logger (redirects console.log to ./out.log so that we can tail logs)
    logger();
}
let multerMemStore = multer.memoryStorage();

/*
require('blocked-at')((time, stack) => {
    console.log(`Blocked for ${time}ms, operation started here:`, stack)
})
*/

@ServerSettings({
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
        // see multer options
        storage: multerMemStore,
        files: 10,
    },
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
        // Setup sessions
        this.set('trust proxy', 1) // trust first proxy
        this.use(session);
        // Setup websockets
        ws();
        // Setup any() middleware
        this.use(Any);
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
            }));

        // Dev env specific setup
        if (process.env.NODE_ENV === 'development') {
            this
                // Serve static on dev only (we use nginx for static serve in production)
                .use(Express.static(Path.join(__dirname, './public/')))
                // We also use morgan in dev (only)
                .use(morgan('dev'))
        }

        return null;
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
