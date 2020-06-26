/**
 * Imports
 */
import * as Billing from '../models/v1/billing';
import Config from '../helpers/config'
/*eslint-enable */
import _init from './_init';
// @ts-ignore
import Coinpayments = require('coinpayments');
/*eslint-disable */
// @ts-ignore
import checkoutNodeJssdk = require('@paypal/checkout-server-sdk');

let coinpaymentsClient: any;
if (process.env.NODE_ENV !== 'test') {
    coinpaymentsClient = new Coinpayments({
        key: Config.coinpayments.public,
        secret: Config.coinpayments.private,
    });
}
// @ts-ignore
const { verify } = require('coinpayments-ipn');

/**
 * Model used for Real-World Billing and Payments
 */
class BillingDAL extends _init {
    /**
     * Get Currency Products for Sale. Ordered by lowest price, asc
     */
    public async getCurrencyProducts(): Promise<Billing.CurrencyProducts[]> {
        return this.knex('currency_products').select(
            'currency_products.id as currencyProductId',
            'usd_price as usdPrice',
            'currency_amount as currencyAmount',
            'bonus_catalogid as bonusCatalogId',
        ).orderBy('usd_price', 'asc');
    }

    /**
     * Update a Currency Product
     * @param id 
     * @param usdPrice 
     * @param amount 
     * @param bonusCatalogId 
     */
    public async updateCurrencyProduct(id: number, usdPrice: number, amount: number, bonusCatalogId: number): Promise<void> {
        await this.knex('currency_products').update({
            'usd_price': usdPrice,
            'currency_amount': amount,
            'bonus_catalogid': bonusCatalogId,
        }).where({
            id: id,
        }).limit(1);
    }

    /**
     * Get a Currency Product by it's ID
     */
    public async getCurrencyProductById(id: number): Promise<Billing.CurrencyProducts> {
        const product = await this.knex('currency_products').select(
            'currency_products.id as currencyProductId',
            'usd_price as usdPrice',
            'currency_amount as currencyAmount',
            'bonus_catalogid as bonusCatalogId',
        ).where('id', '=', id);
        if (!product[0]) {
            throw false;
        }
        return product[0];
    }

    /**
     * Get all accepted crypto currencies
     */
    public getAcceptedCurrencies() {
        return Config.coinpayments.currency;
    }

    /**
     * Check if currency id is valid (BTC, ETH, DOGE, etc)
     * @param currency 
     */
    public isCurrencyValid(currency: string): boolean {
        for (const acceptedCurrency of Config.coinpayments.currency) {
            if (acceptedCurrency.id === currency) {
                return true;
            }
        }
        return false;
    }

    /**
     * Create a Bitcoin Transaction
     * @param {string} currency - The Config.coinpayments.currency type
     */
    public async createBitcoinTransaction(buyerEmail: string, buyerUserId: number, currencyProductId: number, currency: string): Promise<{
        amount: number;
        txn_id: string;
        address: string;
        confirms_needed: string;
        timeout: number;
        checkout_url: string;
        status_url: string;
        qrcode_url: string;
    }> {
        const productInfo = await this.getCurrencyProductById(currencyProductId);
        const info = await coinpaymentsClient.createTransaction({
            currency1: 'USD', 
            currency2: currency,
            amount: productInfo.usdPrice,
            'buyer_email': buyerEmail,
            custom: JSON.stringify({
                'userId': buyerUserId,
                'type': Billing.TransactionType.Currency,
                'productId': productInfo.currencyProductId,
                'currency': currency,
            }),
            'ipn_url': Config.coinpayments.ipn,
        });
        return info;
    }

