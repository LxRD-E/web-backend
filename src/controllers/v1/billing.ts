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
import { Controller, Locals, QueryParams, BodyParams, PathParams, UseBefore, UseBeforeEach, Patch, Required, Post, HeaderParams, Get } from '@tsed/common';
import { csrf } from '../../dal/auth';
import { YesAuth } from '../../middleware/Auth';
import { Summary, Returns, Description, ReturnsArray } from '@tsed/swagger';
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
    public async getCurrencyProducts(): Promise<model.billing.CurrencyProducts[]> {
        const products = await this.billing.getCurrencyProducts();
        return products;
    }

    /**
     * Update a Currency Product
     */
    @Patch('/currency/product/:currencyProductId')
    @Summary('Update a currency product. Must be staff level 3 or higher')
    @Returns(400, {type: model.Error, description: 'PriceTooHigh: Price is above or equal to 500 USD\nInvalidCurrencyProductId: CurrencyProductId does not exist\n'})
    @Returns(401, {type: model.Error, description: 'Unauthorized: User is not authorized to perfomr this action\n'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
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
    @Post('/bitcoin/currency/ipn')
    @Summary('Verify a Bitcoin IPN Transaction')
    @Description('Used solely by coinpayments')
    public async bitcoinCurrencyIpn(
        @HeaderParams('hmac') hmacHeader: string|undefined, 
        @BodyParams() payload: any
    ): Promise<{success: true}> {
        if (!hmacHeader) {
            throw new Error('No HMAC Specified');
        }
        let data = await this.billing.verifyBitcoinTransaction(hmacHeader, payload);
        // Transaction is OK, continue
        const product = await this.billing.getCurrencyProductById(data.productId);
        const buyerEmail = await this.settings.getUserEmail(data.userId);
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
     * @param currencyProductInfo 
     */
    public async onCurrencyPurchaseSuccess(
        userInfo: model.user.UserInfo,
        currencyProductInfo: model.billing.CurrencyProducts
    ): Promise<void> {
        // Create In-Game Transaction
        await this.economy.createTransaction(userInfo.userId, 1, currencyProductInfo.currencyAmount, model.economy.currencyType.primary, model.economy.transactionType.RealWorldPurchaseOfCurrency, 'Purchase of ' + currencyProductInfo.currencyAmount, model.catalog.creatorType.User, model.catalog.creatorType.User);
        // Give Currency
        await this.economy.addToUserBalance(userInfo.userId, currencyProductInfo.currencyAmount, model.economy.currencyType.primary);
        // Give in-game item (if applicable)
        if (currencyProductInfo.bonusCatalogId !== 0) {
            const owned = await this.user.getUserInventoryByCatalogId(userInfo.userId, currencyProductInfo.bonusCatalogId);
            if (owned.length === 0) {
                await this.catalog.createItemForUserInventory(userInfo.userId, currencyProductInfo.bonusCatalogId);
                // OK
                const catalogPriceInfo = await this.catalog.getInfo(currencyProductInfo.bonusCatalogId, ['price','currency']);
                await this.economy.createTransaction(userInfo.userId, 1, 0, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRecieved, 'Bonus Item', model.catalog.creatorType.User, model.catalog.creatorType.User, currencyProductInfo.bonusCatalogId);
            }else{
                // Half the price
                const catalogPriceInfo = await this.catalog.getInfo(currencyProductInfo.bonusCatalogId, ['price','currency']);
                if (catalogPriceInfo.price !== 0) {
                    let newAmount = catalogPriceInfo.price;
                    newAmount = Math.abs(newAmount / 2);
                    // Give Amount
                    await this.economy.addToUserBalance(userInfo.userId, newAmount, catalogPriceInfo.currency);
                    // Create Transaction
                    await this.economy.createTransaction(userInfo.userId, 1, newAmount, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRefund, 'Bonus Item Currency Refund', model.catalog.creatorType.User, model.catalog.creatorType.User, currencyProductInfo.bonusCatalogId);
                }
            }
        }
        // Get Bonus Items
        const bonusItems = await this.billing.getCurrencyProductsBelowAmount(currencyProductInfo.currencyAmount);
        for (const item of bonusItems) {
            if (item.bonusCatalogId !== 0) {
                const owned = await this.user.getUserInventoryByCatalogId(userInfo.userId, item.bonusCatalogId);
                if (owned.length === 0) {
                    await this.catalog.createItemForUserInventory(userInfo.userId, item.bonusCatalogId);
                    // OK
                    const catalogPriceInfo = await this.catalog.getInfo(item.bonusCatalogId, ['price','currency']);
                    await this.economy.createTransaction(userInfo.userId, 1, 0, catalogPriceInfo.currency, model.economy.transactionType.CurrencyPurchaseBonusItemRecieved, 'Bonus Item', model.catalog.creatorType.User, model.catalog.creatorType.User, item.bonusCatalogId);
                }
            }
        }
    }

    /**
     * Create a Bitcoin Currency Transaction
     */
    @Post('/bitcoin/currency/purchase')
    @Summary('Create a Bitcoin Currency Transaction')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Returns(409, {type: model.Error, description: 'EmailVerificationRequired: Your email must be verification before purchasing something off of Hindi Gamer Club\n'})
    public async createCurrencyPurchaseBitcoin(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('currencyProductId', Number) currencyProductId: number
    ) {
        const userEmail = await this.settings.getUserEmail(userInfo.userId);
        if (!userEmail.email) {
            throw new this.Conflict('EmailVerificationRequired');
        }
        const transactionInfo = await this.billing.createBitcoinTransaction(userEmail.email, userInfo.userId, currencyProductId);
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
