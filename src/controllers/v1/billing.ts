/**
 * Imports
 */
// Models
import * as model from '../../models/models';
// Conf
import Config from '../../helpers/config';
// Autoload
import controller from '../controller';
// TSED
import {
    BodyParams,
    Controller,
    Get,
    HeaderParams,
    Locals,
    Patch,
    PathParams,
    Post,
    Required, Use,
    UseBefore,
    UseBeforeEach
} from '@tsed/common';
import {csrf} from '../../dal/auth';
import {YesAuth} from '../../middleware/Auth';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';

/**
 * Billing Controller
 */
@Controller('/billing')
export default class BillingController extends controller {

    constructor() {
        super();
    }
    /**
     * Get Currency Products for Sale
     */
    @Get('/currency/products')
    @ReturnsArray(200, {type: model.billing.CurrencyProducts})
    public getCurrencyProducts(): Promise<model.billing.CurrencyProducts[]> {
        return this.billing.getCurrencyProducts();
    }

    /**
     * Update a Currency Product
     */
    @Patch('/currency/product/:currencyProductId')
    @Summary('Update a currency product. Must be staff level 3 or higher')
    @Returns(400, {type: model.Error, description: 'PriceTooHigh: Price is above or equal to 500 USD\nInvalidCurrencyProductId: CurrencyProductId does not exist\n'})
    @Returns(401, {type: model.Error, description: 'Unauthorized: User is not authorized to perfomr this action\n'})
    @Use(csrf, YesAuth)
    public async updateCurrencyProduct(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('currencyProductId', Number) currencyProductId: number, 
        @BodyParams('usdPrice', Number) usdPrice: number, 
        @BodyParams('currencyAmount', Number) currencyAmount: number, 
        @BodyParams('bonusCatalogId', Number) bonusCatalogId: number
    ) {
        if (userInfo.staff >= 3) {
            // Validate
            if (usdPrice >= 500) {
                throw new this.BadRequest('PriceTooHigh');
            }
            try {
                await this.billing.getCurrencyProductById(currencyProductId);
            }catch{
                throw new this.BadRequest('InvalidCurrencyProductId');
            }
            // Update It
            await this.billing.updateCurrencyProduct(currencyProductId, usdPrice, currencyAmount, bonusCatalogId);
            // OK
            return {
                success: true,
            };
        }else{
            throw new this.Unauthorized('Unauthorized');
        }
    }

    /**
     * Verify a Bitcoin IPN Transaction
     */
    @Post('/currency/ipn')
    @Summary('Verify a Cryptopayments IPN Transaction')
    @Description('Used solely by coinpayments')
    public async bitcoinCurrencyIpn(
        @HeaderParams('hmac') hmacHeader: string|undefined, 
        @BodyParams() payload: any
    ): Promise<{success: true}> {
        if (!hmacHeader) {
            throw new Error('No HMAC Specified');
        }
        let data = await this.billing.verifyCryptoTransaction(hmacHeader, payload);
        // Transaction is OK, continue
        const product = await this.billing.getCurrencyProductById(data.productId);
        const buyerEmail = await this.settings.getUserEmail(data.userId);
        if (!buyerEmail) {
            throw new Error('Buyer email does not exist.');
        }
        const payerFirstName = this.auth.encrypt('', Config.encryptionKeys.payments);
        const payerLastName = this.auth.encrypt('', Config.encryptionKeys.payments);
        const payerEmailAddress = this.auth.encrypt(buyerEmail.email as string, Config.encryptionKeys.payments);
        await this.billing.recordBitcoinTransaction(product.usdPrice, product.usdPrice, model.billing.TransactionType.Currency, payerFirstName, payerLastName, payerEmailAddress, data.txId, product.currencyProductId);
        // Award
        let userInfo = new model.user.UserInfo;
        userInfo.userId = data.userId;
        await this.onCurrencyPurchaseSuccess(userInfo, product);
        // Return Success
        return {
            success: true,
        };
    }

