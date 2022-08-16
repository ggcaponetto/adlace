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
            let api = new Adlace({port: 3333});
            let server = await api.runServer();
            await api.closeServer(server);
        });
        it('get the json metadata by address and label', async function () {
            let api = new Adlace({port: 3333});
            await api.getMetadataByAddress(
                "addr1qx5hcvf9fhurwcmpp49ktppgy2eyeydd56mr05caa6xmfa7j96jwfwh7s38c2leje8wwjm02dtzclrg3v2uxmxhemlpsuu8g2m",
                "55555",
                `?count=100&page=1&order=desc`
            )
            chai.expect(true).to.be.equal(false);
        });
    });
});
describe('Version', function () {
    describe('should get the api version', function () {
        it('get the version from the package.json', function () {
            let api = new Adlace({});
            let v = api.getVersion();
            chai.expect(v).to.be.a("string");
        });
    });
});