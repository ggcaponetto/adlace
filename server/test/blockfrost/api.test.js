import assert from 'assert';
import chai from "chai";
import winston from "winston";
import * as dotenv from 'dotenv'
import Blockfrost from "../../src/blockfrost/api.js"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

// configure the logger
const mochaLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({})
    ]
});

describe('Environment', function () {
    describe('should import .env file', function () {
        it('should read the mainnet blockfrost project id', function () {
            let bf = process.env.BLOCKFROST_MAINNET;
            chai.expect(bf).to.be.a("string");
        });
    });
});
describe('Version', function () {
    describe('should get the api version', function () {
        it('get the version from the package.json', function () {
            let api = new Blockfrost({});
            let v = api.getVersion();
            chai.expect(v).to.be.a("string");
        });
    });
});
describe('API', function () {
    describe('should get the address', function () {
        it('get address', async function () {
            let blockfrostOptions = {
                baseUrl: "https://cardano-mainnet.blockfrost.io",
                project_id: process.env.BLOCKFROST_MAINNET
            }
            let api = new Blockfrost(blockfrostOptions);
            let res = await api.getAddress("addr1qxqs59lphg8g6qndelq8xwqn60ag3aeyfcp33c2kdp46a09re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09qsgy6pz");
            chai.expect(res.data).to.be.a("object");
            chai.expect(res.status).to.equal(200);
        });
        it('get address utxos', async function () {
            let blockfrostOptions = {
                baseUrl: "https://cardano-mainnet.blockfrost.io",
                project_id: process.env.BLOCKFROST_MAINNET
            }
            let api = new Blockfrost(blockfrostOptions);
            let res = await api.getAddressUTXOs("addr1qxqs59lphg8g6qndelq8xwqn60ag3aeyfcp33c2kdp46a09re5df3pzwwmyq946axfcejy5n4x0y99wqpgtp2gd0k09qsgy6pz");
            chai.expect(res.data).to.be.a("array");
            chai.expect(res.status).to.equal(200);
        });
        it('get transaction metadata labels', async function () {
            this.timeout(20000);
            let blockfrostOptions = {
                baseUrl: "https://cardano-mainnet.blockfrost.io",
                project_id: process.env.BLOCKFROST_MAINNET
            }
            let api = new Blockfrost(blockfrostOptions);

            let res = await api.getTransactionMetadataLabels(`?count=100&page=1&order=desc`);
            chai.expect(res.data).to.be.a("array");
            chai.expect(res.status).to.equal(200);
        });
        it('get transaction metadata json by label', async function () {
            this.timeout(30000);
            let blockfrostOptions = {
                baseUrl: "https://cardano-mainnet.blockfrost.io",
                project_id: process.env.BLOCKFROST_MAINNET
            }
            let api = new Blockfrost(blockfrostOptions);
            /*
            * gets the latest tx metadata with label 55555
            * */
            let res = await api.getTransactionMetadataContentJSON("55555", `?count=100&page=1&order=desc`);
            chai.expect(res.data).to.be.a("array");
            chai.expect(res.status).to.equal(200);
        });
        it('get transaction metadata json by label', async function () {
            this.timeout(30000);
            let blockfrostOptions = {
                baseUrl: "https://cardano-mainnet.blockfrost.io",
                project_id: process.env.BLOCKFROST_MAINNET
            }
            let api = new Blockfrost(blockfrostOptions);
            /*
            * gets the latest tx metadata with label 55555
            * */
            let res = await api.getTransactionMetadataContentJSON("5555", `?count=100&page=1&order=desc`);
            chai.expect(res.data).to.be.a("array");
            chai.expect(res.status).to.equal(200);
        });
    });
});