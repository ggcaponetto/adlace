import assert from 'assert';
import chai from "chai";
import winston from "winston";
import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
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
            chai.expect(bf).to.equal(null);
        });
    });
});