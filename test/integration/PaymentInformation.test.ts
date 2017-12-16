import { app } from '../../src/app';
import { Logger as LoggerType } from '../../src/core/Logger';
import { Types, Core, Targets } from '../../src/constants';
import * as _ from 'lodash';
import { TestUtil } from './lib/TestUtil';
import { TestDataService } from '../../src/api/services/TestDataService';

import { ValidationException } from '../../src/api/exceptions/ValidationException';
import { NotFoundException } from '../../src/api/exceptions/NotFoundException';

import { PaymentInformation } from '../../src/api/models/PaymentInformation';
import { PaymentType } from '../../src/api/enums/PaymentType';
import { EscrowType } from '../../src/api/enums/EscrowType';
import { Currency } from '../../src/api/enums/Currency';
import { CryptocurrencyAddressType } from '../../src/api/enums/CryptocurrencyAddressType';

import { PaymentInformationService } from '../../src/api/services/PaymentInformationService';

describe('PaymentInformation', () => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = process.env.JASMINE_TIMEOUT;

    const log: LoggerType = new LoggerType(__filename);
    const testUtil = new TestUtil();

    let testDataService: TestDataService;
    let paymentInformationService: PaymentInformationService;

    let createdId;

    const testData = {
        type: PaymentType.SALE,
        escrow: {
            type: EscrowType.MAD,
            ratio: {
                buyer: 100,
                seller: 100
            }
        },
        itemPrice: [{
            currency: Currency.BITCOIN,
            basePrice: 0.0001,
            shippingPrice: {
                domestic: 0.123,
                international: 1.234
            },
            address: {
                type: CryptocurrencyAddressType.NORMAL,
                address: '1234'
            }
        }]
    };

    const testDataUpdated = {
        type: PaymentType.FREE,
        escrow: {
            type: EscrowType.NOP,
            ratio: {
                buyer: 0,
                seller: 0
            }
        },
        itemPrice: [{
            currency: Currency.PARTICL,
            basePrice: 0.002,
            shippingPrice: {
                domestic: 1.234,
                international: 2.345
            },
            address: {
                type: CryptocurrencyAddressType.STEALTH,
                address: '4567'
            }
        }]
    };

    beforeAll(async () => {
        await testUtil.bootstrapAppContainer(app);  // bootstrap the app

        testDataService = app.IoC.getNamed<TestDataService>(Types.Service, Targets.Service.TestDataService);
        paymentInformationService = app.IoC.getNamed<PaymentInformationService>(Types.Service, Targets.Service.PaymentInformationService);

        // clean up the db, first removes all data and then seeds the db with default data
        await testDataService.clean([]);
    });

    afterAll(async () => {
        //
    });

    test('Should throw ValidationException because there is no listing_item_id or listing_item_template_id', async () => {
        expect.assertions(1);
        await paymentInformationService.create(testData).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should create a new payment information', async () => {
        testData['listing_item_template_id'] = 0;

        const paymentInformationModel: PaymentInformation = await paymentInformationService.create(testData);
        createdId = paymentInformationModel.Id;

        const result = paymentInformationModel.toJSON();

        expect(result.type).toBe(testData.type);
        expect(result.Escrow.type).toBe(testData.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(testData.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(testData.escrow.ratio.seller);
        expect(result.ItemPrice[0].currency).toBe(testData.itemPrice[0].currency);
        expect(result.ItemPrice[0].basePrice).toBe(testData.itemPrice[0].basePrice);
        expect(result.ItemPrice[0].ShippingPrice.domestic).toBe(testData.itemPrice[0].shippingPrice.domestic);
        expect(result.ItemPrice[0].ShippingPrice.international).toBe(testData.itemPrice[0].shippingPrice.international);
        expect(result.ItemPrice[0].Address.type).toBe(testData.itemPrice[0].address.type);
        expect(result.ItemPrice[0].Address.address).toBe(testData.itemPrice[0].address.address);
    });

    test('Should throw ValidationException because we want to create a empty payment information', async () => {
        expect.assertions(1);
        await paymentInformationService.create({}).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should list payment informations with our new create one', async () => {
        const paymentInformationCollection = await paymentInformationService.findAll();
        const paymentInformation = paymentInformationCollection.toJSON();
        expect(paymentInformation.length).toBe(1);

        const result = paymentInformation[0];
        expect(result.type).toBe(testData.type); // findall doesnt return relations by default
    });

    test('Should return one payment information', async () => {
        const paymentInformationModel: PaymentInformation = await paymentInformationService.findOne(createdId);
        const result = paymentInformationModel.toJSON();

        expect(result.type).toBe(testData.type);
        expect(result.Escrow.type).toBe(testData.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(testData.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(testData.escrow.ratio.seller);
        expect(result.ItemPrice[0].currency).toBe(testData.itemPrice[0].currency);
        expect(result.ItemPrice[0].basePrice).toBe(testData.itemPrice[0].basePrice);
        expect(result.ItemPrice[0].ShippingPrice.domestic).toBe(testData.itemPrice[0].shippingPrice.domestic);
        expect(result.ItemPrice[0].ShippingPrice.international).toBe(testData.itemPrice[0].shippingPrice.international);
        expect(result.ItemPrice[0].Address.type).toBe(testData.itemPrice[0].address.type);
        expect(result.ItemPrice[0].Address.address).toBe(testData.itemPrice[0].address.address);
    });

    test('Should throw ValidationException because there is no listing_item_id or listing_item_template_id', async () => {
        expect.assertions(1);
        await paymentInformationService.update(createdId, testDataUpdated).catch(e =>
            expect(e).toEqual(new ValidationException('Request body is not valid', []))
        );
    });

    test('Should update the payment information', async () => {
        testDataUpdated['listing_item_template_id'] = 0;
        const paymentInformationModel: PaymentInformation = await paymentInformationService.update(createdId, testDataUpdated);
        const result = paymentInformationModel.toJSON();

        expect(result.type).toBe(testDataUpdated.type);
        expect(result.Escrow.type).toBe(testDataUpdated.escrow.type);
        expect(result.Escrow.Ratio.buyer).toBe(testDataUpdated.escrow.ratio.buyer);
        expect(result.Escrow.Ratio.seller).toBe(testDataUpdated.escrow.ratio.seller);
        expect(result.ItemPrice[0].currency).toBe(testDataUpdated.itemPrice[0].currency);
        expect(result.ItemPrice[0].basePrice).toBe(testDataUpdated.itemPrice[0].basePrice);
        expect(result.ItemPrice[0].ShippingPrice.domestic).toBe(testDataUpdated.itemPrice[0].shippingPrice.domestic);
        expect(result.ItemPrice[0].ShippingPrice.international).toBe(testDataUpdated.itemPrice[0].shippingPrice.international);
        expect(result.ItemPrice[0].Address.type).toBe(testDataUpdated.itemPrice[0].address.type);
        expect(result.ItemPrice[0].Address.address).toBe(testDataUpdated.itemPrice[0].address.address);
    });

    test('Should delete the payment information', async () => {
        expect.assertions(1);
        await paymentInformationService.destroy(createdId);
        await paymentInformationService.findOne(createdId).catch(e =>
            expect(e).toEqual(new NotFoundException(createdId))
        );
    });

});
