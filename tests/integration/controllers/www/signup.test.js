const assert = require('assert');
const puppeteer = require('puppeteer');
const crypto = require('crypto');
const util = require('util');
const sleep = util.promisify(setTimeout);

const base = 'http://localhost:3000/';
// start browser
describe('/signup', () => {
    it('[desktop] Should signup a new user and redirect to /dashboard', async () => {
        console.warn('    [warning] signup.test.js is temporarily disabled');
        /*
        const usernameToUse = crypto.randomBytes(8).toString('hex');
        const passwordToUse = `$e3ur3pa$$w0rd`;
        let browser = await puppeteer.launch({
            headless: false,
        });
        const page = await browser.newPage();
        await page.setViewport({
            height: 788,
            width: 1366,
        });
        console.log('await goto');
        page.goto(`${base}signup`);
        console.log('await networkidle0');
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        console.log('await username field');
        const usernameField = await page.waitForSelector('#username');
        await usernameField.type(usernameToUse);
        const pass = await page.waitForSelector('#password');
        await pass.type(passwordToUse);
        const confirmPass = await page.waitForSelector('#confirmPassword');
        await confirmPass.type(passwordToUse);
        const birthYear = await page.waitForSelector('#birthYearFormSelect');
        await birthYear.click();
        await birthYear.select('1999');
        const birthMonth = await page.waitForSelector('#birthMonthFormSelect');
        await birthMonth.click();
        const day = await page.waitForSelector('#birthMonthFormSelect');
        await day.click();
        await sleep(2500);
        console.log('clicking');
        const signupButton = await page.waitForSelector('#signUpButton');
        await signupButton.click();

        console.log('sleep');
        await sleep(5000);
        */
    }).timeout(10000);
});