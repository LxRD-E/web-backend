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
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../../models/models");
const config_1 = require("../../helpers/config");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const auth_1 = require("../../dal/auth");
const Auth_1 = require("../../middleware/Auth");
const swagger_1 = require("@tsed/swagger");
let BillingController = class BillingController extends controller_1.default {
    constructor() {
        super();
        this.tempDisabledPaypalEndpointOne = `
    public async validatePaypalCurrencyPurchase(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        orderId: string
    ): Promise<{ success: true }> {
        // Try to grab stuff
        try {
            // Charge User
            const order = await this.billing.completeCurrencyOrder(orderId);
            // If completed
            if (order.status === "COMPLETED") {
                const purchaseUnit = order.purchase_units[0];
                let currencyProductInfo = await this.billing.getCurrencyProductById(parseInt(purchaseUnit.reference_id));

                let amtPaid = 0;
                let amtPaidAfterFees = 0;
                const captureIds = [];
                for (const payment of purchaseUnit.payments.captures) {
                    if (payment.status === "COMPLETED" && payment.amount.currency_code === "USD") {
                        amtPaid += parseFloat(payment.amount.value);
                        amtPaidAfterFees += parseFloat(payment.seller_receivable_breakdown.net_amount.value);
                        captureIds.push(payment.id);
                    }
                }
                if (amtPaid < currencyProductInfo.usdPrice) {
                    // Not enough payment(s)
                    console.log('Not enough payment');
                    console.log(amtPaid);
                    throw new Error('Not enough was paid');
                }
                // So far so good
                const payerFirstName = this.auth.encrypt(order.payer.name.given_name, Config.encryptionKeys.payments);
                const payerLastName = this.auth.encrypt(order.payer.name.surname, Config.encryptionKeys.payments);
                const payerEmailAddress = this.auth.encrypt(order.payer.email_address, Config.encryptionKeys.payments);
                // Create Transaction
                await this.billing.recordTransaction(amtPaid, amtPaidAfterFees, model.billing.TransactionType.Currency, payerFirstName, payerLastName, payerEmailAddress, captureIds, purchaseUnit.reference_id);
                // Await
                await this.onCurrencyPurchaseSuccess(userInfo, currencyProductInfo);
                // Return Success
                return {
                    success: true,
                };
            } else {
                throw new this.BadRequest('PaymentCancelled');
            }
        } catch (e) {
            console.log(e);
            throw e;
        }
    }
    `;
    }
    getCurrencyProducts() {
        return this.billing.getCurrencyProducts();
    }
    async updateCurrencyProduct(userInfo, currencyProductId, usdPrice, currencyAmount, bonusCatalogId) {
        if (userInfo.staff >= 3) {
            if (usdPrice >= 500) {
                throw new this.BadRequest('PriceTooHigh');
            }
            try {
                await this.billing.getCurrencyProductById(currencyProductId);
            }
            catch {
                throw new this.BadRequest('InvalidCurrencyProductId');
            }
            await this.billing.updateCurrencyProduct(currencyProductId, usdPrice, currencyAmount, bonusCatalogId);
            return {
                success: true,
            };
        }
        else {
            throw new this.Unauthorized('Unauthorized');
        }
    }
    async bitcoinCurrencyIpn(hmacHeader, payload) {
        if (!hmacHeader) {
            throw new Error('No HMAC Specified');
        }
        let data = await this.billing.verifyCryptoTransaction(hmacHeader, payload);
        const product = await this.billing.getCurrencyProductById(data.productId);
        const buyerEmail = await this.settings.getUserEmail(data.userId);
        if (!buyerEmail) {
            throw new Error('Buyer email does not exist.');
        }
        const payerFirstName = this.auth.encrypt('', config_1.default.encryptionKeys.payments);
        const payerLastName = this.auth.encrypt('', config_1.default.encryptionKeys.payments);
        const payerEmailAddress = this.auth.encrypt(buyerEmail.email, config_1.default.encryptionKeys.payments);
        await this.billing.recordBitcoinTransaction(product.usdPrice, product.usdPrice, model.billing.TransactionType.Currency, payerFirstName, payerLastName, payerEmailAddress, data.txId, product.currencyProductId);
        let userInfo = new model.user.UserInfo;
        userInfo.userId = data.userId;
        await this.onCurrencyPurchaseSuccess(userInfo, product);
        return {
            success: true,
        };
    }
    async onCurrencyPurchaseSuccess(userInfo, currencyProductInfo) {
        const forUpdate = [
            'users',
            'user_inventory',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            await trx.economy.createTransaction(userInfo.userId, 1, currencyProductInfo.currencyAmount, model.economy.currencyType.primary, model.economy.transactionType.RealWorldPurchaseOfCurrency, 'Purchase of ' + currencyProductInfo.currencyAmount, model.catalog.creatorType.User, model.catalog.creatorType.User);
            await trx.economy.addToUserBalanceV2(userInfo.userId, currencyProductInfo.currencyAmount, model.economy.currencyType.primary);
            try {
                const refer = await this.userReferral.getReferralUsedByUser(userInfo.userId);
                const amt = Math.floor(currencyProductInfo.currencyAmount * 0.1);
                if (!Number.isInteger(amt)) {
                    throw new Error('Referral amount is not an integer: ' + amt + ' ' + typeof amt);
                }
                await trx.economy.addToUserBalanceV2(refer.userId, amt, model.economy.currencyType.primary);
                await trx.economy.createTransaction(refer.userId, userInfo.userId, amt, model.economy.currencyType.primary, model.economy.transactionType.ReferralUserCurrencyPurchase, 'Referral Currency Purchase', model.catalog.creatorType.User, model.catalog.creatorType.User);
            }
            catch (err) {
                if (err instanceof this.NotFound) {
                    throw err;
                }
            }
            let msg = `Hello\nYour currency purchase of ${currencyProductInfo.currencyAmount} currency has successfully completed. `;
            let bonusRecieved = 0;
            if (currencyProductInfo.bonusCatalogId !== 0) {
                const owned = await trx.user.getUserInventoryByCatalogId(userInfo.userId, currencyProductInfo.bonusCatalogId);
                if (owned.length === 0) {
                    await trx.catalog.createItemForUserInventory(userInfo.userId, currencyProductInfo.bonusCatalogId);
                    const catalogPriceInfo = await trx.catalog.getInfo(currencyProductInfo.bonusCatalogId, ['price', 'currency']);
                    await trx.economy.createTransaction(userInfo.userId, 1, 0, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRecieved, 'Bonus Item', model.catalog.creatorType.User, model.catalog.creatorType.User, currencyProductInfo.bonusCatalogId);
                }
                else {
                    const catalogPriceInfo = await trx.catalog.getInfo(currencyProductInfo.bonusCatalogId, ['price', 'currency']);
                    if (catalogPriceInfo.price !== 0) {
                        let newAmount = catalogPriceInfo.price;
                        newAmount = Math.abs(newAmount / 2);
                        await trx.economy.addToUserBalance(userInfo.userId, newAmount, catalogPriceInfo.currency);
                        await trx.economy.createTransaction(userInfo.userId, 1, newAmount, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRefund, 'Bonus Item Currency Refund', model.catalog.creatorType.User, model.catalog.creatorType.User, currencyProductInfo.bonusCatalogId);
                        bonusRecieved += newAmount;
                    }
                }
            }
            const bonusItems = await trx.billing.getCurrencyProductsBelowAmount(currencyProductInfo.currencyAmount);
            for (const item of bonusItems) {
                if (item.bonusCatalogId !== 0) {
                    const owned = await trx.user.getUserInventoryByCatalogId(userInfo.userId, item.bonusCatalogId);
                    if (owned.length === 0) {
                        await trx.catalog.createItemForUserInventory(userInfo.userId, item.bonusCatalogId);
                        const catalogPriceInfo = await trx.catalog.getInfo(item.bonusCatalogId, ['price', 'currency']);
                        await trx.economy.createTransaction(userInfo.userId, 1, 0, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRecieved, 'Bonus Item', model.catalog.creatorType.User, model.catalog.creatorType.User, item.bonusCatalogId);
                    }
                }
            }
            if (bonusRecieved > 0) {
                msg += `You also received an additional ${bonusRecieved} Currency since you already owned the bonus item. `;
            }
            msg += `This message will serve as your official rreceipt\n\nThank you for your purchase,\n-BlocksHub`;
            await trx.notification.createMessage(userInfo.userId, 1, 'Currency Purchase Complete', msg);
        });
    }
    getAcceptedCurrencies() {
        return this.billing.getAcceptedCurrencies();
    }
    async createCurrencyPurchaseBitcoin(userInfo, currencyProductId, currency = 'BTC') {
        let isValid = this.billing.isCurrencyValid(currency);
        if (!isValid) {
            throw new this.BadRequest('InvalidCurrency');
        }
        const userEmail = await this.settings.getUserEmail(userInfo.userId);
        if (!userEmail || !userEmail.email) {
            throw new this.Conflict('EmailVerificationRequired');
        }
        const transactionInfo = await this.billing.createBitcoinTransaction(userEmail.email, userInfo.userId, currencyProductId, currency);
        return {
            url: transactionInfo.checkout_url,
            success: true,
        };
    }
};
__decorate([
    common_1.Get('/currency/products'),
    swagger_1.ReturnsArray(200, { type: model.billing.CurrencyProducts }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "getCurrencyProducts", null);
__decorate([
    common_1.Patch('/currency/product/:currencyProductId'),
    swagger_1.Summary('Update a currency product. Must be staff level 3 or higher'),
    swagger_1.Returns(400, { type: model.Error, description: 'PriceTooHigh: Price is above or equal to 500 USD\nInvalidCurrencyProductId: CurrencyProductId does not exist\n' }),
    swagger_1.Returns(401, { type: model.Error, description: 'Unauthorized: User is not authorized to perfomr this action\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('currencyProductId', Number)),
    __param(2, common_1.BodyParams('usdPrice', Number)),
    __param(3, common_1.BodyParams('currencyAmount', Number)),
    __param(4, common_1.BodyParams('bonusCatalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "updateCurrencyProduct", null);
__decorate([
    common_1.Post('/currency/ipn'),
    swagger_1.Summary('Verify a Cryptopayments IPN Transaction'),
    swagger_1.Description('Used solely by coinpayments'),
    __param(0, common_1.HeaderParams('hmac')),
    __param(1, common_1.BodyParams()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "bitcoinCurrencyIpn", null);
__decorate([
    common_1.Get('/accepted-currencies'),
    swagger_1.Summary('Get accepted currencies'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getAcceptedCurrencies", null);
__decorate([
    common_1.Post('/currency/purchase'),
    swagger_1.Summary('Create a Crypto-Currency Currency Transaction'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Returns(409, { type: model.Error, description: 'EmailVerificationRequired: Your email must be verification before purchasing something off of BlocksHub\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('currencyProductId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('currency', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Object]),
    __metadata("design:returntype", Promise)
], BillingController.prototype, "createCurrencyPurchaseBitcoin", null);
BillingController = __decorate([
    common_1.Controller('/billing'),
    __metadata("design:paramtypes", [])
], BillingController);
exports.default = BillingController;