    /**
     * Verify a Bitcoin Transaction (used for IPN url)
     * @param body 
     * @returns false = payment is not read
     */
    public async verifyCryptoTransaction(hmacHeader: string, payload: {
        'txn_id': string;
        'amount1': number;
        'amount2': number;
        'currency1': string;
        'currency2': string;
        'status': number;
        'status_text': string;
        'custom': string;
    }): Promise<{
        userId: number;
        type: Billing.TransactionType;
        productId: number;
        txId: string;
    }> {
        const isValid = verify(hmacHeader, Config.coinpayments.ipnSecret, payload);
        if (isValid) {
            const custom = JSON.parse(payload.custom) as {
                userId: number;
                type: Billing.TransactionType;
                productId: number;
                txId: string;
            };
            custom.txId = payload.txn_id;
            const productInfo = await this.getCurrencyProductById(custom.productId);
            const exists = await this.doesBitcoinTransactionExist(payload.txn_id);
            if (exists) {
                throw false;
            }
            // valid
            if (payload.currency1 !== 'USD') {
                // Invalid Currency
                throw new Error("Currency is not valid");
            }
            if (payload.amount1 < productInfo.usdPrice) {
                throw new Error("Amount is less than order price");
            }

            if (payload.status >= 100 || payload.status === 2) {
                // Payment is complete
                return custom;
            }else if (payload.status < 0) {
                // Payment error, will likely not be completed
            }else{
                // Payment is pending
            }
            throw false;
        } else {
            // invalid
            throw isValid;
        }
    }

    /**
    * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
    */
    private environment(): any {
        const clientId = Config.paypal.clientid;
        const clientSecret = Config.paypal.secret;
        if (Config.paypal.sandbox) {
            return new checkoutNodeJssdk.core.SandboxEnvironment(
                clientId, clientSecret
            );
        }else{
            return new checkoutNodeJssdk.core.LiveEnvironment(
                clientId, clientSecret
            );
        }
    }

    private client(): any {
        return new checkoutNodeJssdk.core.PayPalHttpClient(this.environment());
    }

    public async completeCurrencyOrder(orderId: string): Promise<any> {
        const payPalClient = this.client();
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const capture = await payPalClient.execute(request);
        return capture.result;
    }

    /**
     * Record a transaction internally
     */
    public async recordTransaction(usdPrice: number, usdGross: number, transactionType: Billing.TransactionType, firstNameEncrypted: string, lastNameEncrypted: string, emailEncrypted: string, captureIds: number[], productId: number): Promise<void> {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('currency_transactions').insert({
            'usd_price': usdPrice,
            'usd_gross': usdGross,
            'transaction_type': transactionType,
            'first_name': firstNameEncrypted,
            'last_name': lastNameEncrypted,
            'email': emailEncrypted,
            'captureids_json': JSON.stringify(captureIds),
            'product_id': productId,
            'date_created': date,
        });
    }

    /**
     * Record a transaction internally
     */
    public async recordBitcoinTransaction(usdPrice: number, usdGross: number, transactionType: Billing.TransactionType, firstNameEncrypted: string, lastNameEncrypted: string, emailEncrypted: string, txId: string, productId: number): Promise<void> {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('currency_transactions').insert({
            'usd_price': usdPrice,
            'usd_gross': usdGross,
            'transaction_type': transactionType,
            'first_name': firstNameEncrypted,
            'last_name': lastNameEncrypted,
            'email': emailEncrypted,
            'captureids_json': txId,
            'product_id': productId,
            'date_created': date,
        });
    }

    /**
     * Check if Bitcoin Transaction already Exists
     * @param txId
     */
    public async doesBitcoinTransactionExist(txId: string): Promise<boolean> {
        const exists = await this.knex('currency_transactions').select('id').where({
            'captureids_json': txId,
        });
        if (exists.length > 0) {
            return true;
        }
        return false;
    }

    /**
     * Get Currency Products below a specific currency amount
     * @param currencyAmount 
     */
    public async getCurrencyProductsBelowAmount(currencyAmount: number): Promise<Billing.CurrencyProducts[]> {
        const items = await this.knex('currency_products').select('currency_products.id as currencyProductId',
        'usd_price as usdPrice',
        'currency_amount as currencyAmount',
        'bonus_catalogid as bonusCatalogId',).where('currency_amount', '<', currencyAmount);
        return items;
    }
}

export default BillingDAL;
