import assert from 'assert';
import chai from "chai";
import winston from "winston";
import * as dotenv from 'dotenv'
import Adlace from "../../src/adlace/api.js"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()

// configure the logger
const mochaLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.Console({})
    ]
});

describe('Server', function () {
    describe('run the server', function () {
        it('run the server on a specific port', async function () {
            this.timeout(5000)
            let api = new Adlace({
                port: 3333,
                blockfrostOptions: {
                    baseUrl: "https://cardano-mainnet.blockfrost.io",
                    project_id: process.env.BLOCKFROST_MAINNET
                }
            });
            let server = await api.runServer();
            await api.closeServer(server);
        });
        it('run the server on a specific port until timeout',  async function (done) {
            let timeout = 1000 * 60 * 60
            this.timeout(timeout)
            let api = new Adlace({
                port: 3333,
                blockfrostOptions: {
                    baseUrl: "https://cardano-mainnet.blockfrost.io",
                    project_id: process.env.BLOCKFROST_MAINNET
                }
            });
            let server = await api.runServer();
            await new Promise((res) => setTimeout(res, timeout))
        });
        it('get the json metadata by address and label', async function () {
            let api = new Adlace({
                port: 3333,
                blockfrostOptions: {
                    baseUrl: "https://cardano-mainnet.blockfrost.io",
                    project_id: process.env.BLOCKFROST_MAINNET
                }
            });
            let matches = await api.getMetadataByAddress(
                "addr1qx5hcvf9fhurwcmpp49ktppgy2eyeydd56mr05caa6xmfa7j96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsuu8g2m",
                "55555",
                `?count=100&page=1&order=desc`
            )
            chai.expect(matches.length).to.be.gt(0);
        });
    });
});
describe('Version', function () {
    describe('should get the api version', function () {
        it('get the version from the package.json', function () {
            let api = new Adlace({
                port: 3333,
                blockfrostOptions: {
                    baseUrl: "https://cardano-mainnet.blockfrost.io",
                    project_id: process.env.BLOCKFROST_MAINNET
                }
            });
            let v = api.getVersion();
            chai.expect(v).to.be.a("string");
        });
    });
});