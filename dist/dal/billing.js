"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Billing = require("../models/v1/billing");
const config_1 = require("../helpers/config");
const _init_1 = require("./_init");
const Coinpayments = require("coinpayments");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk");
let coinpaymentsClient;
if (process.env.NODE_ENV !== 'test') {
    coinpaymentsClient = new Coinpayments({
        key: config_1.default.coinpayments.public,
        secret: config_1.default.coinpayments.private,
    });
}
const { verify } = require('coinpayments-ipn');
class BillingDAL extends _init_1.default {
    async getCurrencyProducts() {
        return this.knex('currency_products').select('currency_products.id as currencyProductId', 'usd_price as usdPrice', 'currency_amount as currencyAmount', 'bonus_catalogid as bonusCatalogId').orderBy('usd_price', 'asc');
    }
    async updateCurrencyProduct(id, usdPrice, amount, bonusCatalogId) {
        await this.knex('currency_products').update({
            'usd_price': usdPrice,
            'currency_amount': amount,
            'bonus_catalogid': bonusCatalogId,
        }).where({
            id: id,
        }).limit(1);
    }
    async getCurrencyProductById(id) {
        const product = await this.knex('currency_products').select('currency_products.id as currencyProductId', 'usd_price as usdPrice', 'currency_amount as currencyAmount', 'bonus_catalogid as bonusCatalogId').where('id', '=', id);
        if (!product[0]) {
            throw false;
        }
        return product[0];
    }
    getAcceptedCurrencies() {
        return config_1.default.coinpayments.currency;
    }
    isCurrencyValid(currency) {
        for (const acceptedCurrency of config_1.default.coinpayments.currency) {
            if (acceptedCurrency.id === currency) {
                return true;
            }
        }
        return false;
    }
    async createBitcoinTransaction(buyerEmail, buyerUserId, currencyProductId, currency) {
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
            'ipn_url': config_1.default.coinpayments.ipn,
        });
        return info;
    }
    async verifyCryptoTransaction(hmacHeader, payload) {
        const isValid = verify(hmacHeader, config_1.default.coinpayments.ipnSecret, payload);
        if (isValid) {
            const custom = JSON.parse(payload.custom);
            custom.txId = payload.txn_id;
            const productInfo = await this.getCurrencyProductById(custom.productId);
            const exists = await this.doesBitcoinTransactionExist(payload.txn_id);
            if (exists) {
                throw false;
            }
            if (payload.currency1 !== 'USD') {
                throw new Error("Currency is not valid");
            }
            if (payload.amount1 < productInfo.usdPrice) {
                throw new Error("Amount is less than order price");
            }
            if (payload.status >= 100 || payload.status === 2) {
                return custom;
            }
            else if (payload.status < 0) {
            }
            else {
            }
            throw false;
        }
        else {
            throw isValid;
        }
    }
    environment() {
        const clientId = config_1.default.paypal.clientid;
        const clientSecret = config_1.default.paypal.secret;
        if (config_1.default.paypal.sandbox) {
            return new checkoutNodeJssdk.core.SandboxEnvironment(clientId, clientSecret);
        }
        else {
            return new checkoutNodeJssdk.core.LiveEnvironment(clientId, clientSecret);
        }
    }
    client() {
        return new checkoutNodeJssdk.core.PayPalHttpClient(this.environment());
    }
    async completeCurrencyOrder(orderId) {
        const payPalClient = this.client();
        const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
        request.requestBody({});
        const capture = await payPalClient.execute(request);
        return capture.result;
    }
    async recordTransaction(usdPrice, usdGross, transactionType, firstNameEncrypted, lastNameEncrypted, emailEncrypted, captureIds, productId) {
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
    async recordBitcoinTransaction(usdPrice, usdGross, transactionType, firstNameEncrypted, lastNameEncrypted, emailEncrypted, txId, productId) {
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
    async doesBitcoinTransactionExist(txId) {
        const exists = await this.knex('currency_transactions').select('id').where({
            'captureids_json': txId,
        });
        if (exists.length > 0) {
            return true;
        }
        return false;
    }
    async getCurrencyProductsBelowAmount(currencyAmount) {
        const items = await this.knex('currency_products').select('currency_products.id as currencyProductId', 'usd_price as usdPrice', 'currency_amount as currencyAmount', 'bonus_catalogid as bonusCatalogId').where('currency_amount', '<', currencyAmount);
        return items;
    }
}
exports.default = BillingDAL;