    /**
     * Call this method when a currency purchase is validated and finished
     * @param userInfo
     * @param currencyProductInfo
     */
    public async onCurrencyPurchaseSuccess(
        userInfo: model.user.UserInfo,
        currencyProductInfo: model.billing.CurrencyProducts
    ): Promise<void> {
        const forUpdate = [
            'users',
            'user_inventory',
        ]
        await this.transaction(this, forUpdate, async function(trx) {
            // Create In-Game Transaction
            await trx.economy.createTransaction(userInfo.userId, 1, currencyProductInfo.currencyAmount, model.economy.currencyType.primary, model.economy.transactionType.RealWorldPurchaseOfCurrency, 'Purchase of ' + currencyProductInfo.currencyAmount, model.catalog.creatorType.User, model.catalog.creatorType.User);
            // Give Currency
            await trx.economy.addToUserBalanceV2(userInfo.userId, currencyProductInfo.currencyAmount, model.economy.currencyType.primary);
            // Check if has referer
            try {
                const refer = await this.userReferral.getReferralUsedByUser(userInfo.userId);
                // give 10% bonus to user
                const amt = Math.floor(currencyProductInfo.currencyAmount * 0.1);
                if (!Number.isInteger(amt)) {
                    throw new Error('Referral amount is not an integer: '+amt+' '+typeof amt);
                }
                await trx.economy.addToUserBalanceV2(refer.userId, amt , model.economy.currencyType.primary);
                // create transaction
                await trx.economy.createTransaction(refer.userId, userInfo.userId, amt, model.economy.currencyType.primary, model.economy.transactionType.ReferralUserCurrencyPurchase, 'Referral Currency Purchase', model.catalog.creatorType.User, model.catalog.creatorType.User);
            }catch(err) {
                if (err !instanceof this.NotFound) {
                    throw err;
                }
            }
            // Give in-game item (if applicable)
            let msg = `Hello\nYour currency purchase of ${currencyProductInfo.currencyAmount} currency has successfully completed. `;
            let bonusRecieved = 0;
            if (currencyProductInfo.bonusCatalogId !== 0) {
                const owned = await trx.user.getUserInventoryByCatalogId(userInfo.userId, currencyProductInfo.bonusCatalogId);
                if (owned.length === 0) {
                    await trx.catalog.createItemForUserInventory(userInfo.userId, currencyProductInfo.bonusCatalogId);
                    // OK
                    const catalogPriceInfo = await trx.catalog.getInfo(currencyProductInfo.bonusCatalogId, ['price','currency']);
                    await trx.economy.createTransaction(userInfo.userId, 1, 0, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRecieved, 'Bonus Item', model.catalog.creatorType.User, model.catalog.creatorType.User, currencyProductInfo.bonusCatalogId);
                }else{
                    // Half the price
                    const catalogPriceInfo = await trx.catalog.getInfo(currencyProductInfo.bonusCatalogId, ['price','currency']);
                    if (catalogPriceInfo.price !== 0) {
                        let newAmount = catalogPriceInfo.price;
                        newAmount = Math.abs(newAmount / 2);
                        // Give Amount
                        await trx.economy.addToUserBalance(userInfo.userId, newAmount, catalogPriceInfo.currency);
                        // Create Transaction
                        await trx.economy.createTransaction(userInfo.userId, 1, newAmount, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRefund, 'Bonus Item Currency Refund', model.catalog.creatorType.User, model.catalog.creatorType.User, currencyProductInfo.bonusCatalogId);
                        bonusRecieved += newAmount;
                    }
                }
            }
            // Get Bonus Items
            const bonusItems = await trx.billing.getCurrencyProductsBelowAmount(currencyProductInfo.currencyAmount);
            for (const item of bonusItems) {
                if (item.bonusCatalogId !== 0) {
                    const owned = await trx.user.getUserInventoryByCatalogId(userInfo.userId, item.bonusCatalogId);
                    if (owned.length === 0) {
                        await trx.catalog.createItemForUserInventory(userInfo.userId, item.bonusCatalogId);
                        // OK
                        const catalogPriceInfo = await trx.catalog.getInfo(item.bonusCatalogId, ['price','currency']);
                        await trx.economy.createTransaction(userInfo.userId, 1, 0, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRecieved, 'Bonus Item', model.catalog.creatorType.User, model.catalog.creatorType.User, item.bonusCatalogId);
                    }
                }
            }
            if (bonusRecieved > 0) {
                msg += `You also received an additional ${bonusRecieved} Currency since you already owned the bonus item. `;
            }
            // finish message
            msg+=`This message will serve as your official rreceipt\n\nThank you for your purchase,\n-BlocksHub`;
            // create message for user
            await trx.notification.createMessage(userInfo.userId, 1, 'Currency Purchase Complete', msg);
        });
    }

    @Get('/accepted-currencies')
    @Summary('Get accepted currencies')
    public getAcceptedCurrencies() {
        return this.billing.getAcceptedCurrencies();
    }

    /**
     * Create a Crypto Currency Transaction
     */
    @Post('/currency/purchase')
    @Summary('Create a Crypto-Currency Currency Transaction')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Returns(409, {type: model.Error, description: 'EmailVerificationRequired: Your email must be verification before purchasing something off of BlocksHub\n'})
    public async createCurrencyPurchaseBitcoin(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('currencyProductId', Number) currencyProductId: number,
        @Required()
        @BodyParams('currency', String) currency = 'BTC',
    ) {
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

    /**
     * Validate a Currency Purchase
     */
    private tempDisabledPaypalEndpointOne = `
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
