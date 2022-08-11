import assert from 'assert';
import chai from "chai";
import winston from "winston";
import * as dotenv from 'dotenv'
import API from "../../src/api/api.js"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
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
            let api = new API({});
            let v = api.getVersion();
            chai.expect(v).to.be.a("string");
        });
    });
});